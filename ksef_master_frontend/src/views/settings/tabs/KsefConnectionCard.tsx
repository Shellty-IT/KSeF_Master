// src/views/settings/tabs/KsefConnectionCard.tsx

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
        <div className="card">
            <h3>🔗 Status połączenia z KSeF</h3>
            <div className="ksef-meta-row">
                <div>
                    <span className="ksef-meta-label">Status</span>
                    <div className={`ksef-status-value ${isKsefConnected ? 'ksef-status-value--connected' : 'ksef-status-value--disconnected'}`}>
                        {isKsefConnected ? '🟢 Połączony' : '🔴 Niepołączony'}
                    </div>
                </div>
                <div>
                    <span className="ksef-meta-label">Metoda</span>
                    <div className="ksef-method-value">
                        {authMethod === 'certificate' ? '🔐 Certyfikat' : '🔑 Token'}
                    </div>
                </div>
            </div>

            {connectError && (
                <div className="ksef-connect-error">
                    ⚠️ {connectError}
                </div>
            )}

            <div className="ksef-connect-actions">
                {!isKsefConnected ? (
                    <button
                        className="btn-light btn-save"
                        onClick={onConnect}
                        disabled={isConnecting}
                    >
                        {isConnecting ? '⏳ Łączenie...' : '🔗 Połącz z KSeF'}
                    </button>
                ) : (
                    <button
                        className="btn-light btn-disconnect"
                        onClick={onDisconnect}
                        disabled={isConnecting}
                    >
                        {isConnecting ? '⏳ Odłączanie...' : '🔌 Odłącz od KSeF'}
                    </button>
                )}
            </div>
        </div>
    );
}
