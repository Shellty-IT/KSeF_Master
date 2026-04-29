import { useNavigate } from 'react-router-dom';

interface KsefStatusAlertsProps {
    needsCompanySetup: boolean;
    isKsefConnected: boolean;
}

export default function KsefStatusAlerts({ needsCompanySetup, isKsefConnected }: KsefStatusAlertsProps) {
    const navigate = useNavigate();

    if (needsCompanySetup) {
        return (
            <div className="alert-box warning">
                <span className="alert-icon">⚙️</span>
                <div className="alert-content">
                    <strong>Firma nie jest skonfigurowana</strong>
                    <p>
                        Aby pobierać faktury z KSeF, skonfiguruj dane firmy (NIP + token autoryzacyjny).
                        Użyj przycisku „Skonfiguruj firmę" w panelu bocznym.
                    </p>
                </div>
            </div>
        );
    }

    if (!isKsefConnected) {
        return (
            <div className="alert-box warning">
                <span className="alert-icon">🔌</span>
                <div className="alert-content">
                    <strong>Brak połączenia z KSeF</strong>
                    <p>
                        Połącz się z Krajowym Systemem e-Faktur, aby wyświetlić faktury.
                        Użyj przycisku „Połącz z KSeF" w panelu bocznym lub przejdź do{' '}
                        <button onClick={() => navigate('/settings')} className="link-button">
                            Ustawień
                        </button>.
                    </p>
                </div>
            </div>
        );
    }

    return null;
}