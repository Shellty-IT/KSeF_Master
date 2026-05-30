import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useServerHealth } from '../../hooks/useServerHealth';
import { SHELLTY_HOMEPAGE_URL } from '../../constants/urls';
import ServerStartup from '../../components/features/startup/ServerStartup';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';

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

    const busy = isSubmitting || isLoading;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
            <main className="w-full max-w-sm space-y-8">
                {/* Brand */}
                <header className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-emerald-600 shadow-[var(--shadow-cta)]">
                        <FileText className="h-6 w-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">KSeF Master</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Zaloguj się do swojego konta</p>
                    </div>
                </header>

                {/* Card */}
                <section className="ks-card space-y-5 p-6">
                    {error && (
                        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                        <div className="space-y-1.5">
                            <label className="ks-label" htmlFor="login-email">Adres email</label>
                            <input
                                id="login-email"
                                type="email"
                                className="ks-input"
                                placeholder="jan@firma.pl"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                disabled={busy}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="ks-label" htmlFor="login-password">Hasło</label>
                            <input
                                id="login-password"
                                type="password"
                                className="ks-input"
                                placeholder="Minimum 8 znaków"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                disabled={busy}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!emailValid || !passwordValid || busy}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {busy
                                ? <><Loader2 className="h-4 w-4 animate-spin" /> Logowanie...</>
                                : 'Zaloguj się'
                            }
                        </button>
                    </form>

                    <div className="relative flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[11px] text-muted-foreground">lub</span>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                        Nie masz jeszcze konta?{' '}
                        <Link to="/register" className="font-medium text-accent hover:underline">
                            Zarejestruj się
                        </Link>
                    </div>
                </section>

                <footer className="text-center text-[12px] text-muted-foreground">
                    © 2026 KSeF Master — by{' '}
                    <a
                        href={SHELLTY_HOMEPAGE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                    >
                        Shellty
                    </a>
                </footer>
            </main>
        </div>
    );
}
