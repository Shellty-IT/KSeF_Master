// src/types/ksef.ts

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
    ksefEnvironment?: string;
}

export interface ListInvoicesParams {
    page?: number;
    pageSize?: number;
    nip?: string;
    status?: UpoStatus | '';
    date?: { from?: string; to?: string };
}
