// src/services/ksef/invoiceApi.ts
import { AxiosError } from 'axios';
import { ksefHttpClient, ksefHttpClientLong } from '../apiClient';
import type { Invoice, UpoStatus } from '../../types/ksef';
import type { CreateInvoiceRequest } from '../../types/invoice';

export type KsefDateType = 'Issue' | 'Invoicing' | 'PermanentStorage';

export interface InvoiceQueryRequest {
    subjectType: 'Subject1' | 'Subject2';
    dateRange: {
        dateType: KsefDateType;
        from: string;
        to: string;
    };
}

export interface InvoiceMetadata {
    ksefNumber: string;
    invoiceNumber: string | null;
    issueDate: string | null;
    invoicingDate: string | null;
    acquisitionDate: string | null;
    permanentStorageDate: string | null;
    seller: { nip: string | null; name: string | null } | null;
    buyer: { identifier: { type: string; value: string } | null; name: string | null } | null;
    netAmount: number | null;
    grossAmount: number | null;
    vatAmount: number | null;
    currency: string | null;
    invoicingMode: 'Online' | 'Offline' | null;
    invoiceType: string | null;
    formCode: { systemCode: string; schemaVersion: string; value: string } | null;
    isSelfInvoicing: boolean;
    hasAttachment: boolean;
    invoiceHash: string | null;
}

export interface InvoiceQueryResponse {
    success: boolean;
    error?: string;
    data?: {
        hasMore: boolean;
        isTruncated: boolean;
        permanentStorageHwmDate: string | null;
        invoices: InvoiceMetadata[];
        totalCount: number;
        pagesProcessed: number;
    };
}

export interface SendInvoiceResponse {
    success: boolean;
    error?: string;
    message?: string;
    data?: {
        elementReferenceNumber: string;
        processingCode: number;
        processingDescription: string;
        invoiceHash?: string;
    };
}

export interface SyncInvoicesResponse {
    success: boolean;
    error?: string;
    data?: {
        issued: { newCount: number; totalFetched: number };
        received: { newCount: number; totalFetched: number };
        syncedAt: string;
    };
}

export interface CachedInvoice {
    id: number;
    companyProfileId: number;
    ksefReferenceNumber: string;
    nip: string;
    invoiceType: string;
    direction: string;
    invoiceNumber: string | null;
    sellerNip: string | null;
    sellerName: string | null;
    buyerNip: string | null;
    buyerName: string | null;
    netAmount: number | null;
    vatAmount: number | null;
    grossAmount: number | null;
    currency: string | null;
    invoiceDate: string | null;
    acquisitionTimestamp: string;
    syncedAt: string;
    ksefEnvironment: string;
    invoiceHash: string | null;
}

export interface CachedInvoicesResponse {
    success: boolean;
    error?: string;
    data?: {
        invoices: CachedInvoice[];
        totalCount: number;
        fetchedAt: string;
    };
}

export async function getInvoices(request: InvoiceQueryRequest): Promise<InvoiceQueryResponse> {
    try {
        const response = await ksefHttpClient.post<InvoiceQueryResponse>('/invoices', request);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as InvoiceQueryResponse;
        }
        throw error;
    }
}

export async function getCachedInvoices(): Promise<CachedInvoicesResponse> {
    try {
        const response = await ksefHttpClient.get<CachedInvoicesResponse>('/invoices/cached');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as CachedInvoicesResponse;
        }
        throw error;
    }
}

export async function syncInvoices(): Promise<SyncInvoicesResponse> {
    try {
        const response = await ksefHttpClientLong.post<SyncInvoicesResponse>('/invoices/sync');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as SyncInvoicesResponse;
        }
        throw error;
    }
}

export async function sendInvoice(invoice: CreateInvoiceRequest): Promise<SendInvoiceResponse> {
    try {
        const response = await ksefHttpClient.post<SendInvoiceResponse>('/invoice/send', invoice);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as SendInvoiceResponse;
        }
        throw error;
    }
}

export async function listIssued(): Promise<Invoice[]> {
    const response = await getCachedInvoices();
    if (!response.success || !response.data) return [];

    return response.data.invoices
        .filter(i => i.direction === 'issued')
        .map(invoice => ({
            numerKsef: invoice.ksefReferenceNumber,
            numerFaktury: invoice.invoiceNumber || '',
            nazwaKontrahenta: invoice.buyerName || '',
            nipKontrahenta: invoice.buyerNip || '',
            kwotaBrutto: invoice.grossAmount || 0,
            dataWystawienia: invoice.invoiceDate?.split('T')[0] || '',
            status: 'accepted' as UpoStatus,
            kwotaNetto: invoice.netAmount || undefined,
            kwotaVat: invoice.vatAmount || undefined,
            nazwaSprzedawcy: invoice.sellerName || undefined,
            nipSprzedawcy: invoice.sellerNip || undefined,
            invoiceHash: invoice.invoiceHash || undefined,
        }));
}

export async function listReceived(): Promise<Invoice[]> {
    const response = await getCachedInvoices();
    if (!response.success || !response.data) return [];

    return response.data.invoices
        .filter(i => i.direction === 'received')
        .map(invoice => ({
            numerKsef: invoice.ksefReferenceNumber,
            numerFaktury: invoice.invoiceNumber || '',
            nazwaKontrahenta: invoice.sellerName || '',
            nipKontrahenta: invoice.sellerNip || '',
            kwotaBrutto: invoice.grossAmount || 0,
            dataWystawienia: invoice.invoiceDate?.split('T')[0] || '',
            status: 'accepted' as UpoStatus,
            kwotaNetto: invoice.netAmount || undefined,
            kwotaVat: invoice.vatAmount || undefined,
            nazwaSprzedawcy: invoice.sellerName || undefined,
            nipSprzedawcy: invoice.sellerNip || undefined,
            invoiceHash: invoice.invoiceHash || undefined,
        }));
}

export const getReceivedInvoices = listReceived;
