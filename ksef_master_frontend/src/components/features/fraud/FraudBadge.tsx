import { useState } from 'react';
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

    if (result.alertLevel === 'none' || result.alerts.length === 0) {
        return (
            <span title="Brak alertów" className="inline-flex items-center justify-center">
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

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setIsTooltipVisible(true)}
            onMouseLeave={() => setIsTooltipVisible(false)}
        >
            <span className={`inline-flex cursor-default items-center justify-center rounded-full border p-0.5 ${badgeClass}`}>
                <LevelIcon className="h-3 w-3" />
            </span>

            {isTooltipVisible && (
                <div className="absolute left-6 top-0 z-50 w-64 rounded-xl border border-border bg-card shadow-[var(--shadow-elevated)]">
                    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                        <LevelIcon className="h-3.5 w-3.5 shrink-0 text-destructive" />
                        <span className="text-[12px] font-semibold text-foreground">{levelLabel}</span>
                    </div>
                    <ul className="divide-y divide-border">
                        {result.alerts.map((alert, index) => (
                            <li key={index} className="flex items-start justify-between gap-2 px-3 py-2">
                                <span className="text-[12px] text-foreground">{alert.message}</span>
                                <button
                                    className="shrink-0 text-muted-foreground hover:text-destructive transition"
                                    onClick={(e) => { e.stopPropagation(); handleDismissAlert(alert.type); }}
                                    title="Ignoruj ten alert"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    {contractorNip && result.alerts.some(a => a.type === 'unknown_contractor') && (
                        <div className="border-t border-border px-3 py-2">
                            <button
                                className="text-[12px] font-medium text-accent hover:underline"
                                onClick={(e) => { e.stopPropagation(); handleMarkAsKnown(); }}
                            >
                                Oznacz kontrahenta jako zaufanego
                            </button>
                        </div>
                    )}
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
