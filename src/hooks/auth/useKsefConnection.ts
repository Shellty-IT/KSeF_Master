// src/hooks/auth/useKsefConnection.ts
import type { Dispatch, SetStateAction } from 'react';
import * as authApi from '../../services/authApi';
import type { AuthState } from '../../context/AuthContext';

export function useKsefConnection(setState: Dispatch<SetStateAction<AuthState>>) {
    const connectKsef = async (): Promise<{ success: boolean; error?: string; tokenExpired?: boolean }> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = await authApi.connectToKsef();

        if (!result.success) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                ksefTokenExpired: result.tokenExpired || false,
                error: result.error || 'Błąd połączenia z KSeF',
            }));
            return { success: false, error: result.error, tokenExpired: result.tokenExpired };
        }

        setState(prev => ({
            ...prev,
            isLoading: false,
            isKsefConnected: true,
            ksefNip: result.data?.nip ?? prev.ksefNip,
            ksefAccessTokenValidUntil: result.data?.accessTokenValidUntil ?? null,
            ksefTokenExpired: false,
            error: null,
        }));

        return { success: true };
    };

    const disconnectKsef = async (): Promise<{ success: boolean; error?: string }> => {
        const result = await authApi.disconnectFromKsef();

        if (!result.success) {
            return { success: false, error: result.error };
        }

        setState(prev => ({
            ...prev,
            isKsefConnected: false,
            ksefAccessTokenValidUntil: null,
        }));

        return { success: true };
    };

    const updateKsefToken = async (ksefToken: string): Promise<{ success: boolean; error?: string }> => {
        const result = await authApi.updateKsefToken({ ksefToken });

        if (!result.success) {
            return { success: false, error: result.error };
        }

        if (result.user) {
            setState(prev => ({
                ...prev,
                user: result.user!,
                ksefTokenExpired: false,
            }));
        }

        return { success: true };
    };

    const updateKsefEnvironment = async (environment: string): Promise<{ success: boolean; error?: string }> => {
        const result = await authApi.updateKsefEnvironment({ ksefEnvironment: environment });

        if (!result.success) {
            return { success: false, error: result.error };
        }

        if (result.user) {
            setState(prev => ({
                ...prev,
                user: result.user!,
                ksefEnvironment: result.user!.company?.ksefEnvironment ?? 'Test',
            }));
        }

        return { success: true };
    };

    return { connectKsef, disconnectKsef, updateKsefToken, updateKsefEnvironment };
}
