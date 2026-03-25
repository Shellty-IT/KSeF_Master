// src/views/new/types.ts
import type { VatRate } from '../../helpers/vat';

export type { VatRate };

export interface InvoiceLineDraft {
    name: string;
    pkwiu?: string;
    qty: number;
    unit: string;
    priceNet: number;
    vatRate: VatRate;
    discount?: number;
}

export interface Party {
    name: string;
    nip: string;
    address: string;
    bankAccount?: string;
}

export interface InvoiceDraft {
    number: string;
    place: string;
    issueDate: string;
    sellDate: string;
    currency: 'PLN';
    seller: Party;
    buyer: Party;
    lines: InvoiceLineDraft[];
    payment: {
        method: 'przelew' | 'gotówka';
        dueDays: number;
        dueDate: string;
        bankAccount?: string;
    };
}

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

export interface ImportedInvoiceData {
    invoiceNumber: string;
    issueDate: string;
    saleDate: string;
    seller: {
        nip: string;
        name: string;
        countryCode: string;
        addressLine1: string;
    };
    buyer: {
        nip: string;
        name: string;
        countryCode: string;
        addressLine1: string;
    };
    items: Array<{
        name: string;
        unit: string;
        quantity: number;
        unitPriceNet: number;
        vatRate: string;
    }>;
    currency: string;
    payment: {
        method: string;
        dueDate: string;
    };
}

export interface InvoiceTotals {
    net: number;
    vat: number;
    gross: number;
    perRate: Record<string, { net: number; vat: number; gross: number }>;
}