// src/views/start/LoginView.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useServerHealth } from '../../hooks/useServerHealth';
import { SHELLTY_HOMEPAGE_URL } from '../../constants/urls';
import ServerStartup from '../../components/startup/ServerStartup';
import './LoginView.css';

export default function LoginView() {
    const navigate = useNavigate();
    const { loginApp, isAppAuthenticated, isLoading } = useAuth();
    const { status: serverStatus, retryCount, maxRetries } = useServerHealth(true);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const emailValid = email.includes('@') && email.includes('.');
    const passwordValid = password.length >= 8;

    useEffect(() => {
        if (isAppAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAppAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!emailValid) {
            setError('Wprowadź poprawny adres email');
            return;
        }
        if (!passwordValid) {
            setError('Hasło musi mieć co najmniej 8 znaków');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            const success = await loginApp(email, password);
            if (success) {
                navigate('/dashboard');
            } else {
                setError('Nieprawidłowy email lub hasło');
            }
        } catch {
            setError('Błąd połączenia z serwerem');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isAppAuthenticated) return null;

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
        <div className="auth-root">
            <main className="auth-wrap">
                <header className="auth-header">
                    <img
                        src="/ico.svg"
                        alt="KSeF Master"
                        className="auth-logo-img"
                    />
                    <h1 className="auth-title">KSeF Master</h1>
                    <p className="auth-subtitle">Zaloguj się do swojego konta</p>
                </header>

                <section className="auth-card">
                    {error && (
                        <div className="auth-error">
                            ⚠️ {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label className="auth-label" htmlFor="login-email">
                            Adres email
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            className="auth-input"
                            placeholder="jan@firma.pl"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            disabled={isSubmitting || isLoading}
                        />

                        <label className="auth-label" htmlFor="login-password">
                            Hasło
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            className="auth-input"
                            placeholder="Minimum 8 znaków"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            disabled={isSubmitting || isLoading}
                        />

                        <button
                            className="auth-btn-primary"
                            type="submit"
                            disabled={!emailValid || !passwordValid || isSubmitting || isLoading}
                        >
                            {isSubmitting || isLoading ? (
                                <>⏳ Logowanie...</>
                            ) : (
                                <>🔐 Zaloguj się</>
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>lub</span>
                    </div>

                    <div className="auth-alt">
                        <p>Nie masz jeszcze konta?</p>
                        <Link to="/register" className="auth-link">
                            Zarejestruj się →
                        </Link>
                    </div>
                </section>

                <footer className="auth-footer">
                    <span>
                        © 2026 KSeF Master - by{' '}
                        <a
                            href={SHELLTY_HOMEPAGE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-themed"
                        >
                            Shellty
                        </a>
                    </span>
                </footer>
            </main>
        </div>
    );
}