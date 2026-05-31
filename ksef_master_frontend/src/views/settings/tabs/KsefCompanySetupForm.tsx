import type { ChangeEvent } from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { Key, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
    companyName: string; setCompanyName: (v: string) => void;
    nip: string; setNip: (v: string) => void;
    selectedMethod: 'token' | 'certificate'; setSelectedMethod: (v: 'token' | 'certificate') => void;
    selectedEnvironment: 'Test' | 'Production'; setSelectedEnvironment: (v: 'Test' | 'Production') => void;
    ksefToken: string; setKsefToken: (v: string) => void;
    setupCertFile: File | null; setupKeyFile: File | null;
    setupCertPassword: string; setSetupCertPassword: (v: string) => void;
    isSubmitting: boolean;
    onCertFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onKeyFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onSubmit: () => Promise<void>;
}

export default function KsefCompanySetupForm({
    companyName, setCompanyName, nip, setNip,
    selectedMethod, setSelectedMethod,
    selectedEnvironment, setSelectedEnvironment,
    ksefToken, setKsefToken,
    setupCertFile, setupKeyFile, setupCertPassword, setSetupCertPassword,
    isSubmitting, onCertFileChange, onKeyFileChange, onSubmit,
}: Props) {
    return (
        <div className="space-y-4">
            {/* Company data */}
            <div className="ks-card p-5 space-y-4">
                <div>
                    <h3 className="ks-card-title">Konfiguracja firmy</h3>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">Podaj dane firmy i wybierz metodę uwierzytelniania z systemem KSeF.</p>
                </div>
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="sf-name">Nazwa firmy *</label>
                    <input id="sf-name" type="text" className="ks-input" placeholder="Twoja Firma Sp. z o.o."
                        value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="sf-nip">NIP *</label>
                    <input id="sf-nip" type="text" inputMode="numeric" className="ks-input font-mono"
                        placeholder="np. 5252161248"
                        value={nip} onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                    <p className="text-[11px] text-muted-foreground">10-cyfrowy NIP firmy</p>
                </div>
            </div>

            {/* Environment */}
            <div className="ks-card p-5 space-y-4">
                <div>
                    <h3 className="ks-card-title">Środowisko KSeF</h3>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                        <strong className="text-warning-foreground">UWAGA:</strong> Środowisko produkcyjne służy do wystawiania faktur o pełnej mocy prawnej.
                    </p>
                </div>
                <div className="space-y-2">
                    {(['Test', 'Production'] as const).map((env) => (
                        <label key={env}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${selectedEnvironment === env ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted/40'}`}>
                            <input type="radio" name="setupEnvironment" value={env} checked={selectedEnvironment === env}
                                onChange={() => setSelectedEnvironment(env)} className="sr-only" />
                            <div className={`h-2.5 w-2.5 rounded-full ${env === 'Production' ? 'bg-destructive' : 'bg-warning'}`} />
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    {env === 'Test' ? 'Środowisko testowe' : 'Środowisko produkcyjne'}
                                </p>
                                <p className={`text-[12px] ${env === 'Production' ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>
                                    {env === 'Test' ? 'Dane fikcyjne, brak skutków prawnych.' : 'Faktury o pełnej mocy prawnej.'}
                                </p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Auth method */}
            <div className="ks-card p-5 space-y-4">
                <div>
                    <h3 className="ks-card-title">Metoda uwierzytelniania KSeF</h3>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">Możesz ją zmienić później.</p>
                </div>
                <div className="space-y-2">
                    {[
                        { value: 'token' as const, label: 'Token autoryzacyjny', desc: 'Standardowe uwierzytelnianie tokenem generowanym w systemie KSeF', Icon: Key },
                        { value: 'certificate' as const, label: 'Certyfikat KSeF', desc: 'Uwierzytelnianie za pomocą certyfikatu wygenerowanego w systemie KSeF (XAdES)', Icon: ShieldCheck },
                    ].map(({ value, label, desc, Icon }) => (
                        <label key={value}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${selectedMethod === value ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted/40'}`}>
                            <input type="radio" name="setupMethod" value={value} checked={selectedMethod === value}
                                onChange={() => setSelectedMethod(value)} className="sr-only" />
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{label}</p>
                                <p className="text-[12px] text-muted-foreground">{desc}</p>
                            </div>
                        </label>
                    ))}
                </div>

                {selectedMethod === 'token' && (
                    <div className="space-y-1.5">
                        <label className="ks-label" htmlFor="sf-token">Token KSeF *</label>
                        <input id="sf-token" type="text" className="ks-input font-mono text-[12px]"
                            value={ksefToken} onChange={(e) => setKsefToken(e.target.value)}
                            placeholder="Wklej token z aplikacji KSeF" />
                        <p className="text-[11px] text-muted-foreground">Format: XXXX-XX-XXXX|nip-XXXX|hash</p>
                    </div>
                )}

                {selectedMethod === 'certificate' && (
                    <div className="space-y-3">
                        <p className="text-[12px] text-muted-foreground">Wybierz pliki certyfikatu i klucza prywatnego.</p>
                        {[
                            { label: 'Certyfikat (.crt lub .cer)', accept: '.crt,.cer', file: setupCertFile, onChange: onCertFileChange },
                            { label: 'Klucz prywatny (.key lub .pem)', accept: '.key,.pem', file: setupKeyFile, onChange: onKeyFileChange },
                        ].map(({ label, accept, file, onChange }) => (
                            <div key={label}>
                                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition hover:bg-secondary">
                                    <span className="text-muted-foreground">{label}</span>
                                    <input type="file" accept={accept} onChange={onChange} className="sr-only" />
                                </label>
                                {file && (
                                    <p className="mt-1 flex items-center gap-1 text-[12px] text-accent">
                                        <CheckCircle2 className="h-3.5 w-3.5" />{file.name}
                                    </p>
                                )}
                            </div>
                        ))}
                        <div className="space-y-1.5">
                            <label className="ks-label" htmlFor="sf-cert-pass">Hasło klucza prywatnego (opcjonalne)</label>
                            <input id="sf-cert-pass" type="password" className="ks-input"
                                value={setupCertPassword} onChange={(e) => setSetupCertPassword(e.target.value)}
                                placeholder="Pozostaw puste jeśli klucz nie jest chroniony hasłem"
                                autoComplete="new-password" />
                        </div>
                    </div>
                )}
            </div>

            <PrimaryButton onClick={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Konfigurowanie...</> : 'Skonfiguruj firmę'}
            </PrimaryButton>
        </div>
    );
}
