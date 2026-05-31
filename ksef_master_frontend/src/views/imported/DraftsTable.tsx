import PrimaryButton from '../../components/ui/PrimaryButton';
import InvoicePagination from '../../components/features/invoices/InvoicePagination';
import { Badge } from '../../components/ui/Badge';
import type { ExternalDraft } from '../../types/externalDraft';
import { STATUS_LABELS, STATUS_BADGE_VARIANTS, formatDate, formatMoney, type StatusFilter } from './draftUtils';
import { RefreshCw, Eye, Pencil, X, Loader2, Inbox } from 'lucide-react';

interface Props {
    drafts: ExternalDraft[];
    isLoading: boolean;
    isFetching: boolean;
    error: Error | null;
    statusFilter: StatusFilter;
    setStatusFilter: (v: StatusFilter) => void;
    pageSize: number;
    setPage: (v: number) => void;
    setPageSize: (v: number) => void;
    total: number;
    totalPages: number;
    pageClamped: number;
    isApprovePending: boolean;
    isRejectPending: boolean;
    onRefetch: () => void;
    onSelectDraft: (draft: ExternalDraft) => void;
    onApproveAndEdit: (draft: ExternalDraft) => void;
    onOpenRejectModal: (draftId: string) => void;
}

export default function DraftsTable({
    drafts, isLoading, isFetching, error,
    statusFilter, setStatusFilter,
    pageSize, setPage, setPageSize,
    total, totalPages, pageClamped,
    isApprovePending, isRejectPending,
    onRefetch, onSelectDraft, onApproveAndEdit, onOpenRejectModal,
}: Props) {
    return (
        <section className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        Status:
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
                            className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
                        >
                            <option value="all">Wszystkie</option>
                            <option value="PENDING">Oczekujące</option>
                            <option value="APPROVED">Zatwierdzone</option>
                            <option value="REJECTED">Odrzucone</option>
                        </select>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        Na stronę:
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                            className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </label>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {isFetching && !isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <span>Wyników: {total}</span>
                    </div>
                </div>
                <PrimaryButton onClick={onRefetch} disabled={isLoading || isFetching}>
                    <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    {isLoading || isFetching ? 'Pobieranie...' : 'Odśwież'}
                </PrimaryButton>
            </div>

            {/* Table */}
            <div className="ks-card overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Pobieranie szkiców...
                        </div>
                    )}
                    {error && (
                        <div className="px-6 py-4 text-sm text-destructive">Nie udało się pobrać szkiców</div>
                    )}
                    {!isLoading && !error && (
                        <table className="w-full text-sm">
                            <thead className="ks-table-header">
                                <tr>
                                    {['Nr oferty', 'Nabywca', 'Data wystawienia', 'Termin płatności', 'Kwota brutto', 'Status', 'Data importu', 'Akcje'].map((h) => (
                                        <th key={h}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {drafts.length > 0 ? (
                                    drafts.map((draft) => (
                                        <tr key={draft.id} className="transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3 font-semibold">{draft.offerNumber}</td>
                                            <td className="px-4 py-3">
                                                <div className="leading-tight">
                                                    <div className="font-medium">{draft.buyerName}</div>
                                                    <div className="font-mono text-[11px] text-foreground/60">NIP {draft.buyerNip}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-foreground/70">{formatDate(draft.issueDate)}</td>
                                            <td className="px-4 py-3 text-foreground/70">{formatDate(draft.dueDate)}</td>
                                            <td className="px-4 py-3 font-semibold text-foreground">{formatMoney(draft.totalGross, draft.currency)}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={STATUS_BADGE_VARIANTS[draft.status]} dot>
                                                    {STATUS_LABELS[draft.status]}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-foreground/70">{formatDate(draft.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                                                        onClick={() => onSelectDraft(draft)}
                                                        title="Podgląd"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    {draft.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-[12px] font-medium text-accent transition hover:bg-accent/20 disabled:opacity-40"
                                                                onClick={() => onApproveAndEdit(draft)}
                                                                disabled={isApprovePending}
                                                                title="Edytuj i Zatwierdź"
                                                            >
                                                                <Pencil className="h-3 w-3" /> Edytuj
                                                            </button>
                                                            <button
                                                                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                                                                onClick={() => onOpenRejectModal(draft.id)}
                                                                disabled={isRejectPending}
                                                                title="Odrzuć"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-14 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Inbox className="h-8 w-8 text-muted-foreground/40" />
                                                <p className="text-sm font-medium text-foreground">
                                                    {statusFilter === 'PENDING' ? 'Brak oczekujących szkiców ze SmartQuote' : 'Brak szkiców spełniających kryteria'}
                                                </p>
                                                <p className="text-[12px] text-muted-foreground">
                                                    Szkice pojawią się tutaj automatycznie po przesłaniu z systemu SmartQuote AI
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <InvoicePagination page={pageClamped} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
        </section>
    );
}
