import { AxiosError } from 'axios';
import { ksefHttpClient, ksefHttpClientLong, API_BASE_URL } from './apiClient';
import { tokenStorage } from './tokenStorage';
import type { Invoice, UpoStatus, ListInvoicesParams } from '../types/ksef';
import type { CreateInvoiceRequest, GeneratePdfRequest } from '../types/invoice';

export type { Invoice, UpoStatus, ListInvoicesParams };
export type { CreateInvoiceRequest, GeneratePdfRequest };

export interface LoginRequest {
    nip: string;
    ksefToken: string;
}

export interface LoginResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: {
        nip: string;
        referenceNumber: string;
        accessTokenValidUntil: string;
        refreshTokenValidUntil: string;
    };
}

export interface SessionStatus {
    server: string;
    timestamp: string;
    environment: string;
    version?: string;
    session: {
        isAuthenticated: boolean;
        nip: string | null;
        accessTokenValidUntil: string | null;
        refreshTokenValidUntil: string | null;
        hasActiveOnlineSession: boolean;
        sessionReferenceNumber: string | null;
        sessionValidUntil: string | null;
    };
}

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

export interface OpenSessionResponse {
    success: boolean;
    error?: string;
    message?: string;
    data?: {
        sessionReferenceNumber: string;
        validUntil: string;
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

export async function getStatus(): Promise<SessionStatus> {
    const response = await ksefHttpClientLong.get<SessionStatus>('/status');
    return response.data;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
    try {
        const response = await ksefHttpClient.post<LoginResponse>('/login', request);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as LoginResponse;
        }
        throw error;
    }
}

export async function logout(): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await ksefHttpClient.post('/logout');
        return response.data;
    } catch {
        return { success: true, message: 'Wylogowano lokalnie' };
    }
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

export async function openSession(): Promise<OpenSessionResponse> {
    try {
        const response = await ksefHttpClient.post<OpenSessionResponse>('/session/open');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as OpenSessionResponse;
        }
        throw error;
    }
}

export async function closeSession(): Promise<{ success: boolean; message?: string }> {
    const response = await ksefHttpClient.post('/session/close');
    return response.data;
}

export interface CloseSessionAndUpoResponse {
    success: boolean;
    error?: string;
    message?: string;
    data?: {
        sessionReferenceNumber: string;
        upoAvailable: boolean;
        upoReferenceNumber?: string;
        upoXml?: string;
    };
}

export async function closeSessionAndGetUpo(): Promise<CloseSessionAndUpoResponse> {
    try {
        const response = await ksefHttpClient.post<CloseSessionAndUpoResponse>('/session/close-and-upo');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as CloseSessionAndUpoResponse;
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

export interface Contractor {
    nip: string;
    nazwa?: string;
    name?: string;
    adres?: string;
    address?: string;
    bankAccount?: string;
}

export interface ContractorQueryParams {
    q?: string;
}

export async function listContractors(): Promise<Contractor[]> {
    return [];
}

export async function upsertContractor(): Promise<never> {
    throw new Error('Not implemented');
}

export async function downloadInvoicePdf(request: GeneratePdfRequest): Promise<void> {
    const token = tokenStorage.get();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/ksef/invoice/pdf`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        if (response.status === 401) {
            tokenStorage.clear();
            window.location.hash = '#/login';
            throw new Error('Sesja wygasła. Zaloguj się ponownie.');
        }
        const error = await response.json().catch(() => ({ error: 'Błąd pobierania PDF' }));
        throw new Error(error.error || 'Nie udało się wygenerować PDF');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const contentDisposition = response.headers.get('Content-Disposition');
    let fileName = 'faktura.pdf';
    if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
            fileName = match[1].replace(/['"]/g, '');
        }
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}