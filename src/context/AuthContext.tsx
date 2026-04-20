// src/context/AuthContext.tsx
import { createContext } from 'react';
import type { UserInfo, CertificateInfo } from '../services/authApi';

export interface AuthState {
    isAppAuthenticated: boolean;
    isKsefConnected: boolean;
    isLoading: boolean;
    user: UserInfo | null;
    ksefNip: string | null;
    ksefAccessTokenValidUntil: string | null;
    error: string | null;
    needsCompanySetup: boolean;
    ksefTokenExpired: boolean;
    authMethod: 'token' | 'certificate';
    hasCertificate: boolean;
}

export interface AuthContextType extends AuthState {
    loginApp: (email: string, password: string) => Promise<boolean>;
    registerApp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
    setupCompany: (companyName: string, nip: string, ksefToken: string) => Promise<{ success: boolean; error?: string }>;
    connectKsef: () => Promise<{ success: boolean; error?: string; tokenExpired?: boolean }>;
    updateKsefToken: (ksefToken: string) => Promise<{ success: boolean; error?: string }>;
    uploadCertificate: (certFile: File, keyFile: File, password?: string) => Promise<{ success: boolean; error?: string }>;
    switchAuthMethod: (method: 'token' | 'certificate') => Promise<{ success: boolean; error?: string }>;
    deleteCertificate: () => Promise<{ success: boolean; error?: string }>;
    getCertificateInfo: () => Promise<CertificateInfo | null>;
    updateCompanyProfile: (companyName: string, nip: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
    nip: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);