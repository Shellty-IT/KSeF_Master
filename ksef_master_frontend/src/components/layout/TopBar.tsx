import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, HelpCircle } from 'lucide-react';

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

export default function TopBar() {
    const { isAuthenticated, nip, logout, user, ksefEnvironment } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleLogin = () => {
        navigate('/');
    };

    const envLabel = ksefEnvironment === 'Production'
        ? 'Środowisko produkcyjne KSeF 2.0'
        : 'Środowisko testowe KSeF 2.0';

    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-8 shadow-[var(--shadow-topbar)]">
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <span className="font-mono">PL</span>
                <span>·</span>
                <span>{envLabel}</span>
            </div>
            <div className="flex items-center gap-2">
                <button className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition">
                    <HelpCircle className="h-4 w-4" />
                </button>
                <button className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition">
                    <Bell className="h-4 w-4" />
                </button>
                <div className="mx-2 h-6 w-px bg-border" />
                {isAuthenticated ? (
                    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-1.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                            {user?.name ? getInitials(user.name) : '?'}
                        </div>
                        <div className="leading-tight">
                            <div className="text-[12px] font-medium text-foreground">Zalogowano</div>
                            <div className="font-mono text-[10px] text-muted-foreground">{nip ?? ''}</div>
                        </div>
                        <button
                            className="ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive transition"
                            onClick={handleLogout}
                            title="Wyloguj"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <button
                        className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-secondary transition"
                        onClick={handleLogin}
                    >
                        Zaloguj się
                    </button>
                )}
            </div>
        </header>
    );
}
