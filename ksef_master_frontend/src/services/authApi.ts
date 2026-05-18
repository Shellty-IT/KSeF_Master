import { AxiosError } from 'axios';
import { authHttpClient, parseApiError } from './apiClient';
import { tokenStorage } from './tokenStorage';
import type { UserInfo, CompanyInfo, CertificateInfo } from '../types/auth';

export type { UserInfo, CompanyInfo, CertificateInfo };

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface LoginAppRequest {
    email: string;
    password: string;
}

export interface CompanySetupRequest {
    companyName: string;
    nip: string;
    ksefToken: string;
    ksefEnvironment?: string;
}

export interface UpdateCompanyProfileRequest {
    companyName: string;
    nip: string;
}

export interface UpdateKsefTokenRequest {
    ksefToken: string;
}

export interface UpdateKsefEnvironmentRequest {
    ksefEnvironment: string;
}

export interface UploadCertificateRequest {
    certificateBase64: string;
    privateKeyBase64: string;
    password?: string;
}

export interface SwitchAuthMethodRequest {
    authMethod: 'token' | 'certificate';
}

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    error?: string;
    data?: T;
}

export async function register(request: RegisterRequest): Promise<{ success: boolean; error?: string; token?: string; user?: UserInfo }> {
    try {
        const response = await authHttpClient.post<ApiResponse<{ token: string; user: UserInfo }>>('/register', request);
        if (response.data.success && response.data.data) {
            return {
                success: true,
                token: response.data.data.token,
                user: response.data.data.user
            };
        }
        return { success: false, error: response.data.error || 'Błąd rejestracji' };
    } catch (error) {
        return { success: false, error: parseApiError(error) };
    }
}

export async function loginApp(request: LoginAppRequest): Promise<{ success: boolean; error?: string; token?: string; user?: UserInfo }> {
    try {
        const response = await authHttpClient.post<ApiResponse<{ token: string; user: UserInfo }>>('/login', request);
        if (response.data.success && response.data.data) {
            return {
                success: true,
                token: response.data.data.token,
                user: response.data.data.user
            };
        }
        return { success: false, error: response.data.error || 'Błąd logowania' };
    } catch (error) {
        return { success: false, error: parseApiError(error) };
    }
}

export async function getMe(): Promise<{ success: boolean; error?: string; user?: UserInfo; isKsefConnected?: boolean; needsCompanySetup?: boolean }> {
    try {
        const response = await authHttpClient.get<ApiResponse<{ user: UserInfo; isKsefConnected: boolean; needsCompanySetup: boolean }>>('/me');
        if (response.data.success && response.data.data) {
            return {
                success: true,
                user: response.data.data.user,
                isKsefConnected: response.data.data.isKsefConnected,
                needsCompanySetup: response.data.data.needsCompanySetup
            };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        return { success: false, error: parseApiError(error) };
    }
}

export async function setupCompany(request: CompanySetupRequest): Promise<{ success: boolean; error?: string; token?: string; user?: UserInfo }> {
    try {
        const response = await authHttpClient.post<ApiResponse<{ token?: string; user: UserInfo }>>('/company', request);
        if (response.data.success && response.data.data) {
            return {
                success: true,
                token: response.data.data.token,
                user: response.data.data.user
            };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        return { success: false, error: parseApiError(error) };
    }
}

export async function updateCompanyProfile(request: UpdateCompanyProfileRequest): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
    try {
        const response = await authHttpClient.put<ApiResponse<{ user: UserInfo }>>('/company/profile', request);
        if (response.data.success && response.data.data) {
            return { success: true, user: response.data.data.user };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        return { success: false, error: parseApiError(error) };
    }
}

export async function updateKsefToken(request: UpdateKsefTokenRequest): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
    try {
        const response = await authHttpClient.put<ApiResponse<{ user: UserInfo }>>('/company/token', request);
        if (response.data.success && response.data.data) {
            return { success: true, user: response.data.data.user };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        return { success: false, error: parseApiError(error) };
    }
}

export async function updateKsefEnvironment(request: UpdateKsefEnvironmentRequest): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
    try {
        const response = await authHttpClient.put<ApiResponse<{ user: UserInfo }>>('/company/environment', request);
        if (response.data.success && response.data.data) {
            return { success: true, user: response.data.data.user };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        return { success: false, error: parseApiError(error) };
    }
}

export async function uploadCertificate(request: UploadCertificateRequest): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
    try {
        const response = await authHttpClient.post<ApiResponse<{ user: UserInfo }>>('/company/certificate', request);
        if (response.data.success && response.data.data) {
            return { success: true, user: response.data.data.user };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        return { success: false, error: parseApiError(error) };
    }
}

export async function switchAuthMethod(request: SwitchAuthMethodRequest): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
    try {
        const response = await authHttpClient.put<ApiResponse<{ user: UserInfo }>>('/company/auth-method', request);
        if (response.data.success && response.data.data) {
            return { success: true, user: response.data.data.user };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        return { success: false, error: parseApiError(error) };
    }
}

export async function deleteCertificate(): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
    try {
        const response = await authHttpClient.delete<ApiResponse<{ user: UserInfo }>>('/company/certificate');
        if (response.data.success && response.data.data) {
            return { success: true, user: response.data.data.user };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        return { success: false, error: parseApiError(error) };
    }
}

export async function getCertificateInfo(): Promise<{ success: boolean; error?: string; data?: CertificateInfo }> {
    try {
        const response = await authHttpClient.get<ApiResponse<CertificateInfo>>('/company/certificate/info');
        return {
            success: response.data.success,
            error: response.data.error,
            data: response.data.data
        };
    } catch (error) {
        return { success: false, error: parseApiError(error) };
    }
}

export async function connectToKsef(): Promise<{ success: boolean; error?: string; tokenExpired?: boolean; data?: { nip?: string; accessTokenValidUntil?: string; referenceNumber?: string; environment?: string } }> {
    try {
        const response = await authHttpClient.post<ApiResponse<{ nip?: string; accessTokenValidUntil?: string; referenceNumber?: string; environment?: string }>>('/ksef/connect');
        return {
            success: response.data.success,
            error: response.data.error,
            data: response.data.data
        };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return {
                success: false,
                error: error.response.data.error || parseApiError(error),
                tokenExpired: error.response.data.tokenExpired
            };
        }
        return { success: false, error: parseApiError(error) };
    }
}

export async function disconnectFromKsef(): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await authHttpClient.post<ApiResponse<null>>('/ksef/disconnect');
        return {
            success: response.data.success,
            error: response.data.error
        };
    } catch (error) {
        return { success: false, error: parseApiError(error) };
    }
}

export const getStoredToken = tokenStorage.get;
export const setStoredToken = tokenStorage.set;
export const clearStoredToken = tokenStorage.clear;