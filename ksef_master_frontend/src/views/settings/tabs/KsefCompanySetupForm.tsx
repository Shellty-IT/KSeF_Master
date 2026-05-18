// src/views/settings/tabs/KsefCompanySetupForm.tsx
import type { ChangeEvent } from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';

interface Props {
    companyName: string;
    setCompanyName: (v: string) => void;
    nip: string;
    setNip: (v: string) => void;
    selectedMethod: 'token' | 'certificate';
    setSelectedMethod: (v: 'token' | 'certificate') => void;
    selectedEnvironment: 'Test' | 'Production';
    setSelectedEnvironment: (v: 'Test' | 'Production') => void;
    ksefToken: string;
    setKsefToken: (v: string) => void;
    setupCertFile: File | null;
    setupKeyFile: File | null;
    setupCertPassword: string;
    setSetupCertPassword: (v: string) => void;
    isSubmitting: boolean;
    onCertFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onKeyFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onSubmit: () => Promise<void>;
}

export default function KsefCompanySetupForm({
    companyName, setCompanyName,
    nip, setNip,
    selectedMethod, setSelectedMethod,
    selectedEnvironment, setSelectedEnvironment,
    ksefToken, setKsefToken,
    setupCertFile, setupKeyFile,
    setupCertPassword, setSetupCertPassword,
    isSubmitting,
    onCertFileChange, onKeyFileChange,
    onSubmit,
}: Props) {
    return (
        <>
            <div className="card">
                <h3>🏢 Konfiguracja firmy</h3>
                <p className="hint ksef-setup-hint">
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
                        className="input-mono"
                    />
                    <span className="input-hint">10-cyfrowy NIP firmy</span>
                </label>
            </div>

            <div className="card">
                <h3>⚙️ Środowisko KSeF</h3>
                <p className="hint ksef-setup-hint">
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
                                <div className="auth-method-description auth-method-description--danger">
                                    <strong>Faktury o pełnej mocy prawnej.</strong> Używaj tylko prawdziwych danych i certyfikatów kwalifikowanych.
                                </div>
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            <div className="card">
                <h3>🔐 Metoda uwierzytelniania KSeF</h3>
                <p className="hint ksef-setup-hint">
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
                    <div className="ksef-method-extra">
                        <label>Token KSeF *
                            <input
                                type="text"
                                value={ksefToken}
                                onChange={(e) => setKsefToken(e.target.value)}
                                placeholder="Wklej token z aplikacji KSeF"
                                className="input-mono"
                            />
                            <span className="input-hint">Format: XXXX-XX-XXXX|nip-XXXX|hash</span>
                        </label>
                    </div>
                )}

                {selectedMethod === 'certificate' && (
                    <div className="ksef-method-extra">
                        <p className="hint ksef-cert-hint">
                            💡 Wybierz pliki certyfikatu i klucza prywatnego. Zostaną przesłane razem z konfiguracją firmy.
                        </p>

                        <label className="certificate-file-label">
                            <span className="certificate-file-label-text">📄 Certyfikat (.crt lub .cer)</span>
                            <input type="file" accept=".crt,.cer" onChange={onCertFileChange} className="certificate-file-input" />
                            {setupCertFile && <span className="certificate-file-name">✅ {setupCertFile.name}</span>}
                        </label>

                        <label className="certificate-file-label">
                            <span className="certificate-file-label-text">🔑 Klucz prywatny (.key lub .pem)</span>
                            <input type="file" accept=".key,.pem" onChange={onKeyFileChange} className="certificate-file-input" />
                            {setupKeyFile && <span className="certificate-file-name">✅ {setupKeyFile.name}</span>}
                        </label>

                        <label>
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

            <div className="ksef-setup-submit">
                <PrimaryButton onClick={onSubmit} disabled={isSubmitting}>
                    {isSubmitting ? '⏳ Konfigurowanie...' : '🏢 Skonfiguruj firmę'}
                </PrimaryButton>
            </div>
        </>
    );
}
