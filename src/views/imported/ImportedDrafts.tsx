// src/views/imported/ImportedDrafts.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import SideNav from '../../components/layout/SideNav';
import TopBar from '../../components/layout/TopBar';
import PrimaryButton from '../../components/buttons/PrimaryButton';
import { getDrafts, approveDraft, rejectDraft, mapDraftToInvoiceForm } from '../../services/externalDraftsApi';
import type { ExternalDraft, ExternalDraftStatus } from '../../types/externalDraft';
import './ImportedDrafts.css';
import '../dashboard/Dashboard.css';

type StatusFilter = 'all' | ExternalDraftStatus;

const STATUS_LABELS: Record<ExternalDraftStatus, string> = {
    PENDING: 'Oczekujący',
    APPROVED: 'Zatwierdzony',
    REJECTED: 'Odrzucony',
};

const STATUS_CLASSES: Record<ExternalDraftStatus, string> = {
    PENDING: 'status-pending',
    APPROVED: 'status-approved',
    REJECTED: 'status-rejected',
};

function buildPageNumbers(current: number, total: number): (number | 'dots')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | 'dots')[] = [1];
    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);
    if (left > 2) pages.push('dots');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push('dots');
    pages.push(total);
    return pages;
}

export default function ImportedDrafts() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [selectedDraft, setSelectedDraft] = useState<ExternalDraft | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [draftToReject, setDraftToReject] = useState<string | null>(null);

    const query = useQuery({
        queryKey: ['externalDrafts', statusFilter],
        queryFn: () => getDrafts(statusFilter === 'all' ? undefined : statusFilter),
        staleTime: 30_000,
    });

    const approveMutation = useMutation({
        mutationFn: approveDraft,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['externalDrafts'] });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectDraft(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['externalDrafts'] });
            setRejectModalOpen(false);
            setRejectReason('');
            setDraftToReject(null);
        },
    });

    const drafts: ExternalDraft[] = query.data?.success ? (query.data.data ?? []) : [];
    const { isLoading, isFetching, error, refetch } = query;

    const total = drafts.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageClamped = Math.min(page, totalPages);
    const paged = drafts.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);
    const pageNumbers = buildPageNumbers(pageClamped, totalPages);

    const handleApproveAndEdit = (draft: ExternalDraft) => {
        const formData = mapDraftToInvoiceForm(draft);
        sessionStorage.setItem('importedInvoiceData', JSON.stringify(formData));
        sessionStorage.setItem('importedDraftId', draft.id);
        navigate('/invoices/new?source=imported');
    };

    const handleOpenRejectModal = (draftId: string) => {
        setDraftToReject(draftId);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const handleConfirmReject = () => {
        if (draftToReject && rejectReason.trim()) {
            rejectMutation.mutate({ id: draftToReject, reason: rejectReason.trim() });
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pl-PL');
    };

    const formatMoney = (amount: number, currency: string) => {
        return amount.toLocaleString('pl-PL', { style: 'currency', currency });
    };

    return (
        <div className="dash-root">
            <SideNav />
            <main className="dash-main">
                <TopBar />
                <div className="dash-content">
                    <header className="dash-header">
                        <h1>Importowane ze SmartQuote</h1>
                        <p className="subtitle">Szkice faktur przesłane z systemu SmartQuote AI</p>
                    </header>

                    <section className="ops-section">
                        <div className="ops-header">
                            <h2>Szkice do przetworzenia</h2>
                            <div className="ops-actions">
                                <PrimaryButton onClick={() => refetch()} disabled={isLoading || isFetching} icon="⟳">
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
                                    {paged.length > 0 ? (
                                        paged.map((draft) => (
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
                                                        onClick={() => setSelectedDraft(draft)}
                                                        title="Podgląd"
                                                    >
                                                        👁️
                                                    </button>
                                                    {draft.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                className="btn-accent small"
                                                                onClick={() => handleApproveAndEdit(draft)}
                                                                disabled={approveMutation.isPending}
                                                                title="Edytuj i Zatwierdź"
                                                            >
                                                                ✏️ Edytuj
                                                            </button>
                                                            <button
                                                                className="btn-danger small"
                                                                onClick={() => handleOpenRejectModal(draft.id)}
                                                                disabled={rejectMutation.isPending}
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

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-nav"
                                    disabled={pageClamped <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    ‹ <span>Poprzednia</span>
                                </button>
                                {pageNumbers.map((p, i) =>
                                    p === 'dots' ? (
                                        <span key={`dots-${i}`} className="pagination-dots">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            className={`pagination-page ${p === pageClamped ? 'active' : ''}`}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}
                                <button
                                    className="pagination-nav"
                                    disabled={pageClamped >= totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                >
                                    <span>Następna</span> ›
                                </button>
                                <span className="pagination-info">
                                    {(pageClamped - 1) * pageSize + 1}–{Math.min(pageClamped * pageSize, total)} z {total}
                                </span>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {selectedDraft && (
                <div className="modal-backdrop" onClick={() => setSelectedDraft(null)}>
                    <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Podgląd szkicu: {selectedDraft.offerNumber}</h3>
                            <button className="modal-close" onClick={() => setSelectedDraft(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="preview-grid">
                                <div className="preview-section">
                                    <h4>Sprzedawca</h4>
                                    <p><strong>{selectedDraft.sellerName}</strong></p>
                                    <p>NIP: {selectedDraft.sellerNip}</p>
                                    <p>{selectedDraft.sellerAddress}</p>
                                    <p>{selectedDraft.sellerPostalCode} {selectedDraft.sellerCity}</p>
                                </div>
                                <div className="preview-section">
                                    <h4>Nabywca</h4>
                                    <p><strong>{selectedDraft.buyerName}</strong></p>
                                    <p>NIP: {selectedDraft.buyerNip}</p>
                                    <p>{selectedDraft.buyerAddress}</p>
                                    <p>{selectedDraft.buyerPostalCode} {selectedDraft.buyerCity}</p>
                                </div>
                            </div>
                            <div className="preview-dates">
                                <span>Data wystawienia: <strong>{formatDate(selectedDraft.issueDate)}</strong></span>
                                <span>Termin płatności: <strong>{formatDate(selectedDraft.dueDate)}</strong></span>
                            </div>
                            <h4>Pozycje ({selectedDraft.items.length})</h4>
                            <table className="preview-items-table">
                                <thead>
                                <tr>
                                    <th>Nazwa</th>
                                    <th>Ilość</th>
                                    <th>Cena netto</th>
                                    <th>VAT</th>
                                    <th>Brutto</th>
                                </tr>
                                </thead>
                                <tbody>
                                {selectedDraft.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.name}</td>
                                        <td>{item.quantity} {item.unit}</td>
                                        <td>{formatMoney(item.unitPrice, selectedDraft.currency)}</td>
                                        <td>{item.vatRate}%</td>
                                        <td>{formatMoney(item.totalGross, selectedDraft.currency)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            <div className="preview-totals">
                                <div className="total-row">
                                    <span>Netto:</span>
                                    <strong>{formatMoney(selectedDraft.totalNet, selectedDraft.currency)}</strong>
                                </div>
                                <div className="total-row">
                                    <span>VAT:</span>
                                    <strong>{formatMoney(selectedDraft.totalVat, selectedDraft.currency)}</strong>
                                </div>
                                <div className="total-row total-gross">
                                    <span>Brutto:</span>
                                    <strong>{formatMoney(selectedDraft.totalGross, selectedDraft.currency)}</strong>
                                </div>
                            </div>
                            {selectedDraft.status === 'REJECTED' && selectedDraft.rejectionReason && (
                                <div className="rejection-info">
                                    <h4>Powód odrzucenia</h4>
                                    <p>{selectedDraft.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {rejectModalOpen && (
                <div className="modal-backdrop" onClick={() => setRejectModalOpen(false)}>
                    <div className="modal-content reject-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Odrzuć szkic</h3>
                            <button className="modal-close" onClick={() => setRejectModalOpen(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <label className="reject-label">
                                Podaj powód odrzucenia:
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="np. Brak poprawnego NIP nabywcy..."
                                    rows={3}
                                    className="reject-textarea"
                                />
                            </label>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-light" onClick={() => setRejectModalOpen(false)}>
                                Anuluj
                            </button>
                            <button
                                className="btn-danger"
                                onClick={handleConfirmReject}
                                disabled={!rejectReason.trim() || rejectMutation.isPending}
                            >
                                {rejectMutation.isPending ? 'Odrzucanie...' : 'Odrzuć'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}