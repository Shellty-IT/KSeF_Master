import { useKsefConnectionState } from './useKsefConnectionState';
import KsefCompanySetupForm from './KsefCompanySetupForm';
import KsefCompanyProfileCard from './KsefCompanyProfileCard';
import KsefEnvironmentCard from './KsefEnvironmentCard';
import KsefConnectionCard from './KsefConnectionCard';
import KsefAuthMethodCard from './KsefAuthMethodCard';
import { AlertCircle } from 'lucide-react';

export default function TabKsefConnection() {
    const s = useKsefConnectionState();

    return (
        <div className="space-y-4">
            {s.info && (
                <div className="rounded-lg border border-accent/20 bg-accent/10 px-4 py-2.5 text-sm text-accent">
                    {s.info}
                </div>
            )}

            {s.errors.length > 0 && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <ul className="space-y-0.5">
                        {s.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                </div>
            )}

            {s.isSetupView ? (
                <KsefCompanySetupForm
                    companyName={s.companyName} setCompanyName={s.setCompanyName}
                    nip={s.nip} setNip={s.setNip}
                    selectedMethod={s.selectedMethod} setSelectedMethod={s.setSelectedMethod}
                    selectedEnvironment={s.selectedEnvironment} setSelectedEnvironment={s.setSelectedEnvironment}
                    ksefToken={s.ksefToken} setKsefToken={s.setKsefToken}
                    setupCertFile={s.setupCertFile} setupKeyFile={s.setupKeyFile}
                    setupCertPassword={s.setupCertPassword} setSetupCertPassword={s.setSetupCertPassword}
                    isSubmitting={s.isSubmitting}
                    onCertFileChange={s.handleCertFileChange} onKeyFileChange={s.handleKeyFileChange}
                    onSubmit={s.handleSetupSubmit}
                />
            ) : (
                <>
                    <KsefCompanyProfileCard
                        user={s.user}
                        companyName={s.companyName} setCompanyName={s.setCompanyName}
                        nip={s.nip} setNip={s.setNip}
                        isEditing={s.isEditingProfile} setIsEditing={s.setIsEditingProfile}
                        isSubmitting={s.isSubmitting}
                        onSave={s.handleSaveProfile}
                        onCancel={() => {
                            s.setIsEditingProfile(false);
                            s.setCompanyName(s.user?.company?.companyName ?? '');
                            s.setNip(s.user?.company?.nip ?? '');
                            s.setErrors([]);
                        }}
                    />
                    <KsefEnvironmentCard
                        ksefEnvironment={s.ksefEnvironment}
                        selectedEnvironment={s.selectedEnvironment} setSelectedEnvironment={s.setSelectedEnvironment}
                        isEditing={s.isEditingEnvironment} setIsEditing={s.setIsEditingEnvironment}
                        isSubmitting={s.isSubmitting}
                        onSave={s.handleSaveEnvironment}
                        onCancel={() => {
                            s.setIsEditingEnvironment(false);
                            s.setSelectedEnvironment((s.user?.company?.ksefEnvironment as 'Test' | 'Production') ?? 'Test');
                            s.setErrors([]);
                        }}
                    />
                    <KsefConnectionCard
                        isKsefConnected={s.isKsefConnected} authMethod={s.authMethod}
                        isConnecting={s.isConnecting} connectError={s.connectError}
                        onConnect={s.handleConnect} onDisconnect={s.handleDisconnect}
                    />
                    <KsefAuthMethodCard
                        authMethod={s.authMethod} hasCertificate={s.hasCertificate}
                        isSwitching={s.isSwitching}
                        isEditingToken={s.isEditingToken} setIsEditingToken={s.setIsEditingToken}
                        ksefToken={s.ksefToken} setKsefToken={s.setKsefToken}
                        isSubmitting={s.isSubmitting}
                        onSwitchMethod={s.handleSwitchMethod}
                        onSaveToken={s.handleSaveToken}
                        onCertificateSuccess={s.handleCertificateSuccess}
                    />
                </>
            )}
        </div>
    );
}
