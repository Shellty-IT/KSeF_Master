// src/views/settings/tabs/TabPrintPdf.tsx
import { useState, useEffect } from 'react';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import { getSettings, saveSettings, type AppSettings } from '../../../services/settings';

export default function TabPrintPdf() {
    const [settings, setSettings] = useState<AppSettings>(getSettings());
    const [info, setInfo] = useState<string | null>(null);

    useEffect(() => {
        setSettings(getSettings());
    }, []);

    function handleSave() {
        saveSettings(settings);
        setInfo('Ustawienia druku zapisane.');
        setTimeout(() => setInfo(null), 1800);
    }

    return (
        <div>
            {info && <div className="info-banner">{info}</div>}

            <div className="card">
                <h3>🖨️ Ustawienia druku i PDF</h3>
                <p className="hint" style={{ marginBottom: '20px' }}>
                    Parametry wpływające na wygląd wydruków i generowanych plików PDF.
                </p>

                <div className="two-col">
                    <label>Margines strony (mm)
                        <input
                            type="number"
                            min={0}
                            max={50}
                            value={settings.print.marginMm}
                            onChange={(e) =>
                                setSettings((s) => ({
                                    ...s,
                                    print: { ...s.print, marginMm: Number(e.target.value) },
                                }))
                            }
                        />
                        <span className="input-hint">Zalecana wartość: 10–20 mm</span>
                    </label>
                    <label>Skala podglądu
                        <input
                            type="number"
                            step="0.05"
                            min={0.5}
                            max={1.5}
                            value={settings.print.scale}
                            onChange={(e) =>
                                setSettings((s) => ({
                                    ...s,
                                    print: { ...s.print, scale: Number(e.target.value) },
                                }))
                            }
                        />
                        <span className="input-hint">1.0 = 100%, zakres: 0.5–1.5</span>
                    </label>
                </div>

                <div className="settings-divider" />

                <label className="checkbox">
                    <input
                        type="checkbox"
                        checked={settings.print.showBankOnPrint}
                        onChange={(e) =>
                            setSettings((s) => ({
                                ...s,
                                print: { ...s.print, showBankOnPrint: e.target.checked },
                            }))
                        }
                    />
                    Pokazuj numer rachunku bankowego na wydruku
                </label>
            </div>

            <div className="card" style={{
                background: 'rgba(34, 211, 238, 0.03)',
                borderColor: 'rgba(34, 211, 238, 0.15)',
            }}>
                <h3>ℹ️ Informacje o generowaniu PDF</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>📄</span>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                                Format A4, orientacja pionowa
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                Faktury generowane są w standardowym formacie A4
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>🔲</span>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                                Kod QR weryfikacyjny
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                Każdy PDF zawiera kod QR z linkiem weryfikacyjnym do systemu KSeF
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>🔒</span>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                                Generowanie po stronie serwera
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                PDF jest generowany przez backend (QuestPDF) — wymaga aktywnej sesji KSeF
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '4px' }}>
                <PrimaryButton onClick={handleSave} icon="💾">Zapisz ustawienia druku</PrimaryButton>
            </div>
        </div>
    );
}