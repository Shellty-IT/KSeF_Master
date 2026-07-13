import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PrimaryButton from '../../components/ui/PrimaryButton';
import InvoiceFilters from '../../components/features/invoices/InvoiceFilters';
import FraudBadge from '../../components/features/fraud/FraudBadge';
import KsefStatusAlerts from '../../components/features/ksef/KsefStatusAlerts';
import InvoicePagination from '../../components/features/invoices/InvoicePagination';
import { listReceived } from '../../services/ksefApi';
import type { Invoice } from '../../types/ksef';
import type { RiskFilter } from '../../types/fraud';
import { useInvoiceFilters } from '../../hooks/useInvoiceFilters';
import { useFraudDetection } from '../../hooks/useFraudDetection';
import { useSyncInvoices } from '../../hooks/useSyncInvoices';
import { useInvoicePdfDownload } from '../../hooks/useInvoicePdfDownload';
import { useAuth } from '../../hooks/useAuth';
import SideNav from '../../components/layout/SideNav';
import TopBar from '../../components/layout/TopBar';
import { AlertTriangle, Loader2, FileDown, AlertCircle } from 'lucide-react';

export default function ReceivedInvoices() {
    const { isKsefConnected, needsCompanySetup } = useAuth();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
    const { downloadingPdf, download } = useInvoicePdfDownload();

    const query = useQuery<Invoice[], Error>({
        queryKey: ['receivedInvoices'],
        queryFn: () => listReceived(),
        enabled: isKsefConnected,
        staleTime: 60_000,
    });

    const data: Invoice[] = query.data ?? [];
    const { isLoading, isFetching, error } = query;
    const { sync, isSyncing, syncError } = useSyncInvoices({ queryKey: ['receivedInvoices'] });

    const { filters, setFilters, resetFilters, filteredInvoices, selection, toggleSelection, toggleSelectAll, selectedCount } = useInvoiceFilters(data);
    // Risk analysis always uses the complete server result. UI filters must never
    // change duplicate history or the first-seen contractor calculation.
    const { results: fraudResults, summary: fraudSummary, refresh: refreshFraud } = useFraudDetection(data);

    const finalFilteredInvoices = useMemo(() => {
        if (riskFilter === 'all') return filteredInvoices;
        return filteredInvoices.filter(inv => {
            const result = fraudResults.get(inv.numerKsef);
            if (!result) return false;
            return riskFilter === 'suspicious'
                ? result.alertLevel !== 'none'
                : result.alertLevel === riskFilter;
        });
    }, [filteredInvoices, fraudResults, riskFilter]);

    const total = finalFilteredInvoices.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageClamped = Math.min(page, totalPages);
    const paged = finalFilteredInvoices.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

    const errorMessage = error ? 'Nie udało się pobrać faktur. Sprawdź, czy serwer backendu jest uruchomiony.' : null;

    async function handleDownloadPdf(invoice: Invoice) {
        await download(invoice.numerKsef, () => {
            if (!invoice.invoiceHash) return null;
            return {
                source: 'local',
                invoiceNumber: invoice.numerFaktury,
                issueDate: invoice.dataWystawienia,
                invoiceHash: invoice.invoiceHash,
                ksefEnvironment: invoice.ksefEnvironment,
                ksefNumber: invoice.numerKsef,
                seller: {
                    nip: invoice.nipSprzedawcy || invoice.nipKontrahenta,
                    name: invoice.nazwaSprzedawcy || invoice.nazwaKontrahenta || '',
                    address: '',
                },
                buyer: { nip: '', name: '', address: '' },
                totals: { net: invoice.kwotaNetto || 0, vat: invoice.kwotaVat || 0, gross: invoice.kwotaBrutto },
            };
        });
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <SideNav />
            <main className="flex flex-1 flex-col overflow-hidden">
                <TopBar />
                <div className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-8">
                        <header>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Faktury odebrane</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Lista dokumentów odebranych w KSeF</p>
                        </header>

                        <KsefStatusAlerts needsCompanySetup={needsCompanySetup} isKsefConnected={isKsefConnected} />

                        {syncError && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                                <div>
                                    <strong className="font-semibold text-warning-foreground">Błąd synchronizacji</strong>
                                    <p className="mt-0.5 text-muted-foreground">{syncError}</p>
                                </div>
                            </div>
                        )}

                        <section className="ks-card p-4" aria-labelledby="risk-summary-title">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-start gap-2.5">
                                    <AlertCircle className={`mt-0.5 h-4 w-4 shrink-0 ${fraudSummary.total > 0 ? 'text-destructive' : 'text-accent'}`} />
                                    <div>
                                        <h2 id="risk-summary-title" className="text-sm font-semibold text-foreground">Sygnały ryzyka</h2>
                                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                                            {fraudSummary.total > 0
                                                ? `${fraudSummary.total} faktur wymaga weryfikacji. Alert nie przesądza o nieprawidłowości.`
                                                : 'Nie wykryto sygnałów wymagających weryfikacji.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtr poziomu ryzyka">
                                    {([
                                        { id: 'all', label: 'Wszystkie', count: data.length, cls: 'border-border' },
                                        { id: 'suspicious', label: 'Wymagają uwagi', count: fraudSummary.total, cls: 'border-warning/40' },
                                        { id: 'high', label: 'Wysokie', count: fraudSummary.high, cls: 'border-destructive/40' },
                                        { id: 'medium', label: 'Średnie', count: fraudSummary.medium, cls: 'border-warning/40' },
                                        { id: 'low', label: 'Niskie', count: fraudSummary.low, cls: 'border-border' },
                                    ] as const).map(option => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            aria-pressed={riskFilter === option.id}
                                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition ${option.cls} ${
                                                riskFilter === option.id
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                                            }`}
                                            onClick={() => { setRiskFilter(option.id); setPage(1); }}
                                        >
                                            {option.label}
                                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${riskFilter === option.id ? 'bg-white/15' : 'bg-muted'}`}>
                                                {option.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Actions bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                {selectedCount > 0 && (
                                    <span className="text-sm text-muted-foreground">Zaznaczono: {selectedCount}</span>
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    {isFetching && !isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    <span>Wyników: {total}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Na stronę:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                                    className="h-9 rounded-lg border border-border bg-card px-2 text-sm"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <PrimaryButton onClick={sync} disabled={!isKsefConnected || isSyncing}>
                                    {isSyncing ? <><Loader2 className="h-4 w-4 animate-spin" />Synchronizacja...</> : 'Synchronizuj z KSeF'}
                                </PrimaryButton>
                            </div>
                        </div>

                        <InvoiceFilters filters={filters} onChange={(next) => { setFilters(next); setPage(1); }} onReset={() => { resetFilters(); setPage(1); }} />

                        {/* Table */}
                        <div className="ks-card overflow-hidden">
                            <div className="overflow-x-auto">
                                {isLoading && (
                                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Pobieranie faktur z KSeF...
                                    </div>
                                )}
                                {errorMessage && <div className="px-6 py-4 text-sm text-destructive">{errorMessage}</div>}
                                {!isLoading && !errorMessage && (
                                    <table className="w-full text-sm">
                                        <thead className="ks-table-header">
                                            <tr>
                                                <th className="px-4 py-3 text-left">
                                                    <input type="checkbox"
                                                        checked={selection.isAllSelected && paged.length > 0}
                                                        onChange={toggleSelectAll} title="Zaznacz wszystkie"
                                                        className="rounded" />
                                                </th>
                                                <th className="px-2 py-3">Status</th>
                                                <th>Data</th>
                                                <th>Nr KSeF</th>
                                                <th>Nr faktury</th>
                                                <th>NIP sprzedawcy</th>
                                                <th>Nazwa</th>
                                                <th className="text-right">Brutto</th>
                                                <th className="text-center">PDF</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {paged.length > 0 ? (
                                                paged.map((row) => {
                                                    const fraudResult = fraudResults.get(row.numerKsef);
                                                    const isSelected = selection.selectedIds.has(row.numerKsef);
                                                    return (
                                                        <tr key={row.numerKsef}
                                                            className={`transition-colors hover:bg-muted/30 ${isSelected ? 'bg-accent/5' : ''} ${fraudResult?.alertLevel === 'high' ? 'bg-destructive/5' : ''} ${fraudResult?.alertLevel === 'medium' ? 'bg-warning/5' : ''}`}>
                                                            <td className="px-4 py-3">
                                                                <input type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleSelection(row.numerKsef)}
                                                                    className="rounded" />
                                                            </td>
                                                            <td className="px-2 py-3">
                                                                {fraudResult && <FraudBadge result={fraudResult} contractorNip={row.nipKontrahenta} onDismiss={refreshFraud} />}
                                                            </td>
                                                            <td className="px-4 py-3 text-foreground/70">{row.dataWystawienia}</td>
                                                            <td className="px-4 py-3 font-mono text-[12px] text-foreground/60">{row.numerKsef}</td>
                                                            <td className="px-4 py-3 font-medium text-foreground">{row.numerFaktury}</td>
                                                            <td className="px-4 py-3 font-mono text-[12px] text-foreground">{row.nipKontrahenta}</td>
                                                            <td className="px-4 py-3 max-w-[180px] truncate text-foreground">{row.nazwaKontrahenta || '—'}</td>
                                                            <td className="px-4 py-3 text-right font-semibold text-foreground">
                                                                {row.kwotaBrutto.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button
                                                                    className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-40"
                                                                    onClick={() => handleDownloadPdf(row)}
                                                                    disabled={downloadingPdf === row.numerKsef || !row.invoiceHash}
                                                                    title={row.invoiceHash ? 'Pobierz PDF z kodem QR' : 'Brak danych do PDF'}
                                                                >
                                                                    {downloadingPdf === row.numerKsef
                                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                        : <FileDown className="h-4 w-4" />}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                                                        {!isKsefConnected ? 'Połącz się z KSeF, aby wyświetlić faktury' : 'Brak faktur spełniających kryteria'}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        <InvoicePagination page={pageClamped} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
                    </div>
                </div>
            </main>
        </div>
    );
}
