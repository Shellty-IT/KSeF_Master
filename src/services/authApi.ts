// src/services/authApi.ts
import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const authClient = axios.create({
    baseURL: `${API_BASE_URL}/api/auth`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
});

authClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

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

export interface CompanyInfo {
    id: number;
    companyName: string;
    nip: string;
    isActive: boolean;
    hasKsefToken: boolean;
    authMethod: 'token' | 'certificate';
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

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    error?: string;
    data?: T;
}

export async function register(request: RegisterRequest): Promise<{ success: boolean; error?: string; token?: string; user?: UserInfo }> {
    try {
        const response = await authClient.post<ApiResponse<{ token: string; user: UserInfo }>>('/register', request);
        if (response.data.success && response.data.data) {
            return {
                success: true,
                token: response.data.data.token,
                user: response.data.data.user
            };
        }
        return { success: false, error: response.data.error || 'Błąd rejestracji' };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data)
            return { success: false, error: error.response.data.error || 'Błąd połączenia z serwerem' };
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function loginApp(request: LoginAppRequest): Promise<{ success: boolean; error?: string; token?: string; user?: UserInfo }> {
    try {
        const response = await authClient.post<ApiResponse<{ token: string; user: UserInfo }>>('/login', request);
        if (response.data.success && response.data.data) {
            return {
                success: true,
                token: response.data.data.token,
                user: response.data.data.user
            };
        }
        return { success: false, error: response.data.error || 'Błąd logowania' };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data)
            return { success: false, error: error.response.data.error || 'Błąd połączenia z serwerem' };
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function getMe(): Promise<{ success: boolean; error?: string; user?: UserInfo; isKsefConnected?: boolean; needsCompanySetup?: boolean }> {
    try {
        const response = await authClient.get<ApiResponse<{ user: UserInfo; isKsefConnected: boolean; needsCompanySetup: boolean }>>('/me');
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
        if (error instanceof AxiosError && error.response) {
            if (error.response.status === 401) {
                localStorage.removeItem('authToken');
                return { success: false, error: 'Sesja wygasła' };
            }
            return { success: false, error: error.response.data?.error || 'Błąd połączenia z serwerem' };
        }
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function setupCompany(request: CompanySetupRequest): Promise<{ success: boolean; error?: string; token?: string; user?: UserInfo }> {
    try {
        const response = await authClient.post<ApiResponse<{ token?: string; user: UserInfo }>>('/company', request);
        if (response.data.success && response.data.data) {
            return {
                success: true,
                token: response.data.data.token,
                user: response.data.data.user
            };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data)
            return { success: false, error: error.response.data.error || 'Błąd połączenia z serwerem' };
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function updateCompanyProfile(request: UpdateCompanyProfileRequest): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
    try {
        const response = await authClient.put<ApiResponse<{ user: UserInfo }>>('/company/profile', request);
        if (response.data.success && response.data.data) {
            return { success: true, user: response.data.data.user };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data)
            return { success: false, error: error.response.data.error || 'Błąd połączenia z serwerem' };
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function updateKsefToken(request: UpdateKsefTokenRequest): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
    try {
        const response = await authClient.put<ApiResponse<{ user: UserInfo }>>('/company/token', request);
        if (response.data.success && response.data.data) {
            return { success: true, user: response.data.data.user };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data)
            return { success: false, error: error.response.data.error || 'Błąd połączenia z serwerem' };
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function updateKsefEnvironment(request: UpdateKsefEnvironmentRequest): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
    try {
        const response = await authClient.put<ApiResponse<{ user: UserInfo }>>('/company/environment', request);
        if (response.data.success && response.data.data) {
            return { success: true, user: response.data.data.user };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data)
            return { success: false, error: error.response.data.error || 'Błąd połączenia z serwerem' };
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function uploadCertificate(request: UploadCertificateRequest): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
    try {
        const response = await authClient.post<ApiResponse<{ user: UserInfo }>>('/company/certificate', request);
        if (response.data.success && response.data.data) {
            return { success: true, user: response.data.data.user };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data)
            return { success: false, error: error.response.data.error || 'Błąd połączenia z serwerem' };
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function switchAuthMethod(request: SwitchAuthMethodRequest): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
    try {
        const response = await authClient.put<ApiResponse<{ user: UserInfo }>>('/company/auth-method', request);
        if (response.data.success && response.data.data) {
            return { success: true, user: response.data.data.user };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data)
            return { success: false, error: error.response.data.error || 'Błąd połączenia z serwerem' };
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function deleteCertificate(): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
    try {
        const response = await authClient.delete<ApiResponse<{ user: UserInfo }>>('/company/certificate');
        if (response.data.success && response.data.data) {
            return { success: true, user: response.data.data.user };
        }
        return { success: false, error: response.data.error };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data)
            return { success: false, error: error.response.data.error || 'Błąd połączenia z serwerem' };
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function getCertificateInfo(): Promise<{ success: boolean; error?: string; data?: CertificateInfo }> {
    try {
        const response = await authClient.get<ApiResponse<CertificateInfo>>('/company/certificate/info');
        return {
            success: response.data.success,
            error: response.data.error,
            data: response.data.data
        };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data)
            return { success: false, error: error.response.data.error || 'Błąd połączenia z serwerem' };
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function connectToKsef(): Promise<{ success: boolean; error?: string; tokenExpired?: boolean; data?: { nip?: string; accessTokenValidUntil?: string; referenceNumber?: string; environment?: string } }> {
    try {
        const response = await authClient.post<ApiResponse<{ nip?: string; accessTokenValidUntil?: string; referenceNumber?: string; environment?: string }>>('/ksef/connect');
        return {
            success: response.data.success,
            error: response.data.error,
            data: response.data.data
        };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data)
            return {
                success: false,
                error: error.response.data.error || 'Błąd połączenia z serwerem',
                tokenExpired: error.response.data.tokenExpired
            };
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function disconnectFromKsef(): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await authClient.post<ApiResponse<null>>('/ksef/disconnect');
        return {
            success: response.data.success,
            error: response.data.error
        };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data)
            return { success: false, error: error.response.data.error || 'Błąd połączenia z serwerem' };
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export function getStoredToken(): string | null {
    return localStorage.getItem('authToken');
}

export function setStoredToken(token: string): void {
    localStorage.setItem('authToken', token);
}

export function clearStoredToken(): void {
    localStorage.removeItem('authToken');
}