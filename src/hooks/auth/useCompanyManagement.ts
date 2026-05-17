// src/hooks/auth/useCompanyManagement.ts
import type { Dispatch, SetStateAction } from 'react';
import * as authApi from '../../services/authApi';
import type { AuthState } from '../../context/AuthContext';

export function useCompanyManagement(setState: Dispatch<SetStateAction<AuthState>>) {
    const setupCompany = async (
        companyName: string,
        nip: string,
        ksefToken: string,
        ksefEnvironment?: string
    ): Promise<{ success: boolean; error?: string }> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = await authApi.setupCompany({
            companyName,
            nip,
            ksefToken,
            ksefEnvironment: ksefEnvironment || 'Test',
        });

        if (!result.success || !result.user) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: result.error || 'Błąd konfiguracji firmy',
            }));
            return { success: false, error: result.error };
        }

        if (result.token) {
            authApi.setStoredToken(result.token);
        }

        const user = result.user;

        setState(prev => ({
            ...prev,
            isLoading: false,
            user,
            needsCompanySetup: false,
            ksefNip: user.company?.nip ?? null,
            authMethod: user.company?.authMethod ?? 'token',
            ksefEnvironment: user.company?.ksefEnvironment ?? 'Test',
            hasCertificate: user.company?.hasCertificate ?? false,
            error: null,
        }));

        return { success: true };
    };

    const updateCompanyProfile = async (
        companyName: string,
        nip: string
    ): Promise<{ success: boolean; error?: string }> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = await authApi.updateCompanyProfile({ companyName, nip });

        if (!result.success || !result.user) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: result.error || 'Błąd aktualizacji danych firmy',
            }));
            return { success: false, error: result.error };
        }

        const user = result.user;

        setState(prev => ({
            ...prev,
            isLoading: false,
            user,
            ksefNip: user.company?.nip ?? null,
            error: null,
        }));

        return { success: true };
    };

    return { setupCompany, updateCompanyProfile };
}
