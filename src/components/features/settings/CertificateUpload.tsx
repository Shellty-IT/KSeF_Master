// src/components/features/settings/CertificateUpload.tsx
import { useState, type ChangeEvent } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import PrimaryButton from '../../ui/PrimaryButton';

interface CertificateUploadProps {
    onSuccess?: () => void;
}

export default function CertificateUpload({ onSuccess }: CertificateUploadProps) {
    const { uploadCertificate, getCertificateInfo, deleteCertificate, hasCertificate } = useAuth();

    const [certFile, setCertFile] = useState<File | null>(null);
    const [keyFile, setKeyFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [certInfo, setCertInfo] = useState<{
        subjectName?: string;
        notBefore?: string;
        notAfter?: string;
        uploadedAt?: string;
        isPasswordProtected?: boolean;
    } | null>(null);
    const [showInfo, setShowInfo] = useState(false);

    const handleCertChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.crt') && !file.name.endsWith('.cer')) {
                setError('Plik certyfikatu musi mieć rozszerzenie .crt lub .cer');
                return;
            }
            setCertFile(file);
            setError(null);
        }
    };

    const handleKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.key') && !file.name.endsWith('.pem')) {
                setError('Klucz prywatny musi mieć rozszerzenie .key lub .pem');
                return;
            }
            setKeyFile(file);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!certFile || !keyFile) {
            setError('Wybierz oba pliki: certyfikat (.crt) i klucz prywatny (.key)');
            return;
        }

        setIsUploading(true);
        setError(null);
        setSuccess(null);

        const result = await uploadCertificate(certFile, keyFile, password || undefined);

        setIsUploading(false);

        if (!result.success) {
            setError(result.error || 'Błąd przesyłania certyfikatu');
            return;
        }

        setSuccess('Certyfikat przesłany pomyślnie!');
        setCertFile(null);
        setKeyFile(null);
        setPassword('');

        setTimeout(() => setSuccess(null), 3000);

        if (onSuccess) onSuccess();
    };

    const handleDelete = async () => {
        if (!confirm('Czy na pewno chcesz usunąć certyfikat? Metoda uwierzytelniania zostanie zmieniona na token.')) {
            return;
        }

        setIsDeleting(true);
        setError(null);

        const result = await deleteCertificate();

        setIsDeleting(false);

        if (!result.success) {
            setError(result.error || 'Błąd usuwania certyfikatu');
            return;
        }

        setSuccess('Certyfikat usunięty pomyślnie. Metoda zmieniona na token.');
        setCertInfo(null);
        setShowInfo(false);

        setTimeout(() => setSuccess(null), 3000);

        if (onSuccess) onSuccess();
    };

    const handleShowInfo = async () => {
        if (showInfo) {
            setShowInfo(false);
            return;
        }

        const info = await getCertificateInfo();
        if (info) {
            setCertInfo(info);
            setShowInfo(true);
        }
    };

    return (
        <div className="certificate-upload-container">
            {success && (
                <div className="info-banner" style={{ marginBottom: '16px' }}>
                    {success}
                </div>
            )}

            {error && (
                <div className="error-message" style={{ marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            {hasCertificate ? (
                <div className="certificate-status">
                    <div className="certificate-status-header">
                        <div className="certificate-status-icon">🔐</div>
                        <div className="certificate-status-text">
                            <div className="certificate-status-title">Certyfikat zainstalowany</div>
                            <div className="certificate-status-subtitle">
                                Możesz połączyć się z KSeF używając certyfikatu kwalifikowanego
                            </div>
                        </div>
                    </div>

                    {showInfo && certInfo && (
                        <div className="certificate-info-box">
                            {certInfo.subjectName && (
                                <div className="certificate-info-row">
                                    <span className="certificate-info-label">Podmiot:</span>
                                    <span className="certificate-info-value">{certInfo.subjectName}</span>
                                </div>
                            )}
                            {certInfo.notBefore && (
                                <div className="certificate-info-row">
                                    <span className="certificate-info-label">Ważny od:</span>
                                    <span className="certificate-info-value">
                                        {new Date(certInfo.notBefore).toLocaleDateString('pl-PL')}
                                    </span>
                                </div>
                            )}
                            {certInfo.notAfter && (
                                <div className="certificate-info-row">
                                    <span className="certificate-info-label">Ważny do:</span>
                                    <span className="certificate-info-value">
                                        {new Date(certInfo.notAfter).toLocaleDateString('pl-PL')}
                                    </span>
                                </div>
                            )}
                            {certInfo.uploadedAt && (
                                <div className="certificate-info-row">
                                    <span className="certificate-info-label">Przesłany:</span>
                                    <span className="certificate-info-value">
                                        {new Date(certInfo.uploadedAt).toLocaleDateString('pl-PL')}
                                    </span>
                                </div>
                            )}
                            <div className="certificate-info-row">
                                <span className="certificate-info-label">Hasło:</span>
                                <span className="certificate-info-value">
                                    {certInfo.isPasswordProtected ? '🔒 Chroniony hasłem' : '🔓 Bez hasła'}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="certificate-actions">
                        <button className="btn-light" onClick={handleShowInfo}>
                            {showInfo ? '🔼 Ukryj szczegóły' : '🔽 Pokaż szczegóły'}
                        </button>
                        <button
                            className="btn-danger"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? '⏳ Usuwanie...' : '🗑️ Usuń certyfikat'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="certificate-upload-form">
                    <p className="hint" style={{ marginBottom: '16px', fontSize: '14px' }}>
                        💡 Prześlij certyfikat KSeF (.crt) i klucz prywatny (.key) wygenerowane w systemie KSeF
                    </p>

                    <div className="certificate-file-inputs">
                        <label className="certificate-file-label">
                            <span className="certificate-file-label-text">
                                📄 Certyfikat (.crt lub .cer)
                            </span>
                            <input
                                type="file"
                                accept=".crt,.cer"
                                onChange={handleCertChange}
                                className="certificate-file-input"
                            />
                            {certFile && (
                                <span className="certificate-file-name">
                                    ✅ {certFile.name}
                                </span>
                            )}
                        </label>

                        <label className="certificate-file-label">
                            <span className="certificate-file-label-text">
                                🔑 Klucz prywatny (.key lub .pem)
                            </span>
                            <input
                                type="file"
                                accept=".key,.pem"
                                onChange={handleKeyChange}
                                className="certificate-file-input"
                            />
                            {keyFile && (
                                <span className="certificate-file-name">
                                    ✅ {keyFile.name}
                                </span>
                            )}
                        </label>
                    </div>

                    <label style={{ marginTop: '12px' }}>
                        🔐 Hasło klucza prywatnego (opcjonalne)
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Pozostaw puste jeśli klucz nie jest chroniony hasłem"
                            autoComplete="new-password"
                        />
                    </label>

                    <div style={{ marginTop: '16px' }}>
                        <PrimaryButton
                            onClick={handleUpload}
                            disabled={isUploading || !certFile || !keyFile}
                        >
                            {isUploading ? '⏳ Przesyłanie...' : '📤 Prześlij certyfikat'}
                        </PrimaryButton>
                    </div>
                </div>
            )}
        </div>
    );
}
