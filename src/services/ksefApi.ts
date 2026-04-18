// src/services/ksefApi.ts
import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function createAuthClient(timeout = 120000) {
    const client = axios.create({
        baseURL: `${API_BASE_URL}/api/ksef`,
        headers: { 'Content-Type': 'application/json' },
        timeout,
    });

    client.interceptors.request.use((config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    client.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error instanceof AxiosError && error.response?.status === 401) {
                const currentPath = window.location.hash;
                if (currentPath !== '#/login' && currentPath !== '#/register' && currentPath !== '#/') {
                    localStorage.removeItem('authToken');
                    window.location.hash = '#/login';
                }
            }
            return Promise.reject(error);
        }
    );

    return client;
}

const apiClient = createAuthClient(120000);
const apiClientWithLongTimeout = createAuthClient(180000);

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

export interface CreateInvoiceRequest {
    invoiceNumber: string;
    issueDate: string;
    saleDate: string;
    seller: {
        nip: string;
        name: string;
        countryCode?: string;
        addressLine1: string;
        addressLine2?: string;
    };
    buyer: {
        nip: string;
        name: string;
        countryCode?: string;
        addressLine1: string;
        addressLine2?: string;
    };
    items: {
        name: string;
        unit: string;
        quantity: number;
        unitPriceNet: number;
        vatRate: string;
    }[];
    currency?: string;
    issuePlace?: string;
    payment?: {
        method: string;
        dueDate?: string;
        bankAccount?: string;
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

export async function getStatus(): Promise<SessionStatus> {
    const response = await apiClientWithLongTimeout.get<SessionStatus>('/status');
    return response.data;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
    try {
        const response = await apiClient.post<LoginResponse>('/login', request);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as LoginResponse;
        throw error;
    }
}

export async function logout(): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await apiClient.post('/logout');
        return response.data;
    } catch {
        return { success: true, message: 'Wylogowano lokalnie' };
    }
}

export async function getInvoices(request: InvoiceQueryRequest): Promise<InvoiceQueryResponse> {
    try {
        const response = await apiClient.post<InvoiceQueryResponse>('/invoices', request);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as InvoiceQueryResponse;
        throw error;
    }
}

export async function openSession(): Promise<OpenSessionResponse> {
    try {
        const response = await apiClient.post<OpenSessionResponse>('/session/open');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as OpenSessionResponse;
        throw error;
    }
}

export async function closeSession(): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post('/session/close');
    return response.data;
}

export async function sendInvoice(invoice: CreateInvoiceRequest): Promise<SendInvoiceResponse> {
    try {
        const response = await apiClient.post<SendInvoiceResponse>('/invoice/send', invoice);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as SendInvoiceResponse;
        throw error;
    }
}

export type UpoStatus = 'accepted' | 'pending' | 'rejected';

export interface Invoice {
    numerKsef: string;
    numerFaktury: string;
    nazwaKontrahenta?: string;
    nipKontrahenta: string;
    kwotaBrutto: number;
    dataWystawienia: string;
    status: UpoStatus;
    invoiceHash?: string;
    kwotaNetto?: number;
    kwotaVat?: number;
    nazwaSprzedawcy?: string;
    nipSprzedawcy?: string;
}

export interface ListInvoicesParams {
    page?: number;
    pageSize?: number;
    nip?: string;
    status?: UpoStatus | '';
    date?: { from?: string; to?: string };
}

function mapToLegacyInvoice(invoice: InvoiceMetadata, type: 'issued' | 'received'): Invoice {
    return {
        numerKsef: invoice.ksefNumber,
        numerFaktury: invoice.invoiceNumber || '',
        nazwaKontrahenta: type === 'issued'
            ? invoice.buyer?.name || ''
            : invoice.seller?.name || '',
        nipKontrahenta: type === 'issued'
            ? invoice.buyer?.identifier?.value || ''
            : invoice.seller?.nip || '',
        kwotaBrutto: invoice.grossAmount || 0,
        dataWystawienia: invoice.issueDate || invoice.invoicingDate?.split('T')[0] || '',
        status: 'accepted' as UpoStatus,
        invoiceHash: invoice.invoiceHash || undefined,
        kwotaNetto: invoice.netAmount || undefined,
        kwotaVat: invoice.vatAmount || undefined,
        nazwaSprzedawcy: invoice.seller?.name || undefined,
        nipSprzedawcy: invoice.seller?.nip || undefined,
    };
}

function buildWindows(monthsBack: number): { from: Date; to: Date }[] {
    const now = new Date();
    const windows: { from: Date; to: Date }[] = [];
    const windowMonths = 3;
    const windowCount = Math.ceil(monthsBack / windowMonths);

    for (let i = 0; i < windowCount; i++) {
        const to = new Date(now);
        to.setMonth(to.getMonth() - i * windowMonths);

        const from = new Date(to);
        from.setMonth(from.getMonth() - windowMonths);

        windows.push({ from, to });
    }

    return windows;
}

async function fetchAllInvoices(subjectType: 'Subject1' | 'Subject2'): Promise<Invoice[]> {
    const type = subjectType === 'Subject1' ? 'issued' : 'received';
    const windows = buildWindows(12);
    const seen = new Set<string>();
    const all: Invoice[] = [];

    console.log(`[${type}] Pobieranie z ${windows.length} okien czasowych (PermanentStorage)`);

    const results = await Promise.allSettled(
        windows.map(w =>
            getInvoices({
                subjectType,
                dateRange: {
                    dateType: 'PermanentStorage',
                    from: w.from.toISOString(),
                    to: w.to.toISOString(),
                },
            })
        )
    );

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const w = windows[i];

        if (result.status === 'rejected') {
            console.error(`[${type}] Okno ${i + 1} błąd:`, result.reason);
            continue;
        }

        if (!result.value.success || !result.value.data) {
            console.error(`[${type}] Okno ${i + 1} (${w.from.toISOString().slice(0, 10)} → ${w.to.toISOString().slice(0, 10)}) błąd:`, result.value.error);
            continue;
        }

        const windowInvoices = result.value.data.invoices;
        let added = 0;

        for (const inv of windowInvoices) {
            if (!seen.has(inv.ksefNumber)) {
                seen.add(inv.ksefNumber);
                all.push(mapToLegacyInvoice(inv, type));
                added++;
            }
        }

        console.log(`[${type}] Okno ${i + 1}: ${added} faktur (${w.from.toISOString().slice(0, 10)} → ${w.to.toISOString().slice(0, 10)})`);
    }

    console.log(`[${type}] Łącznie: ${all.length} unikalnych faktur`);
    return all;
}

export async function listIssued(): Promise<Invoice[]> {
    return fetchAllInvoices('Subject1');
}

export async function listReceived(): Promise<Invoice[]> {
    return fetchAllInvoices('Subject2');
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

export interface GeneratePdfRequest {
    source: 'local' | 'ksef';
    ksefNumber?: string;
    invoiceHash?: string;
    invoiceNumber?: string;
    issueDate?: string;
    saleDate?: string;
    issuePlace?: string;
    seller?: {
        nip: string;
        name: string;
        address: string;
        bankAccount?: string;
    };
    buyer?: {
        nip: string;
        name: string;
        address: string;
    };
    items?: {
        name: string;
        unit: string;
        quantity: number;
        unitPriceNet: number;
        vatRate: string;
        netValue: number;
        vatValue: number;
        grossValue: number;
    }[];
    totals?: {
        net: number;
        vat: number;
        gross: number;
        perRate?: Record<string, { net: number; vat: number; gross: number }>;
    };
    payment?: {
        method: string;
        dueDate?: string;
        bankAccount?: string;
    };
}

export async function downloadInvoicePdf(request: GeneratePdfRequest): Promise<void> {
    const token = localStorage.getItem('authToken');
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
            localStorage.removeItem('authToken');
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
        if (match && match[1]) fileName = match[1].replace(/['"]/g, '');
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}