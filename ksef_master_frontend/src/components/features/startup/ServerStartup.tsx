import { FileText } from 'lucide-react';

interface ServerStartupProps {
    retryCount: number;
    maxRetries: number;
    status: 'checking' | 'offline' | 'error';
}

export default function ServerStartup({ retryCount, maxRetries, status }: ServerStartupProps) {
    const isOffline = status === 'offline' || status === 'error';
    const progress = maxRetries > 0 ? (retryCount / maxRetries) * 100 : 0;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
            <div className="flex w-full max-w-sm flex-col items-center gap-6 px-4 text-center">
                {/* Brand mark */}
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-emerald-600 shadow-[var(--shadow-cta)]">
                    <FileText className="h-7 w-7 text-white" strokeWidth={2.5} />
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        {isOffline ? 'Nie można połączyć z serwerem' : 'Uruchamianie serwera...'}
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        {isOffline
                            ? 'Serwer nie odpowiada. Sprawdź połączenie internetowe lub spróbuj później.'
                            : 'Serwer jest uruchamiany. To może potrwać kilka sekund.'}
                    </p>
                </div>

                {!isOffline && (
                    <div className="w-full space-y-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                            <div
                                className="h-full rounded-full bg-accent transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-[12px] text-muted-foreground">
                            Próba {retryCount} z {maxRetries}
                        </p>
                    </div>
                )}

                {isOffline && (
                    <button
                        className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] transition hover:brightness-110"
                        onClick={() => window.location.reload()}
                    >
                        Spróbuj ponownie
                    </button>
                )}
            </div>
        </div>
    );
}
