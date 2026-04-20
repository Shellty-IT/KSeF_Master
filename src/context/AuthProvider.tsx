// src/context/AuthProvider.tsx
import { useState, useEffect, useCallback, type ReactNode } from 'react';
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
        hasCertificate: false,
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
            authMethod: user.company?.authMethod ?? 'token',
            hasCertificate: user.company?.hasCertificate ?? false,
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
            authMethod: user.company?.authMethod ?? 'token',
            hasCertificate: user.company?.hasCertificate ?? false,
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
            authMethod: user.company?.authMethod ?? 'token',
            hasCertificate: user.company?.hasCertificate ?? false,
            error: null,
        }));

        return { success: true };
    };

    const updateCompanyProfile = async (companyName: string, nip: string): Promise<{ success: boolean; error?: string }> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = await authApi.updateCompanyProfile({ companyName, nip });

        if (!result.success || !result.data) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: result.error || 'Błąd aktualizacji danych firmy',
            }));
            return { success: false, error: result.error };
        }

        const user = result.data.user;

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

    const uploadCertificateFn = async (
        certFile: File,
        keyFile: File,
        password?: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            console.log('📤 Uploading certificate:', certFile.name, '| key:', keyFile.name);
            console.log('   Cert size:', certFile.size, 'bytes | Key size:', keyFile.size, 'bytes');

            // ✅ Walidacja PEM przed konwersją
            const certText = await readFileAsText(certFile);
            const keyText = await readFileAsText(keyFile);

            console.log('📄 Cert PEM first line:', certText.split('\n')[0]);
            console.log('🔑 Key PEM first line:', keyText.split('\n')[0]);

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

            // ✅ Konwersja przez TextEncoder (obsługuje cały ASCII poprawnie)
            const certBase64 = await pemFileToBase64(certFile);
            const keyBase64 = await pemFileToBase64(keyFile);

            console.log('✅ Cert Base64 length:', certBase64.length, '→ bytes:', Math.floor(certBase64.length * 3/4));
            console.log('✅ Key Base64 length:', keyBase64.length, '→ bytes:', Math.floor(keyBase64.length * 3/4));
            console.log('🔐 Password provided:', password ? `YES (${password.length} chars)` : 'NO');

            // ✅ Weryfikacja czy Base64 jest prawidłowe
            try {
                atob(certBase64.replace(/\s/g, ''));
                atob(keyBase64.replace(/\s/g, ''));
                console.log('✅ Base64 validation OK');
            } catch {
                return { success: false, error: 'Błąd konwersji pliku do Base64' };
            }

            const result = await authApi.uploadCertificate({
                certificateBase64: certBase64,
                privateKeyBase64: keyBase64,
                password: password?.trim() || undefined,
            });

            if (!result.success) {
                console.error('❌ Upload failed:', result.error);
                return { success: false, error: result.error };
            }

            if (result.data) {
                setState(prev => ({
                    ...prev,
                    user: prev.user ? { ...prev.user, company: result.data!.company } : null,
                    hasCertificate: result.data!.company?.hasCertificate ?? false,
                }));
            }

            console.log('✅ Certificate uploaded successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Error:', error);
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

        if (result.data) {
            setState(prev => ({
                ...prev,
                user: prev.user ? { ...prev.user, company: result.data!.company } : null,
                authMethod: result.data!.company?.authMethod ?? 'token',
            }));
        }

        return { success: true };
    };

    const deleteCertificateFn = async (): Promise<{ success: boolean; error?: string }> => {
        const result = await authApi.deleteCertificate();

        if (!result.success) {
            return { success: false, error: result.error };
        }

        if (result.data) {
            setState(prev => ({
                ...prev,
                user: prev.user ? { ...prev.user, company: result.data!.company } : null,
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
        if (meResult.success && meResult.data) {
            setState(prev => ({
                ...prev,
                user: meResult.data!,
                needsCompanySetup: meResult.data!.company === null,
                ksefNip: meResult.data!.company?.nip ?? null,
                authMethod: meResult.data!.company?.authMethod ?? 'token',
                hasCertificate: meResult.data!.company?.hasCertificate ?? false,
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
        updateKsefToken: updateKsefTokenFn,
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