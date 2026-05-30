import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useServerHealth } from '../../hooks/useServerHealth';
import ServerStartup from '../../components/features/startup/ServerStartup';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';

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
                        <p className="mt-1 text-sm text-muted-foreground">Utwórz nowe konto</p>
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
                            <label className="ks-label" htmlFor="reg-name">Imię i nazwisko</label>
                            <input
                                id="reg-name"
                                type="text"
                                className="ks-input"
                                placeholder="Jan Kowalski"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                disabled={busy}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="ks-label" htmlFor="reg-email">Adres email</label>
                            <input
                                id="reg-email"
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
                            <label className="ks-label" htmlFor="reg-password">Hasło</label>
                            <input
                                id="reg-password"
                                type="password"
                                className="ks-input"
                                placeholder="Minimum 8 znaków"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                disabled={busy}
                            />
                            {password.length > 0 && !passwordValid && (
                                <p className="text-[12px] text-destructive">
                                    Minimum 8 znaków ({password.length}/8)
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="ks-label" htmlFor="reg-password-confirm">Powtórz hasło</label>
                            <input
                                id="reg-password-confirm"
                                type="password"
                                className="ks-input"
                                placeholder="Powtórz hasło"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                autoComplete="new-password"
                                disabled={busy}
                            />
                            {passwordConfirm.length > 0 && !passwordsMatch && (
                                <p className="text-[12px] text-destructive">Hasła nie są identyczne</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!formValid || busy}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {busy
                                ? <><Loader2 className="h-4 w-4 animate-spin" /> Tworzenie konta...</>
                                : 'Utwórz konto'
                            }
                        </button>
                    </form>

                    <div className="relative flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[11px] text-muted-foreground">lub</span>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                        Masz już konto?{' '}
                        <Link to="/login" className="font-medium text-accent hover:underline">
                            Zaloguj się
                        </Link>
                    </div>
                </section>

                <footer className="text-center text-[12px] text-muted-foreground">
                    © 2026 KSeF Master — Środowisko testowe
                </footer>
            </main>
        </div>
    );
}
