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
}

export interface UpdateCompanyProfileRequest {
    companyName: string;
    nip: string;
}

export interface UpdateKsefTokenRequest {
    ksefToken: string;
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

export interface AuthResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: {
        token: string;
        user: UserInfo;
    };
}

export interface MeResponse {
    success: boolean;
    error?: string;
    data?: UserInfo;
}

export interface CompanyTokenResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: UserInfo;
}

export interface KsefConnectResponse {
    success: boolean;
    message?: string;
    error?: string;
    tokenExpired?: boolean;
    data?: {
        nip: string;
        authMethod: string;
        referenceNumber: string;
        accessTokenValidUntil: string;
        refreshTokenValidUntil: string;
    };
}

export interface CertificateInfoResponse {
    success: boolean;
    error?: string;
    data?: CertificateInfo;
}

export async function register(request: RegisterRequest): Promise<AuthResponse> {
    try {
        const response = await authClient.post<AuthResponse>('/register', request);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as AuthResponse;
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function loginApp(request: LoginAppRequest): Promise<AuthResponse> {
    try {
        const response = await authClient.post<AuthResponse>('/login', request);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as AuthResponse;
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function getMe(): Promise<MeResponse> {
    try {
        const response = await authClient.get<MeResponse>('/me');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            if (error.response.status === 401) {
                localStorage.removeItem('authToken');
                return { success: false, error: 'Sesja wygasła' };
            }
            return error.response.data as MeResponse;
        }
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function setupCompany(request: CompanySetupRequest): Promise<AuthResponse> {
    try {
        const response = await authClient.post<AuthResponse>('/company', request);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as AuthResponse;
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function updateCompanyProfile(request: UpdateCompanyProfileRequest): Promise<AuthResponse> {
    try {
        const response = await authClient.put<AuthResponse>('/company/profile', request);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as AuthResponse;
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function updateKsefToken(request: UpdateKsefTokenRequest): Promise<CompanyTokenResponse> {
    try {
        const response = await authClient.put<CompanyTokenResponse>('/company/token', request);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as CompanyTokenResponse;
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function uploadCertificate(request: UploadCertificateRequest): Promise<CompanyTokenResponse> {
    try {
        const response = await authClient.post<CompanyTokenResponse>('/company/certificate', request);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as CompanyTokenResponse;
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function switchAuthMethod(request: SwitchAuthMethodRequest): Promise<CompanyTokenResponse> {
    try {
        const response = await authClient.put<CompanyTokenResponse>('/company/auth-method', request);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as CompanyTokenResponse;
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function deleteCertificate(): Promise<CompanyTokenResponse> {
    try {
        const response = await authClient.delete<CompanyTokenResponse>('/company/certificate');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as CompanyTokenResponse;
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function getCertificateInfo(): Promise<CertificateInfoResponse> {
    try {
        const response = await authClient.get<CertificateInfoResponse>('/company/certificate/info');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as CertificateInfoResponse;
        return { success: false, error: 'Błąd połączenia z serwerem' };
    }
}

export async function connectToKsef(): Promise<KsefConnectResponse> {
    try {
        const response = await authClient.post<KsefConnectResponse>('/ksef/connect');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response)
            return error.response.data as KsefConnectResponse;
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