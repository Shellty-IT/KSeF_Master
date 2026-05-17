// src/types/auth.ts

export type AuthMethod = 'token' | 'certificate';

export interface CompanyInfo {
    id: number;
    companyName: string;
    nip: string;
    isActive: boolean;
    hasKsefToken: boolean;
    authMethod: AuthMethod;
    ksefEnvironment: string;
    hasCertificate: boolean;
}

export interface UserInfo {
    id: number;
    email: string;
    name: string;
    company: CompanyInfo | null;
}

export interface CertificateInfo {
    hasCertificate: boolean;
    hasPrivateKey: boolean;
    isPasswordProtected: boolean;
    uploadedAt?: string;
    subjectName?: string;
    notBefore?: string;
    notAfter?: string;
}
