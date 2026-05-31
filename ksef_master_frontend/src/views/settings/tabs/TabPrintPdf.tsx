import { useState, useEffect } from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { getSettings, saveSettings, type AppSettings } from '../../../services/settings';
import { Save, FileText, QrCode, Server } from 'lucide-react';

export default function TabPrintPdf() {
    const [settings, setSettings] = useState<AppSettings>(getSettings());
    const [info, setInfo] = useState<string | null>(null);

    useEffect(() => { setSettings(getSettings()); }, []);

    function handleSave() {
        saveSettings(settings);
        setInfo('Ustawienia druku zapisane.');
        setTimeout(() => setInfo(null), 1800);
    }

    const pr = settings.print;
    const setPr = (patch: Partial<typeof pr>) => setSettings((s) => ({ ...s, print: { ...s.print, ...patch } }));

    return (
        <div className="space-y-4">
            {info && <div className="rounded-lg border border-accent/20 bg-accent/10 px-4 py-2.5 text-sm text-accent">{info}</div>}

            <div className="ks-card p-5 space-y-4">
                <div>
                    <h3 className="ks-card-title">Ustawienia druku i PDF</h3>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">Parametry wpływające na wygląd wydruków i generowanych plików PDF.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="ks-label" htmlFor="pr-margin">Margines strony (mm)</label>
                        <input id="pr-margin" type="number" min={0} max={50} className="ks-input"
                            value={pr.marginMm} onChange={(e) => setPr({ marginMm: Number(e.target.value) })} />
                        <p className="text-[11px] text-muted-foreground">Zalecana wartość: 10–20 mm</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="ks-label" htmlFor="pr-scale">Skala podglądu</label>
                        <input id="pr-scale" type="number" step="0.05" min={0.5} max={1.5} className="ks-input"
                            value={pr.scale} onChange={(e) => setPr({ scale: Number(e.target.value) })} />
                        <p className="text-[11px] text-muted-foreground">1.0 = 100%, zakres: 0.5–1.5</p>
                    </div>
                </div>

                <div className="border-t border-border" />

                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <input type="checkbox" className="rounded"
                        checked={pr.showBankOnPrint}
                        onChange={(e) => setPr({ showBankOnPrint: e.target.checked })} />
                    <span className="text-foreground">Pokazuj numer rachunku bankowego na wydruku</span>
                </label>
            </div>

            <div className="ks-card p-5 space-y-3">
                <h3 className="ks-card-title">Informacje o generowaniu PDF</h3>
                <div className="space-y-3">
                    {[
                        { Icon: FileText, title: 'Format A4, orientacja pionowa', desc: 'Faktury generowane są w standardowym formacie A4' },
                        { Icon: QrCode, title: 'Kod QR weryfikacyjny', desc: 'Każdy PDF zawiera kod QR z linkiem weryfikacyjnym do systemu KSeF' },
                        { Icon: Server, title: 'Generowanie po stronie serwera', desc: 'PDF jest generowany przez backend (QuestPDF) — wymaga aktywnej sesji KSeF' },
                    ].map(({ Icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{title}</p>
                                <p className="text-[12px] text-muted-foreground">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <PrimaryButton onClick={handleSave}>
                <Save className="h-4 w-4" /> Zapisz ustawienia druku
            </PrimaryButton>
        </div>
    );
}
