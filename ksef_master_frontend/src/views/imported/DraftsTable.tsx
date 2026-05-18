// src/views/imported/DraftsTable.tsx
import PrimaryButton from '../../components/ui/PrimaryButton';
import InvoicePagination from '../../components/features/invoices/InvoicePagination';
import type { ExternalDraft } from '../../types/externalDraft';
import { STATUS_LABELS, STATUS_CLASSES, formatDate, formatMoney, type StatusFilter } from './draftUtils';

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
        <section className="ops-section">
            <div className="ops-header">
                <h2>Szkice do przetworzenia</h2>
                <div className="ops-actions">
                    <PrimaryButton
                        onClick={() => onRefetch()}
                        disabled={isLoading || isFetching}
                        icon="⟳"
                    >
                        {isLoading || isFetching ? 'Pobieranie...' : 'Odśwież'}
                    </PrimaryButton>
                </div>
            </div>

            <div className="filters-row">
                <label className="filter-label">
                    Status:
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
                        className="filter-select"
                    >
                        <option value="all">Wszystkie</option>
                        <option value="PENDING">Oczekujące</option>
                        <option value="APPROVED">Zatwierdzone</option>
                        <option value="REJECTED">Odrzucone</option>
                    </select>
                </label>
            </div>

            <div className="table-controls">
                <label className="page-size-label">
                    Na stronę:
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                        className="page-size-select"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </label>
                <span className="results-count">
                    {isFetching && !isLoading ? '⟳ ' : ''}Wyników: {total}
                </span>
            </div>

            <div className="table-wrap">
                {isLoading && (
                    <div className="loading-spinner">
                        <span className="loading-spinner-text">Pobieranie szkiców...</span>
                    </div>
                )}
                {error && <div className="error-message">Nie udało się pobrać szkiców</div>}
                {!isLoading && !error && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nr oferty</th>
                                <th>Nabywca</th>
                                <th>Data wystawienia</th>
                                <th>Termin płatności</th>
                                <th>Kwota brutto</th>
                                <th>Status</th>
                                <th>Data importu</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drafts.length > 0 ? (
                                drafts.map((draft) => (
                                    <tr key={draft.id}>
                                        <td><strong>{draft.offerNumber}</strong></td>
                                        <td>
                                            <div className="buyer-cell">
                                                <span className="buyer-name">{draft.buyerName}</span>
                                                <span className="buyer-nip">NIP: {draft.buyerNip}</span>
                                            </div>
                                        </td>
                                        <td>{formatDate(draft.issueDate)}</td>
                                        <td>{formatDate(draft.dueDate)}</td>
                                        <td className="amount-cell">{formatMoney(draft.totalGross, draft.currency)}</td>
                                        <td>
                                            <span className={`status-badge ${STATUS_CLASSES[draft.status]}`}>
                                                {STATUS_LABELS[draft.status]}
                                            </span>
                                        </td>
                                        <td>{formatDate(draft.createdAt)}</td>
                                        <td className="actions-cell">
                                            <button
                                                className="btn-icon"
                                                onClick={() => onSelectDraft(draft)}
                                                title="Podgląd"
                                            >
                                                👁️
                                            </button>
                                            {draft.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        className="btn-accent small"
                                                        onClick={() => onApproveAndEdit(draft)}
                                                        disabled={isApprovePending}
                                                        title="Edytuj i Zatwierdź"
                                                    >
                                                        ✏️ Edytuj
                                                    </button>
                                                    <button
                                                        className="btn-danger small"
                                                        onClick={() => onOpenRejectModal(draft.id)}
                                                        disabled={isRejectPending}
                                                        title="Odrzuć"
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8}>
                                        <div className="empty-state">
                                            <span className="empty-state-icon">📭</span>
                                            <span className="empty-state-text">
                                                {statusFilter === 'PENDING'
                                                    ? 'Brak oczekujących szkiców ze SmartQuote'
                                                    : 'Brak szkiców spełniających kryteria'}
                                            </span>
                                            <span className="empty-state-hint">
                                                Szkice pojawią się tutaj automatycznie po przesłaniu z systemu SmartQuote AI
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <InvoicePagination
                page={pageClamped}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
            />
        </section>
    );
}
