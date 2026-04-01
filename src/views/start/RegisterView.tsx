// src/views/start/RegisterView.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useServerHealth } from '../../hooks/useServerHealth';
import ServerStartup from '../../components/startup/ServerStartup';
import './LoginView.css';

export default function RegisterView() {
    const navigate = useNavigate();
    const { registerApp, isAppAuthenticated, isLoading } = useAuth();
    const { status: serverStatus, retryCount, maxRetries } = useServerHealth(true);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const nameValid = name.trim().length >= 2;
    const emailValid = email.includes('@') && email.includes('.');
    const passwordValid = password.length >= 8;
    const passwordsMatch = password === passwordConfirm;
    const formValid = nameValid && emailValid && passwordValid && passwordsMatch;

    useEffect(() => {
        if (isAppAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAppAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nameValid) {
            setError('Imię i nazwisko musi mieć co najmniej 2 znaki');
            return;
        }
        if (!emailValid) {
            setError('Wprowadź poprawny adres email');
            return;
        }
        if (!passwordValid) {
            setError('Hasło musi mieć co najmniej 8 znaków');
            return;
        }
        if (!passwordsMatch) {
            setError('Hasła nie są identyczne');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            const result = await registerApp(email, password, name.trim());
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.error || 'Błąd rejestracji');
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
                    <div className="auth-logo-dot" />
                    <h1 className="auth-title">KSeF Master</h1>
                    <p className="auth-subtitle">Utwórz nowe konto</p>
                </header>

                <section className="auth-card">
                    {error && (
                        <div className="auth-error">
                            ⚠️ {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label className="auth-label" htmlFor="reg-name">
                            Imię i nazwisko
                        </label>
                        <input
                            id="reg-name"
                            type="text"
                            className="auth-input"
                            placeholder="Jan Kowalski"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                            disabled={isSubmitting || isLoading}
                        />

                        <label className="auth-label" htmlFor="reg-email">
                            Adres email
                        </label>
                        <input
                            id="reg-email"
                            type="email"
                            className="auth-input"
                            placeholder="jan@firma.pl"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            disabled={isSubmitting || isLoading}
                        />

                        <label className="auth-label" htmlFor="reg-password">
                            Hasło
                        </label>
                        <input
                            id="reg-password"
                            type="password"
                            className="auth-input"
                            placeholder="Minimum 8 znaków"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            disabled={isSubmitting || isLoading}
                        />
                        {password.length > 0 && !passwordValid && (
                            <span className="auth-field-hint auth-field-hint--error">
                                Minimum 8 znaków ({password.length}/8)
                            </span>
                        )}

                        <label className="auth-label" htmlFor="reg-password-confirm">
                            Powtórz hasło
                        </label>
                        <input
                            id="reg-password-confirm"
                            type="password"
                            className="auth-input"
                            placeholder="Powtórz hasło"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            autoComplete="new-password"
                            disabled={isSubmitting || isLoading}
                        />
                        {passwordConfirm.length > 0 && !passwordsMatch && (
                            <span className="auth-field-hint auth-field-hint--error">
                                Hasła nie są identyczne
                            </span>
                        )}

                        <button
                            className="auth-btn-primary"
                            type="submit"
                            disabled={!formValid || isSubmitting || isLoading}
                        >
                            {isSubmitting || isLoading ? (
                                <>⏳ Tworzenie konta...</>
                            ) : (
                                <>✨ Utwórz konto</>
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>lub</span>
                    </div>

                    <div className="auth-alt">
                        <p>Masz już konto?</p>
                        <Link to="/login" className="auth-link">
                            Zaloguj się →
                        </Link>
                    </div>
                </section>

                <footer className="auth-footer">
                    <span>© 2025 KSeF Master — Środowisko testowe</span>
                </footer>
            </main>
        </div>
    );
}