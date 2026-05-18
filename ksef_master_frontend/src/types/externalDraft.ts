// src/types/externalDraft.ts
export type ExternalDraftStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ExternalDraftItem {
    name: string;
    description: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    discount: number;
    totalNet: number;
    totalVat: number;
    totalGross: number;
}

export interface ExternalDraft {
    id: string;
    smartQuoteId: string;
    offerNumber: string;
    status: ExternalDraftStatus;
    issueDate: string;
    dueDate: string;
    sellerName: string;
    sellerNip: string;
    sellerAddress: string;
    sellerCity: string;
    sellerPostalCode: string;
    buyerName: string;
    buyerNip: string;
    buyerAddress: string;
    buyerCity: string;
    buyerPostalCode: string;
    items: ExternalDraftItem[];
    totalNet: number;
    totalVat: number;
    totalGross: number;
    currency: string;
    paymentDays: number;
    createdAt: string;
    processedAt: string | null;
    processedBy: string | null;
    rejectionReason: string | null;
}

export interface ExternalDraftsResponse {
    success: boolean;
    data?: ExternalDraft[];
    total?: number;
    error?: string;
}

export interface ExternalDraftResponse {
    success: boolean;
    data?: ExternalDraft;
    message?: string;
    error?: string;
}