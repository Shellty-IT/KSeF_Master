// src/views/settings/tabs/KsefAuthMethodCard.tsx
import CertificateUpload from '../../../components/features/settings/CertificateUpload';

interface Props {
    authMethod: 'token' | 'certificate';
    hasCertificate: boolean;
    isSwitching: boolean;
    isEditingToken: boolean;
    setIsEditingToken: (v: boolean) => void;
    ksefToken: string;
    setKsefToken: (v: string) => void;
    isSubmitting: boolean;
    onSwitchMethod: (method: 'token' | 'certificate') => Promise<void>;
    onSaveToken: () => Promise<void>;
    onCertificateSuccess: () => Promise<void>;
}

export default function KsefAuthMethodCard({
    authMethod, hasCertificate, isSwitching,
    isEditingToken, setIsEditingToken,
    ksefToken, setKsefToken,
    isSubmitting,
    onSwitchMethod, onSaveToken, onCertificateSuccess,
}: Props) {
    return (
        <div className="card">
            <h3>🔐 Metoda uwierzytelniania</h3>
            <p className="hint ksef-setup-hint">
                Zmień metodę łączenia się z systemem KSeF w dowolnym momencie.
            </p>

            <div className="auth-method-selector">
                <label className="auth-method-option">
                    <input
                        type="radio"
                        name="authMethod"
                        value="token"
                        checked={authMethod === 'token'}
                        onChange={() => onSwitchMethod('token')}
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
                        onChange={() => onSwitchMethod('certificate')}
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
                <div className="ksef-method-extra">
                    <div className="ksef-token-header">
                        <h4 className="ksef-section-title">🔑 Token KSeF</h4>
                        {!isEditingToken && (
                            <button className="btn-light" onClick={() => setIsEditingToken(true)}>
                                ✏️ Zmień token
                            </button>
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
                                    className="input-mono"
                                />
                                <span className="input-hint">Format: XXXX-XX-XXXX|nip-XXXX|hash</span>
                            </label>
                            <div className="ksef-action-row">
                                <button
                                    className="btn-light btn-save"
                                    onClick={onSaveToken}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? '⏳ Zapisywanie...' : '💾 Zapisz'}
                                </button>
                                <button className="btn-light" onClick={() => { setIsEditingToken(false); setKsefToken(''); }}>
                                    Anuluj
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="hint ksef-token-hint">
                            Token jest przechowywany w bezpiecznej formie (szyfrowany AES-256).
                        </p>
                    )}
                </div>
            )}

            <div className="ksef-method-extra">
                <h4 className="ksef-section-title">📤 Zarządzanie certyfikatem</h4>
                <CertificateUpload onSuccess={onCertificateSuccess} />
            </div>
        </div>
    );
}
