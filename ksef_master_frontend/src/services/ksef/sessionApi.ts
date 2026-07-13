// src/services/ksef/sessionApi.ts
import { AxiosError } from 'axios';
import { ksefHttpClient, ksefHttpClientLong } from '../apiClient';

export interface LoginRequest {
    nip: string;
    ksefToken: string;
    ksefEnvironment?: 'Test' | 'Production';
}

export interface LoginResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: {
        nip: string;
        referenceNumber: string;
        accessTokenValidUntil: string;
        refreshTokenValidUntil: string;
    };
}

export interface SessionStatus {
    server: string;
    timestamp: string;
    environment: string;
    version?: string;
    session: {
        isAuthenticated: boolean;
        nip: string | null;
        accessTokenValidUntil: string | null;
        refreshTokenValidUntil: string | null;
        hasActiveOnlineSession: boolean;
        sessionReferenceNumber: string | null;
        sessionValidUntil: string | null;
    };
}

export interface OpenSessionResponse {
    success: boolean;
    error?: string;
    message?: string;
    data?: {
        sessionReferenceNumber: string;
        validUntil: string;
    };
}

export interface CloseSessionAndUpoResponse {
    success: boolean;
    error?: string;
    message?: string;
    data?: {
        sessionReferenceNumber: string;
        upoAvailable: boolean;
        upoReferenceNumber?: string;
        upoXml?: string;
    };
}

export async function getStatus(): Promise<SessionStatus> {
    const response = await ksefHttpClientLong.get<SessionStatus>('/status');
    return response.data;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
    try {
        const response = await ksefHttpClient.post<LoginResponse>('/login', request);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as LoginResponse;
        }
        throw error;
    }
}

export async function logout(): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await ksefHttpClient.post('/logout');
        return response.data;
    } catch {
        return { success: true, message: 'Wylogowano lokalnie' };
    }
}

export async function openSession(): Promise<OpenSessionResponse> {
    try {
        const response = await ksefHttpClient.post<OpenSessionResponse>('/session/open');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as OpenSessionResponse;
        }
        throw error;
    }
}

export async function closeSession(): Promise<{ success: boolean; message?: string }> {
    const response = await ksefHttpClient.post('/session/close');
    return response.data;
}

export async function closeSessionAndGetUpo(): Promise<CloseSessionAndUpoResponse> {
    try {
        const response = await ksefHttpClient.post<CloseSessionAndUpoResponse>('/session/close-and-upo');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            return error.response.data as CloseSessionAndUpoResponse;
        }
        throw error;
    }
}
