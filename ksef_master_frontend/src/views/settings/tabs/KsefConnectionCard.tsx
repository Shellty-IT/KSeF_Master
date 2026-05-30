import { Plug, Unplug, Loader2, Key, ShieldCheck, AlertCircle } from 'lucide-react';

interface Props {
    isKsefConnected: boolean;
    authMethod: 'token' | 'certificate';
    isConnecting: boolean;
    connectError: string | null;
    onConnect: () => Promise<void>;
    onDisconnect: () => Promise<void>;
}

export default function KsefConnectionCard({
    isKsefConnected, authMethod, isConnecting, connectError, onConnect, onDisconnect,
}: Props) {
    return (
        <div className="ks-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Status połączenia z KSeF</h3>
            <div className="flex gap-8">
                <div>
                    <p className="ks-label mb-1">Status</p>
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${isKsefConnected ? 'text-accent' : 'text-destructive'}`}>
                        <span className={`h-2 w-2 rounded-full ${isKsefConnected ? 'bg-accent' : 'bg-destructive'}`} />
                        {isKsefConnected ? 'Połączony' : 'Niepołączony'}
                    </div>
                </div>
                <div>
                    <p className="ks-label mb-1">Metoda</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        {authMethod === 'certificate' ? <ShieldCheck className="h-4 w-4 text-accent" /> : <Key className="h-4 w-4 text-muted-foreground" />}
                        {authMethod === 'certificate' ? 'Certyfikat' : 'Token'}
                    </div>
                </div>
            </div>

            {connectError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{connectError}
                </div>
            )}

            {!isKsefConnected ? (
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] transition hover:brightness-110 disabled:opacity-40"
                    onClick={onConnect} disabled={isConnecting}>
                    {isConnecting ? <><Loader2 className="h-4 w-4 animate-spin" />Łączenie...</> : <><Plug className="h-4 w-4" />Połącz z KSeF</>}
                </button>
            ) : (
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-secondary disabled:opacity-40"
                    onClick={onDisconnect} disabled={isConnecting}>
                    {isConnecting ? <><Loader2 className="h-4 w-4 animate-spin" />Odłączanie...</> : <><Unplug className="h-4 w-4" />Odłącz od KSeF</>}
                </button>
            )}
        </div>
    );
}
