import { useId, useState, type KeyboardEvent } from 'react';
import type { FraudAnalysisResult, AlertLevel } from '../../../types/fraud';
import { dismissAlert, addKnownContractor } from '../../../services/fraudDetection';
import { CheckCircle, AlertTriangle, AlertCircle, Lightbulb, X } from 'lucide-react';

interface FraudBadgeProps {
    result: FraudAnalysisResult;
    contractorNip?: string;
    onDismiss?: () => void;
}

export default function FraudBadge({ result, contractorNip, onDismiss }: FraudBadgeProps) {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const detailsId = useId();

    if (result.alertLevel === 'none' || result.alerts.length === 0) {
        return (
            <span title="Brak sygnałów ryzyka" aria-label="Brak sygnałów ryzyka" className="inline-flex items-center justify-center">
                <CheckCircle className="h-3.5 w-3.5 text-accent" />
            </span>
        );
    }

    const badgeClass =
        result.alertLevel === 'high'
            ? 'bg-destructive/10 text-destructive border-destructive/20'
            : result.alertLevel === 'medium'
                ? 'bg-warning/15 text-warning-foreground border-warning/30'
                : 'bg-muted text-muted-foreground border-border';

    const LevelIcon =
        result.alertLevel === 'high' ? AlertCircle
        : result.alertLevel === 'medium' ? AlertTriangle
        : Lightbulb;

    const levelLabel =
        result.alertLevel === 'high' ? 'Wysoki poziom alertu'
        : result.alertLevel === 'medium' ? 'Średni poziom alertu'
        : 'Niski poziom alertu';

    const handleDismissAlert = (alertType: string) => {
        dismissAlert(`${result.invoiceId}:${alertType}`);
        onDismiss?.();
    };

    const handleMarkAsKnown = () => {
        if (contractorNip) {
            addKnownContractor(contractorNip);
            onDismiss?.();
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            setIsTooltipVisible(false);
        }
    };

    return (
        <div
            className="relative inline-flex"
            onKeyDown={handleKeyDown}
        >
            <button
                type="button"
                className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-ring/40 ${badgeClass}`}
                aria-expanded={isTooltipVisible}
                aria-controls={detailsId}
                aria-haspopup="dialog"
                aria-label={`${levelLabel}. Liczba sygnałów: ${result.alerts.length}`}
                onClick={() => setIsTooltipVisible(value => !value)}
            >
                <LevelIcon className="h-3 w-3" />
                <span>{result.alerts.length}</span>
            </button>

            {isTooltipVisible && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-primary/35 p-4 backdrop-blur-[1px]"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setIsTooltipVisible(false);
                    }}
                >
                    <div id={detailsId} role="dialog" aria-modal="true" aria-labelledby={`${detailsId}-title`} className="w-full max-w-md rounded-xl border border-border bg-card shadow-[var(--shadow-elevated)]">
                        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                            <LevelIcon className="h-4 w-4 shrink-0 text-destructive" />
                            <span id={`${detailsId}-title`} className="flex-1 text-sm font-semibold text-foreground">{levelLabel}</span>
                            <button
                                type="button"
                                autoFocus
                                className="rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                                onClick={() => setIsTooltipVisible(false)}
                                aria-label="Zamknij szczegóły sygnałów ryzyka"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="px-4 pt-3 text-[12px] text-muted-foreground">Sygnały pomagają ustalić kolejność weryfikacji i nie przesądzają o nieprawidłowości faktury.</p>
                        <ul className="divide-y divide-border px-4 py-2">
                            {result.alerts.map((alert) => (
                                <li key={alert.type} className="flex items-start justify-between gap-3 py-3">
                                    <span className="text-[13px] leading-5 text-foreground">{alert.message}</span>
                                    <button
                                        type="button"
                                        className="shrink-0 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition hover:border-destructive/30 hover:text-destructive"
                                        onClick={() => handleDismissAlert(alert.type)}
                                        aria-label={`Ignoruj sygnał: ${alert.message}`}
                                    >
                                        Ignoruj
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {contractorNip && result.alerts.some(a => a.type === 'unknown_contractor') && (
                            <div className="border-t border-border px-4 py-3">
                                <button
                                    type="button"
                                    className="text-[12px] font-semibold text-accent hover:underline"
                                    onClick={handleMarkAsKnown}
                                >
                                    Oznacz kontrahenta jako zaufanego
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function AlertLevelIndicator({ level }: { level: AlertLevel }) {
    if (level === 'none') return null;

    const config = {
        high: { Icon: AlertCircle, label: 'Wysoki', cls: 'text-destructive bg-destructive/10 border-destructive/20' },
        medium: { Icon: AlertTriangle, label: 'Średni', cls: 'text-warning-foreground bg-warning/15 border-warning/30' },
        low: { Icon: Lightbulb, label: 'Niski', cls: 'text-muted-foreground bg-muted border-border' },
    };

    const { Icon, label, cls } = config[level];

    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
}
