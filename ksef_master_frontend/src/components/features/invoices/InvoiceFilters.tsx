import { useState } from 'react';
import type { InvoiceFilters as IInvoiceFilters } from '../../../types/filters';
import { ChevronDown, ChevronRight, X, AlertTriangle } from 'lucide-react';

interface InvoiceFiltersProps {
    filters: IInvoiceFilters;
    onChange: (filters: IInvoiceFilters) => void;
    onReset: () => void;
    showSuspiciousFilter?: boolean;
}

export default function InvoiceFilters({
    filters,
    onChange,
    onReset,
    showSuspiciousFilter = false,
}: InvoiceFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleChange = (field: keyof IInvoiceFilters, value: string | boolean) => {
        onChange({ ...filters, [field]: value });
    };

    const hasActiveFilters = !!(
        filters.dateFrom ||
        filters.dateTo ||
        filters.amountFrom ||
        filters.amountTo ||
        filters.contractorNip ||
        filters.contractorName ||
        filters.invoiceNumber ||
        filters.currency ||
        filters.showOnlySuspicious
    );

    return (
        <div className="ks-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <button
                        className="flex items-center gap-1.5 text-sm font-medium text-foreground transition hover:text-accent"
                        onClick={() => setIsExpanded((v) => !v)}
                        type="button"
                    >
                        {isExpanded
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />
                        }
                        Zaawansowane filtry
                    </button>
                    {hasActiveFilters && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                            Aktywne
                        </span>
                    )}
                    {showSuspiciousFilter && (
                        <button
                            type="button"
                            className={`flex items-center gap-1 rounded-full border px-3 py-0.5 text-[12px] font-medium transition ${
                                filters.showOnlySuspicious
                                    ? 'border-warning/40 bg-warning/15 text-warning-foreground'
                                    : 'border-border bg-card text-muted-foreground hover:border-warning/40 hover:bg-warning/10'
                            }`}
                            onClick={() => handleChange('showOnlySuspicious', !filters.showOnlySuspicious)}
                        >
                            <AlertTriangle className="h-3 w-3" />
                            Podejrzane
                        </button>
                    )}
                </div>
                {hasActiveFilters && (
                    <button
                        className="flex items-center gap-1 text-[12px] text-muted-foreground transition hover:text-destructive"
                        onClick={onReset}
                        type="button"
                    >
                        <X className="h-3.5 w-3.5" />
                        Wyczyść filtry
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                            <label className="ks-label">Data od</label>
                            <input type="date" className="ks-input" value={filters.dateFrom}
                                onChange={(e) => handleChange('dateFrom', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="ks-label">Data do</label>
                            <input type="date" className="ks-input" value={filters.dateTo}
                                onChange={(e) => handleChange('dateTo', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="ks-label">Kwota od (PLN)</label>
                            <input type="number" className="ks-input" placeholder="0.00" min="0" step="0.01"
                                value={filters.amountFrom}
                                onChange={(e) => handleChange('amountFrom', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="ks-label">Kwota do (PLN)</label>
                            <input type="number" className="ks-input" placeholder="0.00" min="0" step="0.01"
                                value={filters.amountTo}
                                onChange={(e) => handleChange('amountTo', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="ks-label">NIP kontrahenta</label>
                            <input type="text" className="ks-input" placeholder="np. 5252161248" maxLength={10}
                                value={filters.contractorNip}
                                onChange={(e) => handleChange('contractorNip', e.target.value.replace(/\D/g, '').slice(0, 10))} />
                        </div>
                        <div className="space-y-1">
                            <label className="ks-label">Nazwa kontrahenta</label>
                            <input type="text" className="ks-input" placeholder="Szukaj po nazwie..."
                                value={filters.contractorName}
                                onChange={(e) => handleChange('contractorName', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="ks-label">Numer faktury</label>
                            <input type="text" className="ks-input" placeholder="np. FV/2025/01/001"
                                value={filters.invoiceNumber}
                                onChange={(e) => handleChange('invoiceNumber', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="ks-label">Waluta</label>
                            <select className="ks-input" value={filters.currency}
                                onChange={(e) => handleChange('currency', e.target.value)}>
                                <option value="">Wszystkie</option>
                                <option value="PLN">PLN</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
