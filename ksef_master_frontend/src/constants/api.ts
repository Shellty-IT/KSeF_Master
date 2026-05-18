// src/constants/api.ts

export const API_BASE_URL =
    (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080';

export const HTTP_TIMEOUTS = {
    default: 30_000,
    ksef: 120_000,
    ksefLong: 180_000,
    health: 10_000,
} as const;

export const SERVER_HEALTH_CONFIG = {
    maxRetries: 15,
    retryIntervalMs: 2_000,
    endpoint: '/health',
} as const;
