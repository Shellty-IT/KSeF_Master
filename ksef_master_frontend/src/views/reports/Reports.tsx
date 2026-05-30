import { useEffect, useMemo, useState } from 'react';
import SideNav from '../../components/layout/SideNav';
import TopBar from '../../components/layout/TopBar';
import PrimaryButton from '../../components/ui/PrimaryButton';
import KsefStatusAlerts from '../../components/features/ksef/KsefStatusAlerts';
import { formatPLN } from '../../helpers/money';
import { getAllReports, syncFromKsefData, clearAllReports, type ReportInvoice } from '../../services/reportsData';
import { listIssued, listReceived } from '../../services/ksefApi';
import { applyFilters, sumKpis, perVatRate, agingIssued, topClients, type ReportFilters } from '../../helpers/reports';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../../components/ui/Badge';
import { Loader2, RefreshCw, Download, Printer, Trash2, AlertCircle } from 'lucide-react';

const TH = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
    <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${right ? 'text-right' : 'text-left'}`}>
        {children}
    </th>
);

const EMPTY_ROW = ({ colSpan }: { colSpan: number }) => (
    <tr>
        <td colSpan={colSpan} className="py-8 text-center text-sm text-muted-foreground">Brak danych.</td>
    </tr>
);

export default function Reports() {
    const { isKsefConnected, needsCompanySetup } = useAuth();
    const [all, setAll] = useState<ReportInvoice[]>([]);
    const [filters, setFilters] = useState<ReportFilters>({ type: 'all' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { setAll(getAllReports()); }, []);

    const filtered = useMemo(() => applyFilters(all, filters), [all, filters]);
    const kpi = useMemo(() => sumKpis(filtered), [filtered]);
    const byVat = useMemo(() => perVatRate(filtered), [filtered]);
    const aging = useMemo(() => agingIssued(filtered), [filtered]);
    const tops = useMemo(() => topClients(filtered), [filtered]);

    async function syncFromKsef() {
        if (!isKsefConnected) { setError('Połącz się z KSeF, aby zsynchronizować dane.'); return; }
        setIsLoading(true); setError(null);
        try {
            const [issued, received] = await Promise.all([listIssued(), listReceived()]);
            setAll(syncFromKsefData(issued, received));
        } catch {
            setError('Nie udało się pobrać danych z KSeF. Sprawdź czy połączenie z KSeF jest aktywne.');
        } finally { setIsLoading(false); }
    }

    function exportCsv() {
        const head = ['id', 'type', 'number', 'issueDate', 'dueDate', 'name', 'nip', 'net', 'vat', 'gross', 'vatRate'];
        const rows = filtered.map(r => [r.id, r.type, r.number, r.issueDate, r.dueDate || '', r.counterparty.name, r.counterparty.nip || '', r.totals.net, r.totals.vat, r.totals.gross, r.vatRate ?? '']);
        const csv = [head, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'raport.csv'; a.click();
        URL.revokeObjectURL(url);
    }

    function clearData() {
        if (confirm('Wyczyścić dane raportów?')) { clearAllReports(); setAll([]); }
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <SideNav />
            <main className="flex flex-1 flex-col overflow-hidden">
                <TopBar />
                <div className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-7xl space-y-6 p-8">
                        <header>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Raporty</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Podsumowania i analityka faktur z KSeF</p>
                        </header>

                        <KsefStatusAlerts needsCompanySetup={needsCompanySetup} isKsefConnected={isKsefConnected} />

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            <PrimaryButton onClick={syncFromKsef} disabled={!isKsefConnected || isLoading}>
                                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Synchronizacja...</> : <><RefreshCw className="h-4 w-4" />Synchronizuj z KSeF</>}
                            </PrimaryButton>
                            <PrimaryButton onClick={exportCsv} disabled={filtered.length === 0}>
                                <Download className="h-4 w-4" /> Eksport CSV
                            </PrimaryButton>
                            <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-secondary" onClick={() => window.print()}>
                                <Printer className="h-4 w-4" /> Drukuj
                            </button>
                            <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" onClick={clearData}>
                                <Trash2 className="h-4 w-4" /> Wyczyść
                            </button>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
                            </div>
                        )}

                        {all.length === 0 && !isLoading && (
                            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                                {isKsefConnected ? 'Brak danych. Kliknij „Synchronizuj z KSeF" aby pobrać faktury.' : 'Połącz się z KSeF, aby móc synchronizować dane raportów.'}
                            </div>
                        )}

                        {/* Filters */}
                        <div className="ks-card p-4">
                            <p className="ks-label mb-3">Filtry</p>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="space-y-1">
                                    <label className="ks-label">Od</label>
                                    <input type="date" className="ks-input" value={filters.dateFrom || ''}
                                        onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value || undefined }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="ks-label">Do</label>
                                    <input type="date" className="ks-input" value={filters.dateTo || ''}
                                        onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value || undefined }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="ks-label">Typ</label>
                                    <select className="ks-input" value={filters.type}
                                        onChange={e => setFilters(f => ({ ...f, type: e.target.value as ReportFilters['type'] }))}>
                                        <option value="all">Wszystkie</option>
                                        <option value="issued">Wystawione</option>
                                        <option value="received">Odebrane</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="ks-label">Szukaj</label>
                                    <input type="text" className="ks-input" placeholder="Kontrahent / numer"
                                        value={filters.q || ''}
                                        onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} />
                                </div>
                            </div>
                        </div>

                        {/* KPI */}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {[
                                { label: 'Przychód brutto', value: formatPLN(kpi.gross) },
                                { label: 'Netto', value: formatPLN(kpi.net) },
                                { label: 'VAT', value: formatPLN(kpi.vat) },
                                { label: 'Liczba faktur', value: String(kpi.count) },
                            ].map(({ label, value }) => (
                                <div key={label} className="ks-card p-5">
                                    <p className="ks-label">{label}</p>
                                    <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Tables grid */}
                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="ks-card overflow-hidden">
                                <h3 className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">VAT wg stawek</h3>
                                <table className="w-full text-sm">
                                    <thead><tr className="bg-muted/40"><TH>Stawka</TH><TH right>Netto</TH><TH right>VAT</TH><TH right>Brutto</TH></tr></thead>
                                    <tbody className="divide-y divide-border">
                                        {Object.keys(byVat).length === 0 ? <EMPTY_ROW colSpan={4} /> :
                                            Object.entries(byVat).map(([rate, v]) => (
                                                <tr key={rate} className="hover:bg-muted/30">
                                                    <td className="px-4 py-2.5">{rate}</td>
                                                    <td className="px-4 py-2.5 text-right">{formatPLN(v.net)}</td>
                                                    <td className="px-4 py-2.5 text-right">{formatPLN(v.vat)}</td>
                                                    <td className="px-4 py-2.5 text-right font-medium">{formatPLN(v.gross)}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="ks-card overflow-hidden">
                                <h3 className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">Top klienci (wg brutto)</h3>
                                <table className="w-full text-sm">
                                    <thead><tr className="bg-muted/40"><TH>Kontrahent</TH><TH right>Brutto</TH></tr></thead>
                                    <tbody className="divide-y divide-border">
                                        {tops.length === 0 ? <EMPTY_ROW colSpan={2} /> :
                                            tops.map((t, i) => (
                                                <tr key={`${t.name}-${i}`} className="hover:bg-muted/30">
                                                    <td className="px-4 py-2.5">{t.name}</td>
                                                    <td className="px-4 py-2.5 text-right font-medium">{formatPLN(t.gross)}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="ks-card overflow-hidden lg:col-span-2">
                                <h3 className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">Przeterminowane należności (wystawione)</h3>
                                <table className="w-full text-sm">
                                    <thead><tr className="bg-muted/40"><TH>Przedział dni</TH><TH right>Kwota brutto</TH></tr></thead>
                                    <tbody className="divide-y divide-border">
                                        {Object.keys(aging).every(k => aging[k] === 0) ? <EMPTY_ROW colSpan={2} /> :
                                            Object.entries(aging).map(([k, v]) => (
                                                <tr key={k} className="hover:bg-muted/30">
                                                    <td className="px-4 py-2.5">{k}</td>
                                                    <td className="px-4 py-2.5 text-right font-medium">{formatPLN(v)}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="ks-card overflow-hidden lg:col-span-2">
                                <h3 className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">
                                    Lista faktur <span className="ml-1 font-normal text-muted-foreground">({filtered.length})</span>
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead><tr className="bg-muted/40">
                                            <TH>Data</TH><TH>Numer</TH><TH>Typ</TH><TH>Kontrahent</TH><TH>NIP</TH>
                                            <TH right>Netto</TH><TH right>VAT</TH><TH right>Brutto</TH>
                                        </tr></thead>
                                        <tbody className="divide-y divide-border">
                                            {filtered.length === 0 ? <EMPTY_ROW colSpan={8} /> :
                                                filtered.map((r, i) => (
                                                    <tr key={`${r.id}-${i}`} className="hover:bg-muted/30">
                                                        <td className="px-4 py-2.5 text-muted-foreground">{r.issueDate}</td>
                                                        <td className="px-4 py-2.5 font-mono text-[11px]">
                                                            <span className={`rounded px-1.5 py-0.5 ${r.type === 'issued' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                                                                {r.number}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <Badge variant={r.type === 'issued' ? 'success' : 'info'}>
                                                                {r.type === 'issued' ? 'Wystawiona' : 'Odebrana'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-2.5 max-w-[160px] truncate">{r.counterparty.name}</td>
                                                        <td className="px-4 py-2.5 font-mono text-[12px]">{r.counterparty.nip || '—'}</td>
                                                        <td className="px-4 py-2.5 text-right">{formatPLN(r.totals.net)}</td>
                                                        <td className="px-4 py-2.5 text-right">{formatPLN(r.totals.vat)}</td>
                                                        <td className="px-4 py-2.5 text-right font-medium">{formatPLN(r.totals.gross)}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
