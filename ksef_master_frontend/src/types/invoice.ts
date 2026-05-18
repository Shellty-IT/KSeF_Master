// src/types/invoice.ts

export interface SentInvoiceRecord {
    invoiceNumber: string;
    elementReferenceNumber: string;
    sentAt: string;
    sellerNip: string;
    buyerNip: string;
    buyerName: string;
    grossAmount: number;
    invoiceHash?: string;
    issueDate?: string;
    saleDate?: string;
    issuePlace?: string;
    sellerName?: string;
    sellerAddress?: string;
    sellerBankAccount?: string;
    buyerAddress?: string;
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
    paymentMethod?: string;
    paymentDueDate?: string;
    paymentBankAccount?: string;
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
