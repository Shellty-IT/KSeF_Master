// src/views/start/StartView.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useServerHealth } from '../../hooks/useServerHealth';
import ServerStartup from '../../components/startup/ServerStartup';
import './StartView.css';

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
        <div className="start-root" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--bg, #0e1116)',
            color: 'var(--muted, #a4a9b6)',
            fontSize: '16px',
        }}>
            ⏳ Ładowanie...
        </div>
    );
}