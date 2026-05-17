// src/services/ksef/contractorApi.ts

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
