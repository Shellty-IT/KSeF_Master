// src/hooks/useInvoicePdfDownload.ts
import { useState } from 'react';
import { downloadInvoicePdf } from '../services/ksefApi';
import type { GeneratePdfRequest } from '../types/invoice';

export function useInvoicePdfDownload() {
    const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

    async function download(
        invoiceId: string,
        buildRequest: () => GeneratePdfRequest | null
    ): Promise<void> {
        setDownloadingPdf(invoiceId);
        try {
            const request = buildRequest();
            if (!request) {
                alert('Brak danych do wygenerowania PDF dla tej faktury.');
                return;
            }
            await downloadInvoicePdf(request);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Nie udało się pobrać PDF');
        } finally {
            setDownloadingPdf(null);
        }
    }

    return { downloadingPdf, download };
}
