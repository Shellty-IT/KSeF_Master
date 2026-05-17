// src/services/externalDraftsApi.ts
import axios, { AxiosError } from 'axios';
import type {
    ExternalDraft,
    ExternalDraftsResponse,
    ExternalDraftResponse,
    ExternalDraftStatus
} from '../types/externalDraft';
import { API_BASE_URL, HTTP_TIMEOUTS } from '../constants/api';

const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api/v1/import`,
    headers: { 'Content-Type': 'application/json' },
    timeout: HTTP_TIMEOUTS.default,
});

export async function getDrafts(status?: ExternalDraftStatus): Promise<ExternalDraftsResponse> {
    try {
        const params = status ? { status } : {};
        const response = await apiClient.get<ExternalDraftsResponse>('/drafts', { params });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as ExternalDraftsResponse;
        }
        return { success: false, error: 'Nie udało się pobrać szkiców' };
    }
}

export async function getDraft(id: string): Promise<ExternalDraftResponse> {
    try {
        const response = await apiClient.get<ExternalDraftResponse>(`/drafts/${id}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as ExternalDraftResponse;
        }
        return { success: false, error: 'Nie udało się pobrać szkicu' };
    }
}

export async function approveDraft(id: string): Promise<ExternalDraftResponse> {
    try {
        const response = await apiClient.post<ExternalDraftResponse>(`/drafts/${id}/approve`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as ExternalDraftResponse;
        }
        return { success: false, error: 'Nie udało się zatwierdzić szkicu' };
    }
}

export async function rejectDraft(id: string, reason: string): Promise<ExternalDraftResponse> {
    try {
        const response = await apiClient.post<ExternalDraftResponse>(`/drafts/${id}/reject`, { reason });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as ExternalDraftResponse;
        }
        return { success: false, error: 'Nie udało się odrzucić szkicu' };
    }
}

export function mapDraftToInvoiceForm(draft: ExternalDraft) {
    return {
        invoiceNumber: '',
        issueDate: draft.issueDate,
        saleDate: draft.issueDate,
        seller: {
            nip: draft.sellerNip,
            name: draft.sellerName,
            countryCode: 'PL',
            addressLine1: `${draft.sellerAddress}, ${draft.sellerPostalCode} ${draft.sellerCity}`,
        },
        buyer: {
            nip: draft.buyerNip,
            name: draft.buyerName,
            countryCode: 'PL',
            addressLine1: `${draft.buyerAddress}, ${draft.buyerPostalCode} ${draft.buyerCity}`,
        },
        items: draft.items.map(item => ({
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            unitPriceNet: item.unitPrice * (1 - item.discount / 100),
            vatRate: String(item.vatRate),
        })),
        currency: draft.currency,
        payment: {
            method: 'przelew',
            dueDate: draft.dueDate,
        },
    };
}