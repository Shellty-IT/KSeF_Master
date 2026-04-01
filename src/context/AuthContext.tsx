// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as authApi from '../services/authApi';
import * as ksefApiModule from '../services/ksefApi';

interface AuthState {
    isAppAuthenticated: boolean;
    isKsefConnected: boolean;
    isLoading: boolean;
    user: authApi.UserInfo | null;
    ksefNip: string | null;
    ksefAccessTokenValidUntil: string | null;
    error: string | null;
    needsCompanySetup: boolean;
    ksefTokenExpired: boolean;
}

interface AuthContextType extends AuthState {
    loginApp: (email: string, password: string) => Promise<boolean>;
    registerApp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
    setupCompany: (companyName: string, nip: string, ksefToken: string) => Promise<{ success: boolean; error?: string }>;
    connectKsef: () => Promise<{ success: boolean; error?: string; tokenExpired?: boolean }>;
    updateKsefToken: (ksefToken: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
    nip: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        isAppAuthenticated: false,
        isKsefConnected: false,
        isLoading: true,
        user: null,
        ksefNip: null,
        ksefAccessTokenValidUntil: null,
        error: null,
        needsCompanySetup: false,
        ksefTokenExpired: false,
    });

    const checkExistingSession = useCallback(async () => {
        const token = authApi.getStoredToken();
        if (!token) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        const meResult = await authApi.getMe();
        if (!meResult.success || !meResult.data) {
            authApi.clearStoredToken();
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        const user = meResult.data;
        const needsSetup = user.company === null;

        setState(prev => ({
            ...prev,
            isLoading: false,
            isAppAuthenticated: true,
            user,
            needsCompanySetup: needsSetup,
            ksefNip: user.company?.nip ?? null,
        }));

        if (!needsSetup) {
            try {
                const statusResult = await ksefApiModule.getStatus();
                if (statusResult.session.isAuthenticated) {
                    setState(prev => ({
                        ...prev,
                        isKsefConnected: true,
                        ksefAccessTokenValidUntil: statusResult.session.accessTokenValidUntil,
                    }));
                }
            } catch {
                // noop
            }
        }
    }, []);

    useEffect(() => {
        checkExistingSession();
    }, [checkExistingSession]);

    const loginApp = async (email: string, password: string): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = await authApi.loginApp({ email, password });

        if (!result.success || !result.data) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: result.error || 'Błąd logowania',
            }));
            return false;
        }

        authApi.setStoredToken(result.data.token);
        const user = result.data.user;
        const needsSetup = user.company === null;

        setState(prev => ({
            ...prev,
            isLoading: false,
            isAppAuthenticated: true,
            user,
            needsCompanySetup: needsSetup,
            ksefNip: user.company?.nip ?? null,
            error: null,
        }));

        return true;
    };

    const registerApp = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = await authApi.register({ email, password, name });

        if (!result.success || !result.data) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: result.error || 'Błąd rejestracji',
            }));
            return { success: false, error: result.error };
        }

        authApi.setStoredToken(result.data.token);
        const user = result.data.user;

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

    const setupCompany = async (companyName: string, nip: string, ksefToken: string): Promise<{ success: boolean; error?: string }> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = await authApi.setupCompany({ companyName, nip, ksefToken });

        if (!result.success || !result.data) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: result.error || 'Błąd konfiguracji firmy',
            }));
            return { success: false, error: result.error };
        }

        if (result.data.token) {
            authApi.setStoredToken(result.data.token);
        }

        const user = result.data.user;

        setState(prev => ({
            ...prev,
            isLoading: false,
            user,
            needsCompanySetup: false,
            ksefNip: user.company?.nip ?? null,
            error: null,
        }));

        return { success: true };
    };

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

    const updateKsefTokenFn = async (ksefToken: string): Promise<{ success: boolean; error?: string }> => {
        const result = await authApi.updateKsefToken({ ksefToken });

        if (!result.success) {
            return { success: false, error: result.error };
        }

        if (result.data) {
            setState(prev => ({
                ...prev,
                user: prev.user ? { ...prev.user, company: result.data!.company } : null,
                ksefTokenExpired: false,
            }));
        }

        return { success: true };
    };

    const refreshUser = async () => {
        const meResult = await authApi.getMe();
        if (meResult.success && meResult.data) {
            setState(prev => ({
                ...prev,
                user: meResult.data!,
                needsCompanySetup: meResult.data!.company === null,
                ksefNip: meResult.data!.company?.nip ?? null,
            }));
        }
    };

    const logout = () => {
        authApi.clearStoredToken();
        try {
            ksefApiModule.logout().catch(() => {});
        } catch {
            // noop
        }
        setState({
            isAppAuthenticated: false,
            isKsefConnected: false,
            isLoading: false,
            user: null,
            ksefNip: null,
            ksefAccessTokenValidUntil: null,
            error: null,
            needsCompanySetup: false,
            ksefTokenExpired: false,
        });
    };

    const contextValue: AuthContextType = {
        ...state,
        isAuthenticated: state.isAppAuthenticated,
        nip: state.ksefNip,
        loginApp,
        registerApp,
        setupCompany,
        connectKsef,
        updateKsefToken: updateKsefTokenFn,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}