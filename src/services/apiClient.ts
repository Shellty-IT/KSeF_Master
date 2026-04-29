import axios, { AxiosError, type AxiosInstance } from 'axios';
import { tokenStorage } from './tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export { API_BASE_URL };

function attachAuthHeader(client: AxiosInstance): void {
    client.interceptors.request.use((config) => {
        const token = tokenStorage.get();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
}

function attachUnauthorizedRedirect(client: AxiosInstance): void {
    client.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error instanceof AxiosError && error.response?.status === 401) {
                const currentPath = window.location.hash;
                const publicPaths = ['#/login', '#/register', '#/'];
                if (!publicPaths.includes(currentPath)) {
                    tokenStorage.clear();
                    window.location.hash = '#/login';
                }
            }
            return Promise.reject(error);
        }
    );
}

function createClient(baseURL: string, timeout: number, withRedirect = false): AxiosInstance {
    const client = axios.create({
        baseURL,
        headers: { 'Content-Type': 'application/json' },
        timeout,
    });

    attachAuthHeader(client);

    if (withRedirect) {
        attachUnauthorizedRedirect(client);
    }

    return client;
}

export const authHttpClient = createClient(
    `${API_BASE_URL}/api/auth`,
    30_000,
    false
);

export const ksefHttpClient = createClient(
    `${API_BASE_URL}/api/ksef`,
    120_000,
    true
);

export const ksefHttpClientLong = createClient(
    `${API_BASE_URL}/api/ksef`,
    180_000,
    true
);

export function parseApiError(error: unknown): string {
    if (error instanceof AxiosError) {
        if (error.response?.data?.error) {
            return error.response.data.error;
        }
        if (error.response?.status === 401) {
            return 'Sesja wygasła';
        }
    }
    return 'Błąd połączenia z serwerem';
}