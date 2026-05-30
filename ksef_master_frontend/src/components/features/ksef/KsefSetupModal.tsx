import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { KSEF_TEST_PORTAL_URL } from '../../../constants/urls';
import { X, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

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
                if (result.success) { onSuccess(); }
                else { setError(result.error || 'Błąd konfiguracji firmy'); }
            } else {
                const result = await updateKsefToken(ksefToken.trim());
                if (result.success) { onSuccess(); }
                else { setError(result.error || 'Błąd aktualizacji tokenu'); }
            }
        } catch {
            setError('Błąd połączenia z serwerem');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={onClose}>
            <div className="ks-card w-full max-w-lg shadow-[var(--shadow-elevated)]" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="text-sm font-semibold text-foreground">
                        {mode === 'setup' ? 'Skonfiguruj połączenie z KSeF' : 'Zaktualizuj token KSeF'}
                    </h2>
                    <button className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto p-5">
                    {error && (
                        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'setup' && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="ks-label" htmlFor="sm-name">Nazwa firmy *</label>
                                    <input id="sm-name" type="text" className="ks-input" placeholder="Twoja Firma Sp. z o.o."
                                        value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={isSubmitting} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="ks-label" htmlFor="sm-nip">NIP *</label>
                                    <input id="sm-nip" type="text" inputMode="numeric" className="ks-input font-mono"
                                        placeholder="np. 5252161248"
                                        value={nip} onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        disabled={isSubmitting} />
                                    <p className={`text-[12px] ${nipValid ? 'text-accent' : 'text-muted-foreground'}`}>
                                        {nipValid ? '✓ NIP poprawny' : 'Wprowadź 10-cyfrowy NIP'}
                                    </p>
                                </div>
                            </>
                        )}

                        <div className="space-y-1.5">
                            <label className="ks-label" htmlFor="sm-token">Token KSeF *</label>
                            <input id="sm-token" type="text" className="ks-input font-mono text-[12px]"
                                placeholder="Wklej token z aplikacji KSeF MF"
                                value={ksefToken} onChange={(e) => setKsefToken(e.target.value)} disabled={isSubmitting} />
                            <p className={`text-[12px] ${tokenValid ? 'text-accent' : 'text-muted-foreground'}`}>
                                {tokenValid ? '✓ Format tokenu poprawny' : 'Format: XXXX-XX-XXXX|nip-XXXX|hash'}
                            </p>
                        </div>

                        <div className="flex items-start gap-2.5 rounded-lg border border-primary/15 bg-primary/10 px-4 py-3 text-[12px] text-primary">
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                            <span><strong>Bezpieczeństwo:</strong> Token KSeF jest szyfrowany algorytmem AES-256 i przechowywany w bezpiecznej formie.</span>
                        </div>

                        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-[12px] text-muted-foreground">
                            <strong className="text-foreground">Jak uzyskać token?</strong>
                            <ol className="mt-1.5 ml-4 space-y-0.5 list-decimal">
                                <li>Wejdź na <a href={KSEF_TEST_PORTAL_URL} target="_blank" rel="noopener" className="text-accent hover:underline">ap-test.ksef.mf.gov.pl</a></li>
                                <li>Zaloguj się podając NIP</li>
                                <li>Przejdź do Ustawienia → Tokeny</li>
                                <li>Wygeneruj token i wklej tutaj</li>
                            </ol>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button type="button" className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-secondary"
                                onClick={onClose} disabled={isSubmitting}>
                                Anuluj
                            </button>
                            <button type="submit" disabled={!formValid || isSubmitting}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed">
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Zapisywanie...' : mode === 'setup' ? 'Skonfiguruj firmę' : 'Zapisz nowy token'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
