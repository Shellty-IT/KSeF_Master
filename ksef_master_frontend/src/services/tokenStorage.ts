import { STORAGE_KEYS } from '../constants/storage';

export const tokenStorage = {
    get(): string | null {
        return localStorage.getItem(STORAGE_KEYS.authToken);
    },

    set(token: string): void {
        localStorage.setItem(STORAGE_KEYS.authToken, token);
    },

    clear(): void {
        localStorage.removeItem(STORAGE_KEYS.authToken);
    },
} as const;