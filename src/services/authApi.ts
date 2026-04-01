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

export interface UpdateKsefTokenRequest {
    ksefToken: string;
}

export interface CompanyInfo {
    id: number;
    companyName: string;
    nip: string;
    isActive: boolean;
    hasKsefToken: boolean;
}

export interface UserInfo {
    id: number;
    email: string;
    name: string;
    company: CompanyInfo | null;
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
        referenceNumber: string;
        accessTokenValidUntil: string;
        refreshTokenValidUntil: string;
    };
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