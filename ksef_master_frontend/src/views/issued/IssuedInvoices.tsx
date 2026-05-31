import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import PrimaryButton from '../../components/ui/PrimaryButton';
import InvoiceFilters from '../../components/features/invoices/InvoiceFilters';
import KsefStatusAlerts from '../../components/features/ksef/KsefStatusAlerts';
import InvoicePagination from '../../components/features/invoices/InvoicePagination';
import { listIssued } from '../../services/ksefApi';
import type { Invoice } from '../../types/ksef';
import type { SentInvoiceRecord } from '../../types/invoice';
import { useInvoiceFilters } from '../../hooks/useInvoiceFilters';
import { useSyncInvoices } from '../../hooks/useSyncInvoices';
import { useInvoicePdfDownload } from '../../hooks/useInvoicePdfDownload';
import { useAuth } from '../../hooks/useAuth';
import SideNav from '../../components/layout/SideNav';
import TopBar from '../../components/layout/TopBar';
import { loadSentInvoices } from '../../utils/sentInvoicesStorage';
import { AlertTriangle, Loader2, FileDown } from 'lucide-react';

export default function IssuedInvoices() {
    const { isKsefConnected, needsCompanySetup } = useAuth();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const { downloadingPdf, download } = useInvoicePdfDownload();

    const sentInvoices = useMemo(() => loadSentInvoices(), []);

    const { data: invoices = [], isLoading, isFetching, error } = useQuery<Invoice[]>({
        queryKey: ['issuedInvoices'],
        queryFn: () => listIssued(),
        enabled: isKsefConnected,
        placeholderData: keepPreviousData,
    });

    const { sync, isSyncing, syncError } = useSyncInvoices({ queryKey: ['issuedInvoices'] });
    const { filters, setFilters, resetFilters, filteredInvoices, selection, toggleSelection, toggleSelectAll, selectedCount } = useInvoiceFilters(invoices);

    const total = filteredInvoices.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageClamped = Math.min(page, totalPages);
    const paged = filteredInvoices.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

    const errorMessage = error ? 'Nie udało się pobrać faktur. Sprawdź, czy serwer backendu jest uruchomiony.' : null;

    function findLocalData(invoice: Invoice): SentInvoiceRecord | undefined {
        return sentInvoices.find(s => s.invoiceNumber === invoice.numerFaktury);
    }

    function canDownloadPdf(invoice: Invoice): boolean {
        const localData = findLocalData(invoice);
        return !!(localData?.invoiceHash || invoice.invoiceHash);
    }

    async function handleDownloadPdf(invoice: Invoice) {
        await download(invoice.numerKsef, () => {
            const localData = findLocalData(invoice);
            if (localData?.invoiceHash) {
                return {
                    source: 'local', invoiceNumber: localData.invoiceNumber, issueDate: localData.issueDate,
                    saleDate: localData.saleDate, issuePlace: localData.issuePlace, invoiceHash: localData.invoiceHash,
                    ksefNumber: invoice.numerKsef,
                    seller: { nip: localData.sellerNip, name: localData.sellerName || '', address: localData.sellerAddress || '', bankAccount: localData.sellerBankAccount },
                    buyer: { nip: localData.buyerNip, name: localData.buyerName, address: localData.buyerAddress || '' },
                    items: localData.items,
                    totals: localData.totals,
                    payment: { method: localData.paymentMethod || 'przelew', dueDate: localData.paymentDueDate, bankAccount: localData.paymentBankAccount },
                };
            }
            if (invoice.invoiceHash) {
                return {
                    source: 'local', invoiceNumber: invoice.numerFaktury, issueDate: invoice.dataWystawienia,
                    invoiceHash: invoice.invoiceHash, ksefNumber: invoice.numerKsef,
                    seller: { nip: invoice.nipSprzedawcy || '', name: invoice.nazwaSprzedawcy || '', address: '' },
                    buyer: { nip: invoice.nipKontrahenta, name: invoice.nazwaKontrahenta || '', address: '' },
                    totals: { net: invoice.kwotaNetto || 0, vat: invoice.kwotaVat || 0, gross: invoice.kwotaBrutto },
                };
            }
            return null;
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
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Faktury wystawione</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Lista dokumentów wystawionych w KSeF</p>
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
                                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                    Na stronę:
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
                                </label>
                                <PrimaryButton onClick={sync} disabled={!isKsefConnected || isSyncing}>
                                    {isSyncing ? <><Loader2 className="h-4 w-4 animate-spin" />Synchronizacja...</> : 'Synchronizuj z KSeF'}
                                </PrimaryButton>
                            </div>
                        </div>

                        <InvoiceFilters filters={filters} onChange={setFilters} onReset={resetFilters} showSuspiciousFilter={false} />

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
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nr KSeF</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nr faktury</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">NIP nabywcy</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nazwa</th>
                                                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Brutto</th>
                                                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">PDF</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {paged.length > 0 ? (
                                                paged.map((row) => {
                                                    const canPdf = canDownloadPdf(row);
                                                    return (
                                                        <tr key={row.numerKsef}
                                                            className={`transition-colors hover:bg-muted/30 ${selection.selectedIds.has(row.numerKsef) ? 'bg-accent/5' : ''}`}>
                                                            <td className="px-4 py-3">
                                                                <input type="checkbox"
                                                                    checked={selection.selectedIds.has(row.numerKsef)}
                                                                    onChange={() => toggleSelection(row.numerKsef)}
                                                                    className="rounded" />
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
                                                                    disabled={downloadingPdf === row.numerKsef || !canPdf}
                                                                    title={canPdf ? 'Pobierz PDF z kodem QR' : 'Brak danych do PDF'}
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
                                                    <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
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
