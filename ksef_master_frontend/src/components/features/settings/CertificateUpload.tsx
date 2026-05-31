import { useState, type ChangeEvent } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import PrimaryButton from '../../ui/PrimaryButton';
import { ShieldCheck, Upload, CheckCircle2, ChevronDown, ChevronUp, Trash2, AlertCircle, Loader2 } from 'lucide-react';

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
        subjectName?: string; notBefore?: string; notAfter?: string;
        uploadedAt?: string; isPasswordProtected?: boolean;
    } | null>(null);
    const [showInfo, setShowInfo] = useState(false);

    const handleCertChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.endsWith('.crt') && !file.name.endsWith('.cer')) {
            setError('Plik certyfikatu musi mieć rozszerzenie .crt lub .cer'); return;
        }
        setCertFile(file); setError(null);
    };

    const handleKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.endsWith('.key') && !file.name.endsWith('.pem')) {
            setError('Klucz prywatny musi mieć rozszerzenie .key lub .pem'); return;
        }
        setKeyFile(file); setError(null);
    };

    const handleUpload = async () => {
        if (!certFile || !keyFile) { setError('Wybierz oba pliki: certyfikat (.crt) i klucz prywatny (.key)'); return; }
        setIsUploading(true); setError(null); setSuccess(null);
        const result = await uploadCertificate(certFile, keyFile, password || undefined);
        setIsUploading(false);
        if (!result.success) { setError(result.error || 'Błąd przesyłania certyfikatu'); return; }
        setSuccess('Certyfikat przesłany pomyślnie!');
        setCertFile(null); setKeyFile(null); setPassword('');
        setTimeout(() => setSuccess(null), 3000);
        onSuccess?.();
    };

    const handleDelete = async () => {
        if (!confirm('Czy na pewno chcesz usunąć certyfikat? Metoda uwierzytelniania zostanie zmieniona na token.')) return;
        setIsDeleting(true); setError(null);
        const result = await deleteCertificate();
        setIsDeleting(false);
        if (!result.success) { setError(result.error || 'Błąd usuwania certyfikatu'); return; }
        setSuccess('Certyfikat usunięty pomyślnie. Metoda zmieniona na token.');
        setCertInfo(null); setShowInfo(false);
        setTimeout(() => setSuccess(null), 3000);
        onSuccess?.();
    };

    const handleShowInfo = async () => {
        if (showInfo) { setShowInfo(false); return; }
        const info = await getCertificateInfo();
        if (info) { setCertInfo(info); setShowInfo(true); }
    };

    return (
        <div className="space-y-3">
            {success && <div className="rounded-lg border border-accent/20 bg-accent/10 px-4 py-2.5 text-sm text-accent">{success}</div>}
            {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
                </div>
            )}

            {hasCertificate ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                        <ShieldCheck className="h-5 w-5 text-accent" />
                        <div>
                            <p className="text-sm font-medium text-foreground">Certyfikat zainstalowany</p>
                            <p className="text-[12px] text-muted-foreground">Certyfikat pobrany z aplikacji KSeF gotowy do użycia</p>
                        </div>
                    </div>

                    {showInfo && certInfo && (
                        <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
                            {certInfo.subjectName && <div className="flex justify-between"><span className="text-muted-foreground">Podmiot:</span><span className="font-medium">{certInfo.subjectName}</span></div>}
                            {certInfo.notBefore && <div className="flex justify-between"><span className="text-muted-foreground">Ważny od:</span><span>{new Date(certInfo.notBefore).toLocaleDateString('pl-PL')}</span></div>}
                            {certInfo.notAfter && <div className="flex justify-between"><span className="text-muted-foreground">Ważny do:</span><span>{new Date(certInfo.notAfter).toLocaleDateString('pl-PL')}</span></div>}
                            {certInfo.uploadedAt && <div className="flex justify-between"><span className="text-muted-foreground">Przesłany:</span><span>{new Date(certInfo.uploadedAt).toLocaleDateString('pl-PL')}</span></div>}
                            <div className="flex justify-between"><span className="text-muted-foreground">Hasło:</span><span>{certInfo.isPasswordProtected ? 'Chroniony hasłem' : 'Bez hasła'}</span></div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] transition hover:bg-secondary"
                            onClick={handleShowInfo}>
                            {showInfo ? <><ChevronUp className="h-3.5 w-3.5" />Ukryj szczegóły</> : <><ChevronDown className="h-3.5 w-3.5" />Pokaż szczegóły</>}
                        </button>
                        <button className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-[12px] font-medium text-destructive transition hover:bg-destructive/20 disabled:opacity-40"
                            onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Usuwanie...</> : <><Trash2 className="h-3.5 w-3.5" />Usuń certyfikat</>}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-[12px] text-muted-foreground">Prześlij certyfikat KSeF (.crt) i klucz prywatny (.key) wygenerowane w systemie KSeF</p>
                    {[
                        { label: 'Certyfikat (.crt lub .cer)', accept: '.crt,.cer', file: certFile, onChange: handleCertChange },
                        { label: 'Klucz prywatny (.key lub .pem)', accept: '.key,.pem', file: keyFile, onChange: handleKeyChange },
                    ].map(({ label, accept, file, onChange }) => (
                        <div key={label}>
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary">
                                <Upload className="h-4 w-4" /> {label}
                                <input type="file" accept={accept} onChange={onChange} className="sr-only" />
                            </label>
                            {file && <p className="mt-1 flex items-center gap-1 text-[12px] text-accent"><CheckCircle2 className="h-3.5 w-3.5" />{file.name}</p>}
                        </div>
                    ))}
                    <div className="space-y-1.5">
                        <label className="ks-label" htmlFor="cert-pass">Hasło klucza prywatnego (opcjonalne)</label>
                        <input id="cert-pass" type="password" className="ks-input"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            placeholder="Pozostaw puste jeśli klucz nie jest chroniony hasłem"
                            autoComplete="new-password" />
                    </div>
                    <PrimaryButton onClick={handleUpload} disabled={isUploading || !certFile || !keyFile}>
                        {isUploading ? <><Loader2 className="h-4 w-4 animate-spin" />Przesyłanie...</> : <><Upload className="h-4 w-4" />Prześlij certyfikat</>}
                    </PrimaryButton>
                </div>
            )}
        </div>
    );
}
