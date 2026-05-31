import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import BankAccountInput from '../../../components/ui/BankAccountInput';
import KsefSetupModal from '../../../components/features/ksef/KsefSetupModal';
import { getSeller, saveSeller, type SellerProfile } from '../../../services/settings';
import { AlertCircle, Building2, Save } from 'lucide-react';

export default function TabCompanyProfile() {
    const { user, needsCompanySetup } = useAuth();
    const [seller, setSeller] = useState<SellerProfile>(getSeller());
    const [info, setInfo] = useState<string | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [showSetupModal, setShowSetupModal] = useState(false);

    useEffect(() => { setSeller(getSeller()); }, []);

    function showInfo(msg: string) { setInfo(msg); setTimeout(() => setInfo(null), 1800); }

    function validate(): string[] {
        const errs: string[] = [];
        if (!seller.name.trim()) errs.push('Nazwa firmy jest wymagana.');
        if (!seller.address.trim()) errs.push('Adres jest wymagany.');
        if (seller.bankAccount) {
            const digits = seller.bankAccount.replace(/[^0-9]/g, '');
            if (digits.length > 0 && digits.length !== 26) errs.push('Numer konta bankowego musi mieć 26 cyfr.');
        }
        return errs;
    }

    function handleSave() {
        const errs = validate();
        setErrors(errs);
        if (errs.length) return;
        saveSeller(seller);
        showInfo('Dane firmy zostały zapisane.');
    }

    return (
        <div className="space-y-4">
            {info && <div className="rounded-lg border border-accent/20 bg-accent/10 px-4 py-2.5 text-sm text-accent">{info}</div>}

            {errors.length > 0 && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <ul className="space-y-0.5">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
            )}

            <div className="ks-card p-5 space-y-4">
                <h3 className="ks-card-title">Dane rejestrowe firmy</h3>

                {user?.company ? (
                    <div className="flex gap-8 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3">
                        <div>
                            <p className="ks-label mb-1">Nazwa w KSeF</p>
                            <p className="text-sm font-semibold text-foreground">{user.company.companyName}</p>
                        </div>
                        <div>
                            <p className="ks-label mb-1">NIP</p>
                            <p className="font-mono text-sm font-semibold text-foreground">{user.company.nip}</p>
                        </div>
                    </div>
                ) : needsCompanySetup ? (
                    <div>
                        <p className="mb-3 text-sm text-muted-foreground">Firma nie jest jeszcze skonfigurowana w systemie KSeF.</p>
                        <button
                            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] transition hover:brightness-110"
                            onClick={() => setShowSetupModal(true)}>
                            <Building2 className="h-4 w-4" /> Skonfiguruj firmę
                        </button>
                    </div>
                ) : null}

                <div className="rounded-lg bg-muted/30 px-4 py-3 text-[12px] text-muted-foreground">
                    Poniższe dane sprzedawcy są używane na fakturach. NIP i nazwa firmy pobierane są z konfiguracji KSeF — zmień je w zakładce <strong className="text-foreground">Połączenie KSeF</strong>.
                </div>

                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="cp-name">Nazwa firmy (na fakturach) *</label>
                    <input id="cp-name" type="text" className="ks-input" placeholder="Nazwa Twojej firmy"
                        value={seller.name} onChange={(e) => setSeller((s) => ({ ...s, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="cp-address">Adres *</label>
                    <input id="cp-address" type="text" className="ks-input" placeholder="Ulica, numer, kod pocztowy, miasto"
                        value={seller.address} onChange={(e) => setSeller((s) => ({ ...s, address: e.target.value }))} />
                </div>
                <div>
                    <BankAccountInput label="Rachunek bankowy" value={seller.bankAccount || ''}
                        onChange={(v) => setSeller((s) => ({ ...s, bankAccount: v }))} />
                    <p className="mt-1 text-[11px] text-muted-foreground">Ten numer będzie domyślnie używany na fakturach jako rachunek do płatności.</p>
                </div>
                <PrimaryButton onClick={handleSave}>
                    <Save className="h-4 w-4" /> Zapisz dane firmy
                </PrimaryButton>
            </div>

            {showSetupModal && (
                <KsefSetupModal mode="setup" onClose={() => setShowSetupModal(false)} onSuccess={() => setShowSetupModal(false)} />
            )}
        </div>
    );
}
