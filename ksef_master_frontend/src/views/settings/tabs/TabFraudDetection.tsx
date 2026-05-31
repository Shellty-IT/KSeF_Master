import { useState, useEffect } from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { getAlertSettings, saveAlertSettings, clearDismissedAlerts } from '../../../services/fraudDetection';
import type { AlertSettings } from '../../../types/fraud';
import { Save, RefreshCw } from 'lucide-react';

export default function TabFraudDetection() {
    const [alertSettings, setAlertSettings] = useState<AlertSettings>(getAlertSettings());
    const [info, setInfo] = useState<string | null>(null);

    useEffect(() => { setAlertSettings(getAlertSettings()); }, []);

    function showInfo(msg: string) { setInfo(msg); setTimeout(() => setInfo(null), 1800); }

    function handleSave() { saveAlertSettings(alertSettings); showInfo('Ustawienia wykrywania zapisane.'); }

    function handleClearDismissed() {
        if (!confirm('Czy na pewno chcesz przywrócić wszystkie zignorowane alerty?')) return;
        clearDismissedAlerts();
        showInfo('Przywrócono zignorowane alerty.');
    }

    const divider = <div className="border-t border-border" />;
    const checkbox = (checked: boolean, onChange: (v: boolean) => void, label: string) => (
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded" />
            <span className="text-foreground">{label}</span>
        </label>
    );

    return (
        <div className="space-y-4">
            {info && <div className="rounded-lg border border-accent/20 bg-accent/10 px-4 py-2.5 text-sm text-accent">{info}</div>}

            <div className="ks-card p-5 space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Wykrywanie podejrzanych faktur</h3>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">System automatycznie analizuje faktury odebrane i oznacza te, które wymagają uwagi.</p>
                </div>

                {checkbox(alertSettings.enabled,
                    (v) => setAlertSettings((s) => ({ ...s, enabled: v })),
                    'Włącz wykrywanie podejrzanych faktur')}

                {alertSettings.enabled && (
                    <>
                        {divider}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="ks-label" htmlFor="fd-high">Próg wysokiej kwoty (PLN)</label>
                                <input id="fd-high" type="number" min={0} step={100} className="ks-input"
                                    value={alertSettings.highAmountThreshold}
                                    onChange={(e) => setAlertSettings((s) => ({ ...s, highAmountThreshold: Number(e.target.value) }))} />
                                <p className="text-[11px] text-muted-foreground">Faktury powyżej tej kwoty będą oznaczone</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="ks-label" htmlFor="fd-unk">Próg nieznanego kontrahenta (PLN)</label>
                                <input id="fd-unk" type="number" min={0} step={100} className="ks-input"
                                    value={alertSettings.unknownContractorThreshold}
                                    onChange={(e) => setAlertSettings((s) => ({ ...s, unknownContractorThreshold: Number(e.target.value) }))} />
                                <p className="text-[11px] text-muted-foreground">Alert gdy nowy kontrahent i kwota powyżej progu</p>
                            </div>
                        </div>

                        {divider}
                        {checkbox(alertSettings.duplicateDetectionEnabled,
                            (v) => setAlertSettings((s) => ({ ...s, duplicateDetectionEnabled: v })),
                            'Wykrywanie duplikatów')}

                        {alertSettings.duplicateDetectionEnabled && (
                            <div className="flex items-center gap-3 text-sm">
                                <label className="ks-label" htmlFor="fd-dup-days">Okno czasowe (dni)</label>
                                <input id="fd-dup-days" type="number" min={1} max={30} className="ks-input w-24"
                                    value={alertSettings.duplicateWindowDays}
                                    onChange={(e) => setAlertSettings((s) => ({ ...s, duplicateWindowDays: Number(e.target.value) }))} />
                            </div>
                        )}

                        {divider}
                        {checkbox(alertSettings.unusualHoursEnabled,
                            (v) => setAlertSettings((s) => ({ ...s, unusualHoursEnabled: v })),
                            'Wykrywanie nietypowych godzin wystawienia')}

                        {alertSettings.unusualHoursEnabled && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="ks-label" htmlFor="fd-h-start">Godzina rozpoczęcia (typowe)</label>
                                    <input id="fd-h-start" type="time" className="ks-input"
                                        value={alertSettings.unusualHoursStart}
                                        onChange={(e) => setAlertSettings((s) => ({ ...s, unusualHoursStart: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="ks-label" htmlFor="fd-h-end">Godzina zakończenia (typowe)</label>
                                    <input id="fd-h-end" type="time" className="ks-input"
                                        value={alertSettings.unusualHoursEnd}
                                        onChange={(e) => setAlertSettings((s) => ({ ...s, unusualHoursEnd: e.target.value }))} />
                                </div>
                            </div>
                        )}

                        {divider}
                        {checkbox(alertSettings.roundAmountDetectionEnabled,
                            (v) => setAlertSettings((s) => ({ ...s, roundAmountDetectionEnabled: v })),
                            'Wykrywanie okrągłych kwot (np. 10 000 zł)')}
                    </>
                )}
            </div>

            {alertSettings.enabled && (
                <div className="ks-card p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Zarządzanie alertami</h3>
                    <p className="text-[12px] text-muted-foreground">Alerty zignorowane przez użytkownika nie będą ponownie wyświetlane, dopóki nie zostaną przywrócone.</p>
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-secondary"
                        onClick={handleClearDismissed}>
                        <RefreshCw className="h-4 w-4" /> Przywróć zignorowane alerty
                    </button>
                </div>
            )}

            <PrimaryButton onClick={handleSave}>
                <Save className="h-4 w-4" /> Zapisz ustawienia
            </PrimaryButton>
        </div>
    );
}
