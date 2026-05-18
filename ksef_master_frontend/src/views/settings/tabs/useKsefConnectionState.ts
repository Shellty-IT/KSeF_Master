// src/views/settings/tabs/useKsefConnectionState.ts
import { useState, useEffect, type ChangeEvent } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import type { UserInfo } from '../../../types/auth';

export interface KsefConnectionState {
    user: UserInfo | null;
    isKsefConnected: boolean;
    needsCompanySetup: boolean;
    authMethod: 'token' | 'certificate';
    ksefEnvironment: string;
    hasCertificate: boolean;
    isSetupView: boolean;

    companyName: string;
    setCompanyName: (v: string) => void;
    nip: string;
    setNip: (v: string) => void;
    selectedMethod: 'token' | 'certificate';
    setSelectedMethod: (v: 'token' | 'certificate') => void;
    selectedEnvironment: 'Test' | 'Production';
    setSelectedEnvironment: (v: 'Test' | 'Production') => void;
    ksefToken: string;
    setKsefToken: (v: string) => void;
    setupCertFile: File | null;
    setSetupCertFile: (v: File | null) => void;
    setupKeyFile: File | null;
    setSetupKeyFile: (v: File | null) => void;
    setupCertPassword: string;
    setSetupCertPassword: (v: string) => void;

    isSubmitting: boolean;
    isConnecting: boolean;
    isSwitching: boolean;
    connectError: string | null;
    info: string | null;
    errors: string[];
    setErrors: (v: string[]) => void;

    isEditingProfile: boolean;
    setIsEditingProfile: (v: boolean) => void;
    isEditingToken: boolean;
    setIsEditingToken: (v: boolean) => void;
    isEditingEnvironment: boolean;
    setIsEditingEnvironment: (v: boolean) => void;

    handleCertFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleKeyFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSetupSubmit: () => Promise<void>;
    handleConnect: () => Promise<void>;
    handleDisconnect: () => Promise<void>;
    handleSwitchMethod: (method: 'token' | 'certificate') => Promise<void>;
    handleSaveProfile: () => Promise<void>;
    handleSaveToken: () => Promise<void>;
    handleSaveEnvironment: () => Promise<void>;
    handleCertificateSuccess: () => Promise<void>;
}

