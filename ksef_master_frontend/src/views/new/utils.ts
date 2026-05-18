// src/views/new/utils.ts
import { sanitizeNip } from '../../helpers/nip';
import { getSeller } from '../../services/settings';
import type { Party, InvoiceDraft, SentInvoiceRecord, ImportedInvoiceData, VatRate } from './types';
import { DRAFT_KEY, SELLER_KEY, emptyParty, emptyLine } from './constants';
import { STORAGE_KEYS } from '../../constants/storage';

export function today(): string {
    return new Date().toISOString().slice(0, 10);
}

export function addDays(dateIso: string, days: number): string {
    const d = new Date(dateIso || today());
    d.setDate(d.getDate() + (days || 0));
    return d.toISOString().slice(0, 10);
}

export function suggestNumber(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `FV/${yyyy}/${mm}/001`;
}

export function loadSellerFromStorage(sessionNip?: string | null): Party {
    try {
        const sellerProfile = getSeller();
        if (sellerProfile.name || sellerProfile.address) {
            return {
                name: sellerProfile.name || '',
                nip: sessionNip || '',
                address: sellerProfile.address || '',
                bankAccount: sellerProfile.bankAccount || '',
            };
        }
        const raw = localStorage.getItem(SELLER_KEY);
        if (raw) {
            const obj = JSON.parse(raw);
            return {
                name: obj.name || '',
                nip: sessionNip || sanitizeNip(obj.nip || ''),
                address: obj.address || '',
                bankAccount: obj.bankAccount || '',
            };
        }
    } catch {
        // fallback
    }
    return { ...emptyParty, nip: sessionNip || '' };
}

export function loadDraft(sessionNip?: string | null): InvoiceDraft | null {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw) as InvoiceDraft;
        if (sessionNip) obj.seller.nip = sessionNip;
        return obj;
    } catch {
        return null;
    }
}

export function saveSentInvoice(record: SentInvoiceRecord): void {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.sentInvoices);
        const existing: SentInvoiceRecord[] = raw ? JSON.parse(raw) : [];
        existing.unshift(record);
        localStorage.setItem(STORAGE_KEYS.sentInvoices, JSON.stringify(existing.slice(0, 100)));
    } catch {
        // fallback
    }
}

export function mapVatRateToKsef(vatRate: VatRate): string {
    if (typeof vatRate === 'number') return String(vatRate);
    return vatRate.toLowerCase();
}

export function isValidBankAccount(account: string | undefined): boolean {
    if (!account) return false;
    return account.replace(/[^0-9]/g, '').length === 26;
}

export function createEmptyDraft(sessionNip?: string | null): InvoiceDraft {
    const seller = loadSellerFromStorage(sessionNip);
    const issue = today();
    return {
        number: suggestNumber(),
        place: 'Warszawa',
        issueDate: issue,
        sellDate: issue,
        currency: 'PLN',
        seller,
        buyer: { ...emptyParty },
        lines: [{ ...emptyLine }],
        payment: {
            method: 'przelew',
            dueDays: 14,
            dueDate: addDays(issue, 14),
            bankAccount: seller.bankAccount,
        },
    };
}

export function loadImportedData(): { draft: InvoiceDraft; draftId: string } | null {
    try {
        const dataRaw = sessionStorage.getItem(STORAGE_KEYS.importedInvoiceData);
        const draftId = sessionStorage.getItem(STORAGE_KEYS.importedDraftId);
        if (!dataRaw || !draftId) return null;

        const data = JSON.parse(dataRaw) as ImportedInvoiceData;

        const parseVatRate = (rate: string): VatRate => {
            const num = Number(rate);
            if ([23, 8, 5, 0].includes(num)) return num as VatRate;
            return rate as VatRate;
        };

        const dueDays = data.payment?.dueDate
            ? Math.max(0, Math.round((new Date(data.payment.dueDate).getTime() - new Date(data.issueDate).getTime()) / 86400000))
            : 14;

        const draft: InvoiceDraft = {
            number: data.invoiceNumber || suggestNumber(),
            place: 'Warszawa',
            issueDate: data.issueDate,
            sellDate: data.saleDate || data.issueDate,
            currency: 'PLN',
            seller: {
                name: data.seller.name,
                nip: data.seller.nip,
                address: data.seller.addressLine1,
            },
            buyer: {
                name: data.buyer.name,
                nip: data.buyer.nip,
                address: data.buyer.addressLine1,
            },
            lines: data.items.map(item => ({
                name: item.name,
                qty: item.quantity,
                unit: item.unit,
                priceNet: item.unitPriceNet,
                vatRate: parseVatRate(item.vatRate),
                pkwiu: '',
                discount: 0,
            })),
            payment: {
                method: (data.payment?.method as 'przelew' | 'gotówka') || 'przelew',
                dueDays,
                dueDate: data.payment?.dueDate || addDays(data.issueDate, 14),
            },
        };

        sessionStorage.removeItem(STORAGE_KEYS.importedInvoiceData);

        return { draft, draftId };
    } catch {
        return null;
    }
}