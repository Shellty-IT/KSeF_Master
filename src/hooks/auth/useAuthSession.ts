// src/hooks/auth/useAuthSession.ts
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import * as authApi from '../../services/authApi';
import { logout as ksefLogout } from '../../services/ksef/sessionApi';
import type { AuthState } from '../../context/AuthContext';

export const INITIAL_AUTH_STATE: AuthState = {
    isAppAuthenticated: false,
    isKsefConnected: false,
    isLoading: true,
    user: null,
    ksefNip: null,
    ksefAccessTokenValidUntil: null,
    error: null,
    needsCompanySetup: false,
    ksefTokenExpired: false,
    authMethod: 'token',
    ksefEnvironment: 'Test',
    hasCertificate: false,
};

export function useAuthSession(setState: Dispatch<SetStateAction<AuthState>>) {
    useEffect(() => {
        async function checkExistingSession() {
            const token = authApi.getStoredToken();
            if (!token) {
                setState(prev => ({ ...prev, isLoading: false }));
                return;
            }

            const meResult = await authApi.getMe();
            if (!meResult.success || !meResult.user) {
                authApi.clearStoredToken();
                setState(prev => ({ ...prev, isLoading: false }));
                return;
            }

            const user = meResult.user;
            const needsSetup = meResult.needsCompanySetup ?? (user.company === null);
            const isConnected = meResult.isKsefConnected ?? false;

            setState(prev => ({
                ...prev,
                isLoading: false,
                isAppAuthenticated: true,
                isKsefConnected: isConnected,
                user,
                needsCompanySetup: needsSetup,
                ksefNip: user.company?.nip ?? null,
                authMethod: user.company?.authMethod ?? 'token',
                ksefEnvironment: user.company?.ksefEnvironment ?? 'Test',
                hasCertificate: user.company?.hasCertificate ?? false,
            }));
        }

        checkExistingSession();
    }, [setState]);

    const loginApp = async (email: string, password: string): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = await authApi.loginApp({ email, password });

        if (!result.success || !result.token || !result.user) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: result.error || 'Błąd logowania',
            }));
            return false;
        }

        authApi.setStoredToken(result.token);
        const user = result.user;
        const needsSetup = user.company === null;

        setState(prev => ({
            ...prev,
            isLoading: false,
            isAppAuthenticated: true,
            user,
            needsCompanySetup: needsSetup,
            ksefNip: user.company?.nip ?? null,
            authMethod: user.company?.authMethod ?? 'token',
            ksefEnvironment: user.company?.ksefEnvironment ?? 'Test',
            hasCertificate: user.company?.hasCertificate ?? false,
            error: null,
        }));

        return true;
    };

    const registerApp = async (
        email: string,
        password: string,
        name: string
    ): Promise<{ success: boolean; error?: string }> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = await authApi.register({ email, password, name });

        if (!result.success || !result.token || !result.user) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: result.error || 'Błąd rejestracji',
            }));
            return { success: false, error: result.error };
        }

        authApi.setStoredToken(result.token);
        const user = result.user;

        setState(prev => ({
            ...prev,
            isLoading: false,
            isAppAuthenticated: true,
            user,
            needsCompanySetup: true,
            error: null,
        }));

        return { success: true };
    };

    const refreshUser = async (): Promise<void> => {
        const meResult = await authApi.getMe();
        if (meResult.success && meResult.user) {
            setState(prev => ({
                ...prev,
                user: meResult.user!,
                needsCompanySetup: meResult.needsCompanySetup ?? (meResult.user!.company === null),
                ksefNip: meResult.user!.company?.nip ?? null,
                authMethod: meResult.user!.company?.authMethod ?? 'token',
                ksefEnvironment: meResult.user!.company?.ksefEnvironment ?? 'Test',
                hasCertificate: meResult.user!.company?.hasCertificate ?? false,
            }));
        }
    };

    const logout = (): void => {
        authApi.clearStoredToken();
        try {
            ksefLogout().catch(() => {});
        } catch {
            // noop
        }
        setState({ ...INITIAL_AUTH_STATE, isLoading: false });
    };

    return { loginApp, registerApp, refreshUser, logout };
}