export function useKsefConnectionState(): KsefConnectionState {
    const {
        user,
        isKsefConnected,
        needsCompanySetup,
        authMethod,
        ksefEnvironment,
        hasCertificate,
        connectKsef,
        disconnectKsef,
        switchAuthMethod,
        setupCompany,
        updateCompanyProfile,
        updateKsefToken,
        updateKsefEnvironment,
        uploadCertificate,
        refreshUser,
    } = useAuth();

    const [companyName, setCompanyName] = useState('');
    const [nip, setNip] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<'token' | 'certificate'>('token');
    const [selectedEnvironment, setSelectedEnvironment] = useState<'Test' | 'Production'>('Test');
    const [ksefToken, setKsefToken] = useState('');

    const [setupCertFile, setSetupCertFile] = useState<File | null>(null);
    const [setupKeyFile, setSetupKeyFile] = useState<File | null>(null);
    const [setupCertPassword, setSetupCertPassword] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const [connectError, setConnectError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [errors, setErrors] = useState<string[]>([]);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingToken, setIsEditingToken] = useState(false);
    const [isEditingEnvironment, setIsEditingEnvironment] = useState(false);

    useEffect(() => {
        if (!needsCompanySetup) {
            setCompanyName(user?.company?.companyName ?? '');
            setNip(user?.company?.nip ?? '');
            setSelectedEnvironment((user?.company?.ksefEnvironment as 'Test' | 'Production') ?? 'Test');
        }
    }, [needsCompanySetup, user]);

    function showInfo(msg: string) {
        setInfo(msg);
        setTimeout(() => setInfo(null), 3000);
    }

    function handleCertFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.crt') && !file.name.endsWith('.cer')) {
                setErrors(prev => [...prev, 'Plik certyfikatu musi mieć rozszerzenie .crt lub .cer']);
                return;
            }
            setSetupCertFile(file);
            setErrors([]);
        }
    }

    function handleKeyFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.key') && !file.name.endsWith('.pem')) {
                setErrors(prev => [...prev, 'Klucz prywatny musi mieć rozszerzenie .key lub .pem']);
                return;
            }
            setSetupKeyFile(file);
            setErrors([]);
        }
    }

    async function handleSetupSubmit() {
        const errs: string[] = [];
        if (!companyName.trim()) errs.push('Nazwa firmy jest wymagana');
        if (!/^\d{10}$/.test(nip.trim())) errs.push('NIP musi mieć dokładnie 10 cyfr');

        if (selectedMethod === 'token') {
            if (!ksefToken.trim()) errs.push('Token KSeF jest wymagany');
            else if (!ksefToken.includes('|')) errs.push('Nieprawidłowy format tokenu KSeF');
        }
        if (selectedMethod === 'certificate') {
            if (!setupCertFile) errs.push('Wybierz plik certyfikatu (.crt)');
            if (!setupKeyFile) errs.push('Wybierz plik klucza prywatnego (.key)');
        }

        setErrors(errs);
        if (errs.length) return;

        setIsSubmitting(true);
        setConnectError(null);

        try {
            if (selectedMethod === 'token') {
                const result = await setupCompany(
                    companyName.trim(),
                    nip.trim(),
                    ksefToken.trim(),
                    selectedEnvironment
                );
                if (!result.success) throw new Error(result.error);
            } else {
                const placeholder = `CERT-SETUP|nip-${nip.trim()}|hash`;
                const setupResult = await setupCompany(
                    companyName.trim(),
                    nip.trim(),
                    placeholder,
                    selectedEnvironment
                );
                if (!setupResult.success) throw new Error(setupResult.error);

                if (setupCertFile && setupKeyFile) {
                    const uploadResult = await uploadCertificate(
                        setupCertFile,
                        setupKeyFile,
                        setupCertPassword || undefined
                    );
                    if (!uploadResult.success) throw new Error(uploadResult.error);
                }

                const switchResult = await switchAuthMethod('certificate');
                if (!switchResult.success) throw new Error(switchResult.error);
            }

            await refreshUser();
            setSetupCertFile(null);
            setSetupKeyFile(null);
            setSetupCertPassword('');
            showInfo('Firma skonfigurowana pomyślnie! Możesz teraz połączyć się z KSeF.');
        } catch (err) {
            setErrors([err instanceof Error ? err.message : 'Nieznany błąd konfiguracji']);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleConnect() {
        setIsConnecting(true);
        setConnectError(null);
        const result = await connectKsef();
        setIsConnecting(false);
        if (!result.success) {
            setConnectError(result.error || 'Błąd połączenia z KSeF');
        } else {
            showInfo('Połączono z KSeF pomyślnie.');
        }
    }

    async function handleDisconnect() {
        if (!confirm('Czy na pewno chcesz odłączyć się od systemu KSeF?')) return;
        setIsConnecting(true);
        setConnectError(null);
        const result = await disconnectKsef();
        setIsConnecting(false);
        if (!result.success) {
            setConnectError(result.error || 'Błąd odłączania od KSeF');
        } else {
            showInfo('Odłączono od KSeF.');
        }
    }

    async function handleSwitchMethod(method: 'token' | 'certificate') {
        if (method === authMethod) return;
        setIsSwitching(true);
        const result = await switchAuthMethod(method);
        setIsSwitching(false);
        if (!result.success) {
            alert(result.error || 'Błąd zmiany metody uwierzytelniania');
            return;
        }
        await refreshUser();
        showInfo(`Metoda zmieniona na: ${method === 'token' ? 'Token autoryzacyjny' : 'Certyfikat'}`);
    }

    async function handleSaveProfile() {
        const errs: string[] = [];
        if (!companyName.trim()) errs.push('Nazwa firmy jest wymagana');
        if (!/^\d{10}$/.test(nip.trim())) errs.push('NIP musi mieć dokładnie 10 cyfr');
        setErrors(errs);
        if (errs.length) return;

        setIsSubmitting(true);
        const result = await updateCompanyProfile(companyName.trim(), nip.trim());
        setIsSubmitting(false);

        if (!result.success) {
            setErrors([result.error || 'Błąd zapisu']);
            return;
        }

        await refreshUser();
        setIsEditingProfile(false);
        showInfo('Dane firmy zaktualizowane.');
    }

    async function handleSaveToken() {
        if (!ksefToken.trim() || !ksefToken.includes('|')) {
            setErrors(['Nieprawidłowy format tokenu KSeF']);
            return;
        }
        setIsSubmitting(true);
        const result = await updateKsefToken(ksefToken.trim());
        setIsSubmitting(false);
        if (!result.success) {
            setErrors([result.error || 'Błąd aktualizacji tokenu']);
            return;
        }
        setIsEditingToken(false);
        setKsefToken('');
        setErrors([]);
        showInfo('Token KSeF zaktualizowany.');
    }

    async function handleSaveEnvironment() {
        setIsSubmitting(true);
        const result = await updateKsefEnvironment(selectedEnvironment);
        setIsSubmitting(false);

        if (!result.success) {
            setErrors([result.error || 'Błąd zmiany środowiska']);
            return;
        }

        await refreshUser();
        setIsEditingEnvironment(false);
        setErrors([]);
        showInfo(`Środowisko zmienione na: ${selectedEnvironment}`);
    }

    async function handleCertificateSuccess() {
        await refreshUser();
        showInfo('Certyfikat zaktualizowany.');
    }

    return {
        user,
        isKsefConnected,
        needsCompanySetup,
        authMethod,
        ksefEnvironment,
        hasCertificate,
        isSetupView: needsCompanySetup,

        companyName, setCompanyName,
        nip, setNip,
        selectedMethod, setSelectedMethod,
        selectedEnvironment, setSelectedEnvironment,
        ksefToken, setKsefToken,
        setupCertFile, setSetupCertFile,
        setupKeyFile, setSetupKeyFile,
        setupCertPassword, setSetupCertPassword,

        isSubmitting,
        isConnecting,
        isSwitching,
        connectError,
        info,
        errors, setErrors,

        isEditingProfile, setIsEditingProfile,
        isEditingToken, setIsEditingToken,
        isEditingEnvironment, setIsEditingEnvironment,

        handleCertFileChange,
        handleKeyFileChange,
        handleSetupSubmit,
        handleConnect,
        handleDisconnect,
        handleSwitchMethod,
        handleSaveProfile,
        handleSaveToken,
        handleSaveEnvironment,
        handleCertificateSuccess,
    };
}
