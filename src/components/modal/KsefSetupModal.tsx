// src/components/modal/KsefSetupModal.tsx
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { KSEF_TEST_PORTAL_URL } from '../../constants/urls';
import './ClientModal.css';

interface KsefSetupModalProps {
    mode: 'setup' | 'update-token';
    onClose: () => void;
    onSuccess: () => void;
}

export default function KsefSetupModal({ mode, onClose, onSuccess }: KsefSetupModalProps) {
    const { setupCompany, updateKsefToken } = useAuth();

    const [companyName, setCompanyName] = useState('');
    const [nip, setNip] = useState('');
    const [ksefToken, setKsefToken] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const nipDigits = nip.replace(/\D/g, '').slice(0, 10);
    const nipValid = /^\d{10}$/.test(nipDigits);
    const tokenValid = ksefToken.includes('|') && ksefToken.length > 20;

    const setupFormValid = companyName.trim().length >= 2 && nipValid && tokenValid;
    const updateFormValid = tokenValid;
    const formValid = mode === 'setup' ? setupFormValid : updateFormValid;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            if (mode === 'setup') {
                const result = await setupCompany(companyName.trim(), nipDigits, ksefToken.trim());
                if (result.success) {
                    onSuccess();
                } else {
                    setError(result.error || 'Błąd konfiguracji firmy');
                }
            } else {
                const result = await updateKsefToken(ksefToken.trim());
                if (result.success) {
                    onSuccess();
                } else {
                    setError(result.error || 'Błąd aktualizacji tokenu');
                }
            }
        } catch {
            setError('Błąd połączenia z serwerem');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 520 }}
            >
                <div className="modal-header">
                    <h2 className="modal-title">
                        {mode === 'setup'
                            ? '🏢 Skonfiguruj połączenie z KSeF'
                            : '🔑 Zaktualizuj token KSeF'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '16px',
                        color: '#fca5a5',
                        fontSize: '14px',
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {mode === 'setup' && (
                        <>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: 'var(--muted, #a4a9b6)',
                                    marginBottom: '6px',
                                }}>
                                    Nazwa firmy *
                                </label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Twoja Firma Sp. z o.o."
                                    disabled={isSubmitting}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        background: '#0f141b',
                                        border: '1px solid var(--border, #1f2733)',
                                        borderRadius: '8px',
                                        color: 'var(--text, #e6e9ef)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: 'var(--muted, #a4a9b6)',
                                    marginBottom: '6px',
                                }}>
                                    NIP *
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={nip}
                                    onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="np. 5252161248"
                                    disabled={isSubmitting}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        background: '#0f141b',
                                        border: '1px solid var(--border, #1f2733)',
                                        borderRadius: '8px',
                                        color: 'var(--text, #e6e9ef)',
                                        fontSize: '14px',
                                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                                <span style={{
                                    fontSize: '12px',
                                    color: nipValid ? 'var(--success, #22c55e)' : 'var(--muted, #a4a9b6)',
                                    marginTop: '4px',
                                    display: 'block',
                                }}>
                                    {nipValid ? '✓ NIP poprawny' : 'Wprowadź 10-cyfrowy NIP'}
                                </span>
                            </div>
                        </>
                    )}

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--muted, #a4a9b6)',
                            marginBottom: '6px',
                        }}>
                            Token KSeF *
                        </label>
                        <input
                            type="text"
                            value={ksefToken}
                            onChange={(e) => setKsefToken(e.target.value)}
                            placeholder="Wklej token z aplikacji KSeF MF"
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                background: '#0f141b',
                                border: '1px solid var(--border, #1f2733)',
                                borderRadius: '8px',
                                color: 'var(--text, #e6e9ef)',
                                fontSize: '13px',
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                        <span style={{
                            fontSize: '12px',
                            color: tokenValid ? 'var(--success, #22c55e)' : 'var(--muted, #a4a9b6)',
                            marginTop: '4px',
                            display: 'block',
                        }}>
                            {tokenValid ? '✓ Format tokenu poprawny' : 'Format: XXXX-XX-XXXX|nip-XXXX|hash'}
                        </span>
                    </div>

                    <div style={{
                        padding: '14px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#93c5fd',
                        marginBottom: '20px',
                    }}>
                        <strong>🔒 Bezpieczeństwo:</strong> Token KSeF jest szyfrowany algorytmem AES-256
                        i przechowywany w bezpiecznej formie. Nikt nie ma dostępu do Twojego tokenu w postaci jawnej.
                    </div>

                    <div style={{
                        padding: '14px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#93c5fd',
                        marginBottom: '20px',
                    }}>
                        <strong>Jak uzyskać token?</strong>
                        <ol style={{ margin: '8px 0 0 16px', padding: 0 }}>
                            <li>Wejdź na <a href={KSEF_TEST_PORTAL_URL} target="_blank" rel="noopener" style={{ color: '#60a5fa' }}>ap-test.ksef.mf.gov.pl</a></li>
                            <li>Zaloguj się podając NIP</li>
                            <li>Przejdź do Ustawienia → Tokeny</li>
                            <li>Wygeneruj token i wklej tutaj</li>
                        </ol>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            style={{
                                padding: '12px 24px',
                                background: 'transparent',
                                border: '1px solid var(--border, #1f2733)',
                                borderRadius: '8px',
                                color: 'var(--muted, #a4a9b6)',
                                fontSize: '14px',
                                cursor: 'pointer',
                            }}
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={!formValid || isSubmitting}
                            style={{
                                padding: '12px 24px',
                                background: formValid && !isSubmitting
                                    ? 'var(--accent, #22d3ee)' : 'rgba(34, 211, 238, 0.3)',
                                color: '#001018',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: formValid && !isSubmitting ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {isSubmitting
                                ? '⏳ Zapisywanie...'
                                : mode === 'setup'
                                    ? '🔗 Skonfiguruj firmę'
                                    : '🔑 Zapisz nowy token'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}