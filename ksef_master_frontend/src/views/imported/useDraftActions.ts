// src/views/imported/useDraftActions.ts
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDrafts, approveDraft, rejectDraft, mapDraftToInvoiceForm } from '../../services/externalDraftsApi';
import type { ExternalDraft } from '../../types/externalDraft';
import { STORAGE_KEYS } from '../../constants/storage';
import type { StatusFilter } from './draftUtils';

export function useDraftActions() {
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

    function handleApproveAndEdit(draft: ExternalDraft) {
        const formData = mapDraftToInvoiceForm(draft);
        sessionStorage.setItem(STORAGE_KEYS.importedInvoiceData, JSON.stringify(formData));
        sessionStorage.setItem(STORAGE_KEYS.importedDraftId, draft.id);
        navigate('/invoices/new?source=imported');
    }

    function handleOpenRejectModal(draftId: string) {
        setDraftToReject(draftId);
        setRejectReason('');
        setRejectModalOpen(true);
    }

    function handleConfirmReject() {
        if (draftToReject && rejectReason.trim()) {
            rejectMutation.mutate({ id: draftToReject, reason: rejectReason.trim() });
        }
    }

    return {
        paged,
        isLoading,
        isFetching,
        error,
        refetch,

        statusFilter, setStatusFilter,
        page, setPage,
        pageSize, setPageSize,
        total, totalPages, pageClamped,

        selectedDraft, setSelectedDraft,
        rejectModalOpen, setRejectModalOpen,
        rejectReason, setRejectReason,

        isApprovePending: approveMutation.isPending,
        isRejectPending: rejectMutation.isPending,

        handleApproveAndEdit,
        handleOpenRejectModal,
        handleConfirmReject,
    };
}
