// src/utils/sentInvoicesStorage.ts
import { STORAGE_KEYS } from '../constants/storage';
import type { SentInvoiceRecord } from '../types/invoice';

export function loadSentInvoices(): SentInvoiceRecord[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.sentInvoices);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}
