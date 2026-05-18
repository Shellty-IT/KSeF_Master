// src/views/settings/tabs/TabFraudDetection.tsx
import { useState, useEffect } from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import {
    getAlertSettings,
    saveAlertSettings,
    clearDismissedAlerts,
} from '../../../services/fraudDetection';
import type { AlertSettings } from '../../../types/fraud';

export default function TabFraudDetection() {
    const [alertSettings, setAlertSettings] = useState<AlertSettings>(getAlertSettings());
    const [info, setInfo] = useState<string | null>(null);

    useEffect(() => {
        setAlertSettings(getAlertSettings());
    }, []);

    function showInfo(msg: string) {
        setInfo(msg);
        setTimeout(() => setInfo(null), 1800);
    }

    function handleSave() {
        saveAlertSettings(alertSettings);
        showInfo('Ustawienia wykrywania zapisane.');
    }

    function handleClearDismissed() {
        if (!confirm('Czy na pewno chcesz przywrócić wszystkie zignorowane alerty?')) return;
        clearDismissedAlerts();
        showInfo('Przywrócono zignorowane alerty.');
    }

    return (
        <div>
            {info && <div className="info-banner">{info}</div>}

            <div className="card">
                <h3>🚨 Wykrywanie podejrzanych faktur</h3>
                <p className="hint" style={{ marginBottom: '16px' }}>
                    System automatycznie analizuje faktury odebrane i oznacza te, które wymagają uwagi.
                </p>

                <label className="checkbox">
                    <input
                        type="checkbox"
                        checked={alertSettings.enabled}
                        onChange={(e) => setAlertSettings((s) => ({ ...s, enabled: e.target.checked }))}
                    />
                    Włącz wykrywanie podejrzanych faktur
                </label>

                {alertSettings.enabled && (
                    <>
                        <div className="settings-divider" />

                        <div className="two-col">
                            <label>Próg wysokiej kwoty (PLN)
                                <input
                                    type="number"
                                    min={0}
                                    step={100}
                                    value={alertSettings.highAmountThreshold}
                                    onChange={(e) => setAlertSettings((s) => ({
                                        ...s,
                                        highAmountThreshold: Number(e.target.value),
                                    }))}
                                />
                                <span className="input-hint">Faktury powyżej tej kwoty będą oznaczone</span>
                            </label>
                            <label>Próg nieznanego kontrahenta (PLN)
                                <input
                                    type="number"
                                    min={0}
                                    step={100}
                                    value={alertSettings.unknownContractorThreshold}
                                    onChange={(e) => setAlertSettings((s) => ({
                                        ...s,
                                        unknownContractorThreshold: Number(e.target.value),
                                    }))}
                                />
                                <span className="input-hint">Alert gdy nowy kontrahent i kwota powyżej progu</span>
                            </label>
                        </div>

                        <div className="settings-divider" />

                        <label className="checkbox">
                            <input
                                type="checkbox"
                                checked={alertSettings.duplicateDetectionEnabled}
                                onChange={(e) => setAlertSettings((s) => ({
                                    ...s,
                                    duplicateDetectionEnabled: e.target.checked,
                                }))}
                            />
                            Wykrywanie duplikatów
                        </label>

                        {alertSettings.duplicateDetectionEnabled && (
                            <label className="inline-label">
                                Okno czasowe (dni)
                                <input
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={alertSettings.duplicateWindowDays}
                                    onChange={(e) => setAlertSettings((s) => ({
                                        ...s,
                                        duplicateWindowDays: Number(e.target.value),
                                    }))}
                                    className="small-input"
                                />
                            </label>
                        )}

                        <div className="settings-divider" />

                        <label className="checkbox">
                            <input
                                type="checkbox"
                                checked={alertSettings.unusualHoursEnabled}
                                onChange={(e) => setAlertSettings((s) => ({
                                    ...s,
                                    unusualHoursEnabled: e.target.checked,
                                }))}
                            />
                            Wykrywanie nietypowych godzin wystawienia
                        </label>

                        {alertSettings.unusualHoursEnabled && (
                            <div className="two-col inline-settings">
                                <label>Godzina rozpoczęcia (typowe)
                                    <input
                                        type="time"
                                        value={alertSettings.unusualHoursStart}
                                        onChange={(e) => setAlertSettings((s) => ({
                                            ...s,
                                            unusualHoursStart: e.target.value,
                                        }))}
                                    />
                                </label>
                                <label>Godzina zakończenia (typowe)
                                    <input
                                        type="time"
                                        value={alertSettings.unusualHoursEnd}
                                        onChange={(e) => setAlertSettings((s) => ({
                                            ...s,
                                            unusualHoursEnd: e.target.value,
                                        }))}
                                    />
                                </label>
                            </div>
                        )}

                        <div className="settings-divider" />

                        <label className="checkbox">
                            <input
                                type="checkbox"
                                checked={alertSettings.roundAmountDetectionEnabled}
                                onChange={(e) => setAlertSettings((s) => ({
                                    ...s,
                                    roundAmountDetectionEnabled: e.target.checked,
                                }))}
                            />
                            Wykrywanie okrągłych kwot (np. 10 000 zł)
                        </label>
                    </>
                )}
            </div>

            {alertSettings.enabled && (
                <div className="card">
                    <h3>🔔 Zarządzanie alertami</h3>
                    <p className="hint" style={{ marginBottom: '16px' }}>
                        Alerty zignorowane przez użytkownika nie będą ponownie wyświetlane, dopóki nie zostaną przywrócone.
                    </p>
                    <button className="btn-light" onClick={handleClearDismissed}>
                        🔄 Przywróć zignorowane alerty
                    </button>
                </div>
            )}

            <div style={{ marginTop: '4px' }}>
                <PrimaryButton onClick={handleSave} icon="💾">Zapisz ustawienia</PrimaryButton>
            </div>
        </div>
    );
}