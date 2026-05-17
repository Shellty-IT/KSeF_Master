// src/hooks/auth/useCertificateManagement.ts
import type { Dispatch, SetStateAction } from 'react';
import * as authApi from '../../services/authApi';
import { pemFileToBase64, readFileAsText } from '../../helpers/fileUtils';
import type { CertificateInfo } from '../../types/auth';
import type { AuthState } from '../../context/AuthContext';

export function useCertificateManagement(setState: Dispatch<SetStateAction<AuthState>>) {
    const uploadCertificate = async (
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
                    error: 'Plik certyfikatu nie zawiera prawidłowego PEM (brak BEGIN CERTIFICATE)',
                };
            }

            if (!keyText.includes('PRIVATE KEY')) {
                return {
                    success: false,
                    error: 'Plik klucza nie zawiera prawidłowego PEM (brak PRIVATE KEY)',
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
                error: 'Błąd odczytu plików: ' + (error instanceof Error ? error.message : String(error)),
            };
        }
    };

    const switchAuthMethod = async (
        method: 'token' | 'certificate'
    ): Promise<{ success: boolean; error?: string }> => {
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

    const deleteCertificate = async (): Promise<{ success: boolean; error?: string }> => {
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

    const getCertificateInfo = async (): Promise<CertificateInfo | null> => {
        const result = await authApi.getCertificateInfo();
        if (result.success && result.data) {
            return result.data;
        }
        return null;
    };

    return { uploadCertificate, switchAuthMethod, deleteCertificate, getCertificateInfo };
}
