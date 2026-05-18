import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { syncInvoices } from '../services/ksefApi';

interface UseSyncInvoicesOptions {
    queryKey: string[];
}

export function useSyncInvoices({ queryKey }: UseSyncInvoicesOptions) {
    const queryClient = useQueryClient();
    const [syncError, setSyncError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: syncInvoices,
        onSuccess: (result) => {
            setSyncError(null);
            if (result.success) {
                queryClient.invalidateQueries({ queryKey });
            } else {
                setSyncError(result.error ?? 'Błąd synchronizacji');
            }
        },
        onError: (err: Error) => {
            setSyncError(err.message ?? 'Błąd synchronizacji');
        },
    });

    return {
        sync: () => mutation.mutate(),
        isSyncing: mutation.isPending,
        syncError,
        clearSyncError: () => setSyncError(null),
    };
}