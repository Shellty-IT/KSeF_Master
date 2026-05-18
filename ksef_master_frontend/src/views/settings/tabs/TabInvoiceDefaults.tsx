// src/views/settings/tabs/TabInvoiceDefaults.tsx
import { useState, useEffect } from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import {
    getSettings,
    saveSettings,
    type AppSettings,
    type PaymentMethod,
} from '../../../services/settings';

export default function TabInvoiceDefaults() {
    const [settings, setSettings] = useState<AppSettings>(getSettings());
    const [info, setInfo] = useState<string | null>(null);

    useEffect(() => {
        setSettings(getSettings());
    }, []);

    function handleSave() {
        saveSettings(settings);
        setInfo('Domyślne parametry faktur zapisane.');
        setTimeout(() => setInfo(null), 1800);
    }

    return (
        <div>
            {info && <div className="info-banner">{info}</div>}

            <div className="card">
                <h3>📄 Domyślne parametry faktur</h3>
                <p className="hint" style={{ marginBottom: '20px' }}>
                    Wartości wstępnie wypełniające formularz nowej faktury. Możesz je zmienić przy każdej fakturze.
                </p>

                <div className="two-col">
                    <label>Miejsce wystawienia
                        <input
                            type="text"
                            value={settings.invoicing.placeDefault}
                            onChange={(e) =>
                                setSettings((s) => ({
                                    ...s,
                                    invoicing: { ...s.invoicing, placeDefault: e.target.value },
                                }))
                            }
                            placeholder="np. Warszawa"
                        />
                    </label>
                    <label>Domyślny termin płatności (dni)
                        <input
                            type="number"
                            min={0}
                            value={settings.invoicing.dueDaysDefault}
                            onChange={(e) =>
                                setSettings((s) => ({
                                    ...s,
                                    invoicing: { ...s.invoicing, dueDaysDefault: Number(e.target.value) },
                                }))
                            }
                        />
                    </label>
                </div>

                <div className="two-col">
                    <label>Domyślna metoda płatności
                        <select
                            value={settings.invoicing.paymentMethodDefault}
                            onChange={(e) =>
                                setSettings((s) => ({
                                    ...s,
                                    invoicing: {
                                        ...s.invoicing,
                                        paymentMethodDefault: e.target.value as PaymentMethod,
                                    },
                                }))
                            }
                        >
                            <option value="przelew">Przelew bankowy</option>
                            <option value="gotówka">Gotówka</option>
                        </select>
                    </label>
                    <label>Waluta
                        <input
                            type="text"
                            value={settings.invoicing.currencyDefault}
                            disabled
                        />
                        <span className="input-hint">Waluta jest zawsze PLN (wymóg KSeF)</span>
                    </label>
                </div>

                <div className="settings-divider" />

                <label>Wzór numeracji faktur
                    <input
                        type="text"
                        value={settings.invoicing.numberingPattern}
                        onChange={(e) =>
                            setSettings((s) => ({
                                ...s,
                                invoicing: { ...s.invoicing, numberingPattern: e.target.value },
                            }))
                        }
                        placeholder="FV/{YYYY}/{MM}/{seq3}"
                        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}
                    />
                    <span className="input-hint">
                        Dostępne zmienne: {'{YYYY}'} — rok, {'{MM}'} — miesiąc, {'{seq3}'} — numer sekwencyjny (3 cyfry)
                    </span>
                </label>

                <div className="settings-divider" />

                <label className="checkbox">
                    <input
                        type="checkbox"
                        checked={settings.invoicing.mppDefault}
                        onChange={(e) =>
                            setSettings((s) => ({
                                ...s,
                                invoicing: { ...s.invoicing, mppDefault: e.target.checked },
                            }))
                        }
                    />
                    Domyślnie włącz MPP (mechanizm podzielonej płatności)
                </label>
            </div>

            <div style={{ marginTop: '4px' }}>
                <PrimaryButton onClick={handleSave} icon="💾">Zapisz domyślne</PrimaryButton>
            </div>
        </div>
    );
}