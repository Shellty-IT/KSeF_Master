import { useState, useEffect, type ReactNode } from 'react';
import { AuthContext, type AuthState, type AuthContextType } from './AuthContext';
import * as authApi from '../services/authApi';
import * as ksefApiModule from '../services/ksefApi';
import { pemFileToBase64, readFileAsText } from '../helpers/fileUtils';

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
        authMethod: 'token',
        ksefEnvironment: 'Test',
        hasCertificate: false,
    });

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
    }, []);

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

    const registerApp = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
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

    const updateCompanyProfile = async (companyName: string, nip: string): Promise<{ success: boolean; error?: string }> => {
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

    const updateKsefTokenFn = async (ksefToken: string): Promise<{ success: boolean; error?: string }> => {
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

    const updateKsefEnvironmentFn = async (environment: string): Promise<{ success: boolean; error?: string }> => {
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

    const uploadCertificateFn = async (
        certFile: File,
        keyFile: File,
        password?: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const certText = await readFileAsText(certFile);
            const keyText = await readFileAsText(keyFile);

            if (!certText.includes('BEGIN CERTIFICATE')) {
                return {
                    success: false,
                    error: 'Plik certyfikatu nie zawiera prawidłowego PEM (brak BEGIN CERTIFICATE)'
                };
            }

            if (!keyText.includes('PRIVATE KEY')) {
                return {
                    success: false,
                    error: 'Plik klucza nie zawiera prawidłowego PEM (brak PRIVATE KEY)'
                };
            }

            const certBase64 = await pemFileToBase64(certFile);
            const keyBase64 = await pemFileToBase64(keyFile);

            const result = await authApi.uploadCertificate({
                certificateBase64: certBase64,
                privateKeyBase64: keyBase64,
                password: password?.trim() || undefined,
            });

            if (!result.success) {
                return { success: false, error: result.error };
            }

            if (result.user) {
                setState(prev => ({
                    ...prev,
                    user: result.user!,
                    hasCertificate: result.user!.company?.hasCertificate ?? false,
                }));
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: 'Błąd odczytu plików: ' + (error instanceof Error ? error.message : String(error))
            };
        }
    };

    const switchAuthMethodFn = async (method: 'token' | 'certificate'): Promise<{ success: boolean; error?: string }> => {
        const result = await authApi.switchAuthMethod({ authMethod: method });

        if (!result.success) {
            return { success: false, error: result.error };
        }

        if (result.user) {
            setState(prev => ({
                ...prev,
                user: result.user!,
                authMethod: result.user!.company?.authMethod ?? 'token',
            }));
        }

        return { success: true };
    };

    const deleteCertificateFn = async (): Promise<{ success: boolean; error?: string }> => {
        const result = await authApi.deleteCertificate();

        if (!result.success) {
            return { success: false, error: result.error };
        }

        if (result.user) {
            setState(prev => ({
                ...prev,
                user: result.user!,
                authMethod: 'token',
                hasCertificate: false,
            }));
        }

        return { success: true };
    };

    const getCertificateInfoFn = async (): Promise<authApi.CertificateInfo | null> => {
        const result = await authApi.getCertificateInfo();
        if (result.success && result.data) {
            return result.data;
        }
        return null;
    };

    const refreshUser = async () => {
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
            authMethod: 'token',
            ksefEnvironment: 'Test',
            hasCertificate: false,
        });
    };

    const contextValue: AuthContextType = {
        ...state,
        isAuthenticated: state.isAppAuthenticated,
        nip: state.ksefNip,
        loginApp,
        registerApp,
        setupCompany,
        updateCompanyProfile,
        connectKsef,
        disconnectKsef,
        updateKsefToken: updateKsefTokenFn,
        updateKsefEnvironment: updateKsefEnvironmentFn,
        uploadCertificate: uploadCertificateFn,
        switchAuthMethod: switchAuthMethodFn,
        deleteCertificate: deleteCertificateFn,
        getCertificateInfo: getCertificateInfoFn,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}