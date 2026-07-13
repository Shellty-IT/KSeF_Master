// src/views/new/types.ts
import type { VatRate } from '../../helpers/vat';
import type { SentInvoiceRecord } from '../../types/invoice';

export type { VatRate };
export type { SentInvoiceRecord };

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
        discountPercent?: number;
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
