import { useState, useEffect } from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { getSettings, saveSettings, type AppSettings, type PaymentMethod } from '../../../services/settings';
import { Save } from 'lucide-react';

export default function TabInvoiceDefaults() {
    const [settings, setSettings] = useState<AppSettings>(getSettings());
    const [info, setInfo] = useState<string | null>(null);

    useEffect(() => { setSettings(getSettings()); }, []);

    function handleSave() {
        saveSettings(settings);
        setInfo('Domyślne parametry faktur zapisane.');
        setTimeout(() => setInfo(null), 1800);
    }

    const inv = settings.invoicing;
    const setInv = (patch: Partial<typeof inv>) => setSettings((s) => ({ ...s, invoicing: { ...s.invoicing, ...patch } }));

    return (
        <div className="space-y-4">
            {info && <div className="rounded-lg border border-accent/20 bg-accent/10 px-4 py-2.5 text-sm text-accent">{info}</div>}

            <div className="ks-card p-5 space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Domyślne parametry faktur</h3>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">Wartości wstępnie wypełniające formularz nowej faktury. Możesz je zmienić przy każdej fakturze.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="ks-label" htmlFor="inv-place">Miejsce wystawienia</label>
                        <input id="inv-place" type="text" className="ks-input" placeholder="np. Warszawa"
                            value={inv.placeDefault}
                            onChange={(e) => setInv({ placeDefault: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="ks-label" htmlFor="inv-due">Domyślny termin płatności (dni)</label>
                        <input id="inv-due" type="number" min={0} className="ks-input"
                            value={inv.dueDaysDefault}
                            onChange={(e) => setInv({ dueDaysDefault: Number(e.target.value) })} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="ks-label" htmlFor="inv-method">Domyślna metoda płatności</label>
                        <select id="inv-method" className="ks-input"
                            value={inv.paymentMethodDefault}
                            onChange={(e) => setInv({ paymentMethodDefault: e.target.value as PaymentMethod })}>
                            <option value="przelew">Przelew bankowy</option>
                            <option value="gotówka">Gotówka</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="ks-label" htmlFor="inv-currency">Waluta</label>
                        <input id="inv-currency" type="text" className="ks-input" value={inv.currencyDefault} disabled />
                        <p className="text-[11px] text-muted-foreground">Waluta jest zawsze PLN (wymóg KSeF)</p>
                    </div>
                </div>

                <div className="border-t border-border" />

                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="inv-pattern">Wzór numeracji faktur</label>
                    <input id="inv-pattern" type="text" className="ks-input font-mono"
                        placeholder="FV/{YYYY}/{MM}/{seq3}"
                        value={inv.numberingPattern}
                        onChange={(e) => setInv({ numberingPattern: e.target.value })} />
                    <p className="text-[11px] text-muted-foreground">
                        Dostępne zmienne: {'{YYYY}'} — rok, {'{MM}'} — miesiąc, {'{seq3}'} — numer sekwencyjny (3 cyfry)
                    </p>
                </div>

                <div className="border-t border-border" />

                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <input type="checkbox" className="rounded"
                        checked={inv.mppDefault}
                        onChange={(e) => setInv({ mppDefault: e.target.checked })} />
                    <span className="text-foreground">Domyślnie włącz MPP (mechanizm podzielonej płatności)</span>
                </label>
            </div>

            <PrimaryButton onClick={handleSave}>
                <Save className="h-4 w-4" /> Zapisz domyślne
            </PrimaryButton>
        </div>
    );
}
