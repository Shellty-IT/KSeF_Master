import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PrimaryButton from '../../components/ui/PrimaryButton';
import InvoiceFilters from '../../components/features/invoices/InvoiceFilters';
import FraudBadge from '../../components/features/fraud/FraudBadge';
import KsefStatusAlerts from '../../components/features/ksef/KsefStatusAlerts';
import InvoicePagination from '../../components/features/invoices/InvoicePagination';
import { listReceived } from '../../services/ksefApi';
import type { Invoice } from '../../types/ksef';
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
    const { results: fraudResults, summary: fraudSummary, refresh: refreshFraud } = useFraudDetection(filteredInvoices);

    const finalFilteredInvoices = useMemo(() => {
        if (!filters.showOnlySuspicious) return filteredInvoices;
        return filteredInvoices.filter(inv => {
            const result = fraudResults.get(inv.numerKsef);
            return result && result.alertLevel !== 'none';
        });
    }, [filteredInvoices, filters.showOnlySuspicious, fraudResults]);

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
                    <div className="mx-auto max-w-7xl space-y-4 p-8">
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

                        {fraudSummary.total > 0 && (
                            <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                                <span className="text-destructive">
                                    Wykryto <strong>{fraudSummary.total}</strong> podejrzanych faktur
                                    {fraudSummary.high > 0 && <span> ({fraudSummary.high} wysokich)</span>}
                                    {fraudSummary.medium > 0 && <span> ({fraudSummary.medium} średnich)</span>}
                                </span>
                            </div>
                        )}

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

                        <InvoiceFilters filters={filters} onChange={setFilters} onReset={resetFilters} showSuspiciousFilter={true} />

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
                                        <thead>
                                            <tr className="border-b border-border bg-muted/40">
                                                <th className="px-4 py-3 text-left">
                                                    <input type="checkbox"
                                                        checked={selection.isAllSelected && paged.length > 0}
                                                        onChange={toggleSelectAll} title="Zaznacz wszystkie"
                                                        className="rounded" />
                                                </th>
                                                <th className="px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nr KSeF</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nr faktury</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">NIP sprzedawcy</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nazwa</th>
                                                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Brutto</th>
                                                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">PDF</th>
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
