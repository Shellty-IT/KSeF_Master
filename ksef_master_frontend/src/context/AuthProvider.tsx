// src/context/AuthProvider.tsx
import { useState, type ReactNode } from 'react';
import { AuthContext, type AuthContextType } from './AuthContext';
import { useAuthSession, INITIAL_AUTH_STATE } from '../hooks/auth/useAuthSession';
import { useCompanyManagement } from '../hooks/auth/useCompanyManagement';
import { useKsefConnection } from '../hooks/auth/useKsefConnection';
import { useCertificateManagement } from '../hooks/auth/useCertificateManagement';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState(INITIAL_AUTH_STATE);

    const { loginApp, registerApp, logout, refreshUser } = useAuthSession(setState);
    const { setupCompany, updateCompanyProfile } = useCompanyManagement(setState);
    const { connectKsef, disconnectKsef, updateKsefToken, updateKsefEnvironment } = useKsefConnection(setState);
    const { uploadCertificate, switchAuthMethod, deleteCertificate, getCertificateInfo } = useCertificateManagement(setState);

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
        updateKsefToken,
        updateKsefEnvironment,
        uploadCertificate,
        switchAuthMethod,
        deleteCertificate,
        getCertificateInfo,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}
