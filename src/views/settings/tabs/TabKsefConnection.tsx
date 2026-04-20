// src/views/settings/tabs/TabKsefConnection.tsx
import { useState, useEffect, type ChangeEvent } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import CertificateUpload from '../../../components/settings/CertificateUpload';

export default function TabKsefConnection() {
    const {
        user,
        isKsefConnected,
        needsCompanySetup,
        authMethod,
        ksefEnvironment,
        hasCertificate,
        connectKsef,
        disconnectKsef,
        switchAuthMethod,
        setupCompany,
        updateCompanyProfile,
        updateKsefToken,
        updateKsefEnvironment,
        uploadCertificate,
        refreshUser,
    } = useAuth();

    const [companyName, setCompanyName] = useState('');
    const [nip, setNip] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<'token' | 'certificate'>('token');
    const [selectedEnvironment, setSelectedEnvironment] = useState<'Test' | 'Production'>('Test');
    const [ksefToken, setKsefToken] = useState('');

    const [setupCertFile, setSetupCertFile] = useState<File | null>(null);
    const [setupKeyFile, setSetupKeyFile] = useState<File | null>(null);
    const [setupCertPassword, setSetupCertPassword] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const [connectError, setConnectError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [errors, setErrors] = useState<string[]>([]);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingToken, setIsEditingToken] = useState(false);
    const [isEditingEnvironment, setIsEditingEnvironment] = useState(false);

    useEffect(() => {
        if (!needsCompanySetup) {
            setCompanyName(user?.company?.companyName ?? '');
            setNip(user?.company?.nip ?? '');
            setSelectedEnvironment((user?.company?.ksefEnvironment as 'Test' | 'Production') ?? 'Test');
        }
    }, [needsCompanySetup, user]);

    function showInfo(msg: string) {
        setInfo(msg);
        setTimeout(() => setInfo(null), 3000);
    }

    function handleCertFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.crt') && !file.name.endsWith('.cer')) {
                setErrors(prev => [...prev, 'Plik certyfikatu musi mieć rozszerzenie .crt lub .cer']);
                return;
            }
            setSetupCertFile(file);
            setErrors([]);
        }
    }

    function handleKeyFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.key') && !file.name.endsWith('.pem')) {
                setErrors(prev => [...prev, 'Klucz prywatny musi mieć rozszerzenie .key lub .pem']);
                return;
            }
            setSetupKeyFile(file);
            setErrors([]);
        }
    }

    async function handleSetupSubmit() {
        const errs: string[] = [];
        if (!companyName.trim()) errs.push('Nazwa firmy jest wymagana');
        if (!/^\d{10}$/.test(nip.trim())) errs.push('NIP musi mieć dokładnie 10 cyfr');

        if (selectedMethod === 'token') {
            if (!ksefToken.trim()) errs.push('Token KSeF jest wymagany');
            else if (!ksefToken.includes('|')) errs.push('Nieprawidłowy format tokenu KSeF');
        }
        if (selectedMethod === 'certificate') {
            if (!setupCertFile) errs.push('Wybierz plik certyfikatu (.crt)');
            if (!setupKeyFile) errs.push('Wybierz plik klucza prywatnego (.key)');
        }

        setErrors(errs);
        if (errs.length) return;

        setIsSubmitting(true);
        setConnectError(null);

        try {
            if (selectedMethod === 'token') {
                const result = await setupCompany(
                    companyName.trim(),
                    nip.trim(),
                    ksefToken.trim(),
                    selectedEnvironment
                );
                if (!result.success) throw new Error(result.error);
            } else {
                const placeholder = `CERT-SETUP|nip-${nip.trim()}|hash`;
                const setupResult = await setupCompany(
                    companyName.trim(),
                    nip.trim(),
                    placeholder,
                    selectedEnvironment
                );
                if (!setupResult.success) throw new Error(setupResult.error);

                if (setupCertFile && setupKeyFile) {
                    const uploadResult = await uploadCertificate(
                        setupCertFile,
                        setupKeyFile,
                        setupCertPassword || undefined
                    );
                    if (!uploadResult.success) throw new Error(uploadResult.error);
                }

                const switchResult = await switchAuthMethod('certificate');
                if (!switchResult.success) throw new Error(switchResult.error);
            }

            await refreshUser();
            setSetupCertFile(null);
            setSetupKeyFile(null);
            setSetupCertPassword('');
            showInfo('Firma skonfigurowana pomyślnie! Możesz teraz połączyć się z KSeF.');
        } catch (err) {
            setErrors([err instanceof Error ? err.message : 'Nieznany błąd konfiguracji']);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleConnect() {
        setIsConnecting(true);
        setConnectError(null);
        const result = await connectKsef();
        setIsConnecting(false);
        if (!result.success) {
            setConnectError(result.error || 'Błąd połączenia z KSeF');
        } else {
            showInfo('Połączono z KSeF pomyślnie.');
        }
    }

    async function handleDisconnect() {
        if (!confirm('Czy na pewno chcesz odłączyć się od systemu KSeF?')) return;
        setIsConnecting(true);
        setConnectError(null);
        const result = await disconnectKsef();
        setIsConnecting(false);
        if (!result.success) {
            setConnectError(result.error || 'Błąd odłączania od KSeF');
        } else {
            showInfo('Odłączono od KSeF.');
        }
    }

    async function handleSwitchMethod(method: 'token' | 'certificate') {
        if (method === authMethod) return;
        setIsSwitching(true);
        const result = await switchAuthMethod(method);
        setIsSwitching(false);
        if (!result.success) {
            alert(result.error || 'Błąd zmiany metody uwierzytelniania');
            return;
        }
        await refreshUser();
        showInfo(`Metoda zmieniona na: ${method === 'token' ? 'Token autoryzacyjny' : 'Certyfikat'}`);
    }

    async function handleSaveProfile() {
        const errs: string[] = [];
        if (!companyName.trim()) errs.push('Nazwa firmy jest wymagana');
        if (!/^\d{10}$/.test(nip.trim())) errs.push('NIP musi mieć dokładnie 10 cyfr');
        setErrors(errs);
        if (errs.length) return;

        setIsSubmitting(true);
        const result = await updateCompanyProfile(companyName.trim(), nip.trim());
        setIsSubmitting(false);

        if (!result.success) {
            setErrors([result.error || 'Błąd zapisu']);
            return;
        }

        await refreshUser();
        setIsEditingProfile(false);
        showInfo('Dane firmy zaktualizowane.');
    }

    async function handleSaveToken() {
        if (!ksefToken.trim() || !ksefToken.includes('|')) {
            setErrors(['Nieprawidłowy format tokenu KSeF']);
            return;
        }
        setIsSubmitting(true);
        const result = await updateKsefToken(ksefToken.trim());
        setIsSubmitting(false);
        if (!result.success) {
            setErrors([result.error || 'Błąd aktualizacji tokenu']);
            return;
        }
        setIsEditingToken(false);
        setKsefToken('');
        setErrors([]);
        showInfo('Token KSeF zaktualizowany.');
    }

    async function handleSaveEnvironment() {
        setIsSubmitting(true);
        const result = await updateKsefEnvironment(selectedEnvironment);
        setIsSubmitting(false);

        if (!result.success) {
            setErrors([result.error || 'Błąd zmiany środowiska']);
            return;
        }

        await refreshUser();
        setIsEditingEnvironment(false);
        setErrors([]);
        showInfo(`Środowisko zmienione na: ${selectedEnvironment}`);
    }

    async function handleCertificateSuccess() {
        await refreshUser();
        showInfo('Certyfikat zaktualizowany.');
    }

    const isSetupView = needsCompanySetup;

    const getEnvironmentBadge = (env: string) => {
        if (env === 'Production') {
            return (
                <span style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#fca5a5',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.5px',
                    marginLeft: '8px',
                }}>
                    🔴 PRODUKCJA
                </span>
            );
        }
        return (
            <span style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px',
                marginLeft: '8px',
            }}>
                🟡 TEST
            </span>
        );
    };

    return (
        <div>
            {info && <div className="info-banner">{info}</div>}

            {errors.length > 0 && (
                <div className="error-message" style={{ marginBottom: 16 }}>
                    <strong>Popraw błędy:</strong>
                    <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
            )}

            {isSetupView ? (
                <>
                    <div className="card">
                        <h3>🏢 Konfiguracja firmy</h3>
                        <p className="hint" style={{ marginBottom: '20px' }}>
                            Podaj dane firmy i wybierz metodę uwierzytelniania z systemem KSeF.
                        </p>

                        <label>Nazwa firmy *
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Twoja Firma Sp. z o.o."
                            />
                        </label>

                        <label>NIP *
                            <input
                                type="text"
                                inputMode="numeric"
                                value={nip}
                                onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="np. 5252161248"
                                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}
                            />
                            <span className="input-hint">10-cyfrowy NIP firmy</span>
                        </label>
                    </div>

                    <div className="card">
                        <h3>⚙️ Środowisko KSeF</h3>
                        <p className="hint" style={{ marginBottom: '16px' }}>
                            Wybierz środowisko systemu KSeF. <strong>UWAGA:</strong> Środowisko produkcyjne służy do wystawiania faktur o pełnej mocy prawnej.
                        </p>

                        <div className="auth-method-selector">
                            <label className="auth-method-option">
                                <input
                                    type="radio"
                                    name="setupEnvironment"
                                    value="Test"
                                    checked={selectedEnvironment === 'Test'}
                                    onChange={() => setSelectedEnvironment('Test')}
                                />
                                <div className="auth-method-content">
                                    <div className="auth-method-icon">🟡</div>
                                    <div className="auth-method-text">
                                        <div className="auth-method-title">Środowisko testowe</div>
                                        <div className="auth-method-description">
                                            Dane fikcyjne, brak skutków prawnych. Idealne do testów integracji.
                                        </div>
                                    </div>
                                </div>
                            </label>

                            <label className="auth-method-option">
                                <input
                                    type="radio"
                                    name="setupEnvironment"
                                    value="Production"
                                    checked={selectedEnvironment === 'Production'}
                                    onChange={() => setSelectedEnvironment('Production')}
                                />
                                <div className="auth-method-content">
                                    <div className="auth-method-icon">🔴</div>
                                    <div className="auth-method-text">
                                        <div className="auth-method-title">Środowisko produkcyjne</div>
                                        <div className="auth-method-description" style={{ color: '#fca5a5' }}>
                                            <strong>Faktury o pełnej mocy prawnej.</strong> Używaj tylko prawdziwych danych i certyfikatów kwalifikowanych.
                                        </div>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="card">
                        <h3>🔐 Metoda uwierzytelniania KSeF</h3>
                        <p className="hint" style={{ marginBottom: '16px' }}>
                            Wybierz metodę łączenia się z systemem KSeF. Możesz ją zmienić później.
                        </p>

                        <div className="auth-method-selector">
                            <label className="auth-method-option">
                                <input
                                    type="radio"
                                    name="setupMethod"
                                    value="token"
                                    checked={selectedMethod === 'token'}
                                    onChange={() => setSelectedMethod('token')}
                                />
                                <div className="auth-method-content">
                                    <div className="auth-method-icon">🔑</div>
                                    <div className="auth-method-text">
                                        <div className="auth-method-title">Token autoryzacyjny</div>
                                        <div className="auth-method-description">
                                            Standardowe uwierzytelnianie tokenem generowanym w systemie KSeF
                                        </div>
                                    </div>
                                </div>
                            </label>

                            <label className="auth-method-option">
                                <input
                                    type="radio"
                                    name="setupMethod"
                                    value="certificate"
                                    checked={selectedMethod === 'certificate'}
                                    onChange={() => setSelectedMethod('certificate')}
                                />
                                <div className="auth-method-content">
                                    <div className="auth-method-icon">🔐</div>
                                    <div className="auth-method-text">
                                        <div className="auth-method-title">Certyfikat KSeF</div>
                                        <div className="auth-method-description">
                                            Uwierzytelnianie za pomocą certyfikatu wygenerowanego w systemie KSeF (XAdES)
                                        </div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {selectedMethod === 'token' && (
                            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                                <label>Token KSeF *
                                    <input
                                        type="text"
                                        value={ksefToken}
                                        onChange={(e) => setKsefToken(e.target.value)}
                                        placeholder="Wklej token z aplikacji KSeF"
                                        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}
                                    />
                                    <span className="input-hint">Format: XXXX-XX-XXXX|nip-XXXX|hash</span>
                                </label>
                            </div>
                        )}

                        {selectedMethod === 'certificate' && (
                            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                                <p className="hint" style={{ marginBottom: '16px', fontSize: '13px' }}>
                                    💡 Wybierz pliki certyfikatu i klucza prywatnego. Zostaną przesłane razem z konfiguracją firmy.
                                </p>

                                <label className="certificate-file-label" style={{ marginBottom: '12px' }}>
                                    <span className="certificate-file-label-text">📄 Certyfikat (.crt lub .cer)</span>
                                    <input type="file" accept=".crt,.cer" onChange={handleCertFileChange} className="certificate-file-input" />
                                    {setupCertFile && <span className="certificate-file-name">✅ {setupCertFile.name}</span>}
                                </label>

                                <label className="certificate-file-label" style={{ marginBottom: '12px' }}>
                                    <span className="certificate-file-label-text">🔑 Klucz prywatny (.key lub .pem)</span>
                                    <input type="file" accept=".key,.pem" onChange={handleKeyFileChange} className="certificate-file-input" />
                                    {setupKeyFile && <span className="certificate-file-name">✅ {setupKeyFile.name}</span>}
                                </label>

                                <label style={{ marginTop: '8px' }}>
                                    🔐 Hasło klucza prywatnego (opcjonalne)
                                    <input
                                        type="password"
                                        value={setupCertPassword}
                                        onChange={(e) => setSetupCertPassword(e.target.value)}
                                        placeholder="Pozostaw puste jeśli klucz nie jest chroniony hasłem"
                                        autoComplete="new-password"
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '4px' }}>
                        <PrimaryButton onClick={handleSetupSubmit} disabled={isSubmitting}>
                            {isSubmitting ? '⏳ Konfigurowanie...' : '🏢 Skonfiguruj firmę'}
                        </PrimaryButton>
                    </div>
                </>
            ) : (
                <>
                    <div className="card">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: isEditingProfile ? '20px' : '0',
                            paddingBottom: '12px',
                            borderBottom: '1px solid var(--border)',
                        }}>
                            <h3 style={{ margin: 0, padding: 0, border: 'none' }}>🏢 Dane firmy</h3>
                            {!isEditingProfile && (
                                <button className="btn-light" onClick={() => setIsEditingProfile(true)}>
                                    ✏️ Edytuj
                                </button>
                            )}
                        </div>

                        {isEditingProfile ? (
                            <>
                                <label style={{ marginTop: '16px' }}>Nazwa firmy *
                                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Twoja Firma Sp. z o.o." />
                                </label>
                                <label>NIP *
                                    <input type="text" inputMode="numeric" value={nip} onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="np. 5252161248" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }} />
                                    <span className="input-hint">10-cyfrowy NIP firmy</span>
                                </label>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                    <button className="btn-light" onClick={handleSaveProfile} disabled={isSubmitting} style={{ background: 'var(--accent)', color: '#001018', border: 'none', fontWeight: 700 }}>
                                        {isSubmitting ? '⏳ Zapisywanie...' : '💾 Zapisz zmiany'}
                                    </button>
                                    <button className="btn-light" onClick={() => { setIsEditingProfile(false); setCompanyName(user?.company?.companyName ?? ''); setNip(user?.company?.nip ?? ''); setErrors([]); }}>Anuluj</button>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginTop: '16px' }}>
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nazwa firmy</span>
                                    <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 600, marginTop: '4px' }}>{user?.company?.companyName ?? '—'}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NIP</span>
                                    <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 600, marginTop: '4px', fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}>{user?.company?.nip ?? '—'}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                            borderBottom: '1px solid var(--border)',
                        }}>
                            <h3 style={{ margin: 0, padding: 0, border: 'none' }}>
                                ⚙️ Środowisko KSeF
                                {getEnvironmentBadge(ksefEnvironment)}
                            </h3>
                            {!isEditingEnvironment && (
                                <button className="btn-light" onClick={() => setIsEditingEnvironment(true)}>
                                    ✏️ Zmień
                                </button>
                            )}
                        </div>

                        {isEditingEnvironment ? (
                            <>
                                <div className="auth-method-selector" style={{ marginTop: '16px' }}>
                                    <label className="auth-method-option">
                                        <input
                                            type="radio"
                                            name="environment"
                                            value="Test"
                                            checked={selectedEnvironment === 'Test'}
                                            onChange={() => setSelectedEnvironment('Test')}
                                        />
                                        <div className="auth-method-content">
                                            <div className="auth-method-icon">🟡</div>
                                            <div className="auth-method-text">
                                                <div className="auth-method-title">Środowisko testowe</div>
                                                <div className="auth-method-description">Dane fikcyjne, brak skutków prawnych</div>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="auth-method-option">
                                        <input
                                            type="radio"
                                            name="environment"
                                            value="Production"
                                            checked={selectedEnvironment === 'Production'}
                                            onChange={() => setSelectedEnvironment('Production')}
                                        />
                                        <div className="auth-method-content">
                                            <div className="auth-method-icon">🔴</div>
                                            <div className="auth-method-text">
                                                <div className="auth-method-title">Środowisko produkcyjne</div>
                                                <div className="auth-method-description" style={{ color: '#fca5a5' }}>
                                                    <strong>Faktury o pełnej mocy prawnej</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                    <button
                                        className="btn-light"
                                        onClick={handleSaveEnvironment}
                                        disabled={isSubmitting}
                                        style={{ background: 'var(--accent)', color: '#001018', border: 'none', fontWeight: 700 }}
                                    >
                                        {isSubmitting ? '⏳ Zapisywanie...' : '💾 Zapisz zmiany'}
                                    </button>
                                    <button
                                        className="btn-light"
                                        onClick={() => {
                                            setIsEditingEnvironment(false);
                                            setSelectedEnvironment((user?.company?.ksefEnvironment as 'Test' | 'Production') ?? 'Test');
                                            setErrors([]);
                                        }}
                                    >
                                        Anuluj
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p className="hint" style={{ margin: 0 }}>
                                {ksefEnvironment === 'Production'
                                    ? '🔴 Połączenie z systemem produkcyjnym. Wszystkie faktury mają pełną moc prawną.'
                                    : '🟡 Połączenie z systemem testowym. Dane są fikcyjne i służą wyłącznie celom rozwojowym.'}
                            </p>
                        )}
                    </div>

                    <div className="card">
                        <h3>🔗 Status połączenia z KSeF</h3>
                        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginBottom: '20px' }}>
                            <div>
                                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Status</span>
                                <div style={{ fontSize: '14px', color: isKsefConnected ? 'var(--success)' : 'var(--danger)', fontWeight: 600, marginTop: '4px' }}>
                                    {isKsefConnected ? '🟢 Połączony' : '🔴 Niepołączony'}
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Metoda</span>
                                <div style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 600, marginTop: '4px', fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}>
                                    {authMethod === 'certificate' ? '🔐 Certyfikat' : '🔑 Token'}
                                </div>
                            </div>
                        </div>

                        {connectError && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                padding: '12px',
                                color: '#fca5a5',
                                fontSize: '14px',
                                marginBottom: '16px'
                            }}>
                                ⚠️ {connectError}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {!isKsefConnected ? (
                                <button
                                    className="btn-light"
                                    onClick={handleConnect}
                                    disabled={isConnecting}
                                    style={{ background: 'var(--accent)', color: '#001018', border: 'none', fontWeight: 700 }}
                                >
                                    {isConnecting ? '⏳ Łączenie...' : '🔗 Połącz z KSeF'}
                                </button>
                            ) : (
                                <button
                                    className="btn-light"
                                    onClick={handleDisconnect}
                                    disabled={isConnecting}
                                    style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}
                                >
                                    {isConnecting ? '⏳ Odłączanie...' : '🔌 Odłącz od KSeF'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <h3>🔐 Metoda uwierzytelniania</h3>
                        <p className="hint" style={{ marginBottom: '16px' }}>
                            Zmień metodę łączenia się z systemem KSeF w dowolnym momencie.
                        </p>

                        <div className="auth-method-selector">
                            <label className="auth-method-option">
                                <input
                                    type="radio"
                                    name="authMethod"
                                    value="token"
                                    checked={authMethod === 'token'}
                                    onChange={() => handleSwitchMethod('token')}
                                    disabled={isSwitching}
                                />
                                <div className="auth-method-content">
                                    <div className="auth-method-icon">🔑</div>
                                    <div className="auth-method-text">
                                        <div className="auth-method-title">Token autoryzacyjny</div>
                                        <div className="auth-method-description">
                                            Standardowe uwierzytelnianie tokenem generowanym w systemie KSeF
                                        </div>
                                    </div>
                                </div>
                            </label>
                            <label className="auth-method-option">
                                <input
                                    type="radio"
                                    name="authMethod"
                                    value="certificate"
                                    checked={authMethod === 'certificate'}
                                    onChange={() => handleSwitchMethod('certificate')}
                                    disabled={isSwitching || !hasCertificate}
                                />
                                <div className="auth-method-content">
                                    <div className="auth-method-icon">🔐</div>
                                    <div className="auth-method-text">
                                        <div className="auth-method-title">
                                            Certyfikat KSeF
                                            {!hasCertificate && (
                                                <span className="auth-method-badge">Wymaga przesłania</span>
                                            )}
                                        </div>
                                        <div className="auth-method-description">
                                            Uwierzytelnianie za pomocą certyfikatu wygenerowanego w systemie KSeF (XAdES)
                                        </div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {authMethod === 'token' && (
                            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>🔑 Token KSeF</h4>
                                    {!isEditingToken && (
                                        <button className="btn-light" onClick={() => setIsEditingToken(true)}>✏️ Zmień token</button>
                                    )}
                                </div>
                                {isEditingToken ? (
                                    <>
                                        <label>Nowy token KSeF *
                                            <input
                                                type="text"
                                                value={ksefToken}
                                                onChange={(e) => setKsefToken(e.target.value)}
                                                placeholder="Wklej nowy token z aplikacji KSeF"
                                                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}
                                            />
                                            <span className="input-hint">Format: XXXX-XX-XXXX|nip-XXXX|hash</span>
                                        </label>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                            <button
                                                className="btn-light"
                                                onClick={handleSaveToken}
                                                disabled={isSubmitting}
                                                style={{ background: 'var(--accent)', color: '#001018', border: 'none', fontWeight: 700 }}
                                            >
                                                {isSubmitting ? '⏳ Zapisywanie...' : '💾 Zapisz'}
                                            </button>
                                            <button className="btn-light" onClick={() => { setIsEditingToken(false); setKsefToken(''); setErrors([]); }}>Anuluj</button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="hint" style={{ fontSize: '13px', margin: 0 }}>
                                        Token jest przechowywany w bezpiecznej formie (szyfrowany AES-256).
                                    </p>
                                )}
                            </div>
                        )}

                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
                                📤 Zarządzanie certyfikatem
                            </h4>
                            <CertificateUpload onSuccess={handleCertificateSuccess} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}