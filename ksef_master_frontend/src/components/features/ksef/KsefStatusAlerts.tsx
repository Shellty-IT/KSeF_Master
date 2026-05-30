import { useNavigate } from 'react-router-dom';
import { Settings, Plug, AlertTriangle } from 'lucide-react';

interface KsefStatusAlertsProps {
    needsCompanySetup: boolean;
    isKsefConnected: boolean;
}

export default function KsefStatusAlerts({ needsCompanySetup, isKsefConnected }: KsefStatusAlertsProps) {
    const navigate = useNavigate();

    if (needsCompanySetup) {
        return (
            <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3.5 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                    <strong className="font-semibold text-warning-foreground">Firma nie jest skonfigurowana</strong>
                    <p className="mt-0.5 text-muted-foreground">
                        Aby pobierać faktury z KSeF, skonfiguruj dane firmy (NIP + token autoryzacyjny).{' '}
                        <button
                            onClick={() => navigate('/settings')}
                            className="font-medium text-accent hover:underline"
                        >
                            Przejdź do ustawień
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    if (!isKsefConnected) {
        return (
            <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3.5 text-sm">
                <Plug className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                    <strong className="font-semibold text-warning-foreground">Brak połączenia z KSeF</strong>
                    <p className="mt-0.5 text-muted-foreground">
                        Połącz się z Krajowym Systemem e-Faktur, aby wyświetlić faktury.{' '}
                        <button
                            onClick={() => navigate('/settings')}
                            className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                        >
                            <Settings className="h-3 w-3" />
                            Ustawienia
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    return null;
}
