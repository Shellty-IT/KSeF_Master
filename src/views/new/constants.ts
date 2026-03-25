// src/views/new/constants.ts
import type { Party, InvoiceLineDraft, VatRate } from './types';

export const DRAFT_KEY = 'invoiceDraft';
export const SELLER_KEY = 'sellerParty';
export const SENT_INVOICES_KEY = 'sentInvoices';

export const emptyParty: Party = {
    name: '',
    nip: '',
    address: '',
    bankAccount: '',
};

export const emptyLine: InvoiceLineDraft = {
    name: '',
    qty: 1,
    unit: 'szt.',
    priceNet: 0,
    vatRate: 23 as VatRate,
    pkwiu: '',
    discount: 0,
};