import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useServerHealth } from '../../hooks/useServerHealth';
import ServerStartup from '../../components/features/startup/ServerStartup';

export default function StartView() {
    const navigate = useNavigate();
    const { isAppAuthenticated, isLoading } = useAuth();
    const { status: serverStatus, retryCount, maxRetries } = useServerHealth(true);

    useEffect(() => {
        if (isLoading) return;

        if (isAppAuthenticated) {
            navigate('/dashboard', { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    }, [isAppAuthenticated, isLoading, navigate]);

    if (serverStatus === 'checking' || serverStatus === 'offline' || serverStatus === 'error') {
        if (serverStatus !== 'checking' || retryCount > 0) {
            return (
                <ServerStartup
                    status={serverStatus === 'checking' ? 'checking' : serverStatus}
                    retryCount={retryCount}
                    maxRetries={maxRetries}
                />
            );
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
            <div className="flex items-center gap-3 text-sm">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                Ładowanie...
            </div>
        </div>
    );
}
