import CertificateUpload from '../../../components/features/settings/CertificateUpload';
import { Key, ShieldCheck, Pencil, Loader2, Save } from 'lucide-react';

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
        <div className="ks-card p-5 space-y-5">
            <div>
                <h3 className="ks-card-title">Metoda uwierzytelniania</h3>
                <p className="mt-0.5 text-[12px] text-muted-foreground">Zmień metodę łączenia się z systemem KSeF w dowolnym momencie.</p>
            </div>

            <div className="flex gap-2">
                {[
                    { value: 'token' as const, label: 'Token autoryzacyjny', Icon: Key, disabled: false },
                    { value: 'certificate' as const, label: 'Certyfikat KSeF', Icon: ShieldCheck, disabled: !hasCertificate },
                ].map(({ value, label, Icon, disabled }) => (
                    <label key={value}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${authMethod === value ? 'border-accent bg-accent text-white' : 'border-border bg-card text-foreground hover:border-accent/50 hover:bg-accent/5'}`}>
                        <input type="radio" name="authMethod" value={value}
                            checked={authMethod === value}
                            onChange={() => onSwitchMethod(value)}
                            disabled={isSwitching || disabled}
                            className="sr-only" />
                        <Icon className="h-4 w-4 shrink-0" />
                        {label}
                        {value === 'certificate' && !hasCertificate && (
                            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Wymaga przesłania</span>
                        )}
                    </label>
                ))}
            </div>

            {authMethod === 'token' && (
                <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground">Token KSeF</h4>
                        {!isEditingToken && (
                            <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] transition hover:bg-secondary"
                                onClick={() => setIsEditingToken(true)}>
                                <Pencil className="h-3.5 w-3.5" /> Zmień token
                            </button>
                        )}
                    </div>
                    {isEditingToken ? (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="ks-label" htmlFor="new-token">Nowy token KSeF *</label>
                                <input id="new-token" type="text" className="ks-input font-mono text-[12px]"
                                    value={ksefToken} onChange={(e) => setKsefToken(e.target.value)}
                                    placeholder="Wklej nowy token z aplikacji KSeF" />
                                <p className="text-[11px] text-muted-foreground">Format: XXXX-XX-XXXX|nip-XXXX|hash</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] transition hover:brightness-110 disabled:opacity-40"
                                    onClick={onSaveToken} disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Zapisywanie...</> : <><Save className="h-4 w-4" />Zapisz</>}
                                </button>
                                <button className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-secondary"
                                    onClick={() => { setIsEditingToken(false); setKsefToken(''); }}>Anuluj</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[12px] text-muted-foreground">Token jest przechowywany w bezpiecznej formie (szyfrowany AES-256).</p>
                    )}
                </div>
            )}

            <div className="border-t border-border pt-4">
                <h4 className="mb-3 text-sm font-medium text-foreground">Zarządzanie certyfikatem</h4>
                <CertificateUpload onSuccess={onCertificateSuccess} />
            </div>
        </div>
    );
}
