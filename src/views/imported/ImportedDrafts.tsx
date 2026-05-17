// src/views/imported/ImportedDrafts.tsx
import SideNav from '../../components/layout/SideNav';
import TopBar from '../../components/layout/TopBar';
import { useDraftActions } from './useDraftActions';
import DraftsTable from './DraftsTable';
import DraftPreviewModal from './DraftPreviewModal';
import RejectDraftModal from './RejectDraftModal';
import './ImportedDrafts.css';

export default function ImportedDrafts() {
    const s = useDraftActions();

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

                    <DraftsTable
                        drafts={s.paged}
                        isLoading={s.isLoading}
                        isFetching={s.isFetching}
                        error={s.error}
                        statusFilter={s.statusFilter}
                        setStatusFilter={s.setStatusFilter}
                        pageSize={s.pageSize}
                        setPage={s.setPage}
                        setPageSize={s.setPageSize}
                        total={s.total}
                        totalPages={s.totalPages}
                        pageClamped={s.pageClamped}
                        isApprovePending={s.isApprovePending}
                        isRejectPending={s.isRejectPending}
                        onRefetch={s.refetch}
                        onSelectDraft={s.setSelectedDraft}
                        onApproveAndEdit={s.handleApproveAndEdit}
                        onOpenRejectModal={s.handleOpenRejectModal}
                    />
                </div>
            </main>

            {s.selectedDraft && (
                <DraftPreviewModal
                    draft={s.selectedDraft}
                    onClose={() => s.setSelectedDraft(null)}
                />
            )}

            {s.rejectModalOpen && (
                <RejectDraftModal
                    rejectReason={s.rejectReason}
                    setRejectReason={s.setRejectReason}
                    onConfirm={s.handleConfirmReject}
                    onClose={() => s.setRejectModalOpen(false)}
                    isPending={s.isRejectPending}
                />
            )}
        </div>
    );
}
