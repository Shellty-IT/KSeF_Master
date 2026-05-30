import SideNav from '../../components/layout/SideNav';
import TopBar from '../../components/layout/TopBar';
import { useDraftActions } from './useDraftActions';
import DraftsTable from './DraftsTable';
import DraftPreviewModal from './DraftPreviewModal';
import RejectDraftModal from './RejectDraftModal';

export default function ImportedDrafts() {
    const s = useDraftActions();

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <SideNav />
            <main className="flex flex-1 flex-col overflow-hidden">
                <TopBar />
                <div className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-7xl space-y-6 p-8">
                        <header>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Importowane ze SmartQuote</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Szkice faktur przesłane z systemu SmartQuote AI</p>
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
