import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { SHELLTY_HOMEPAGE_URL } from '../../constants/urls';
import {
    FilePlus2, LayoutDashboard, Inbox, Send, Download,
    Users, BarChart3, Settings, LogOut, ShieldCheck,
    ChevronLeft, ChevronRight, Key, AlertTriangle,
} from 'lucide-react';

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Pulpit główny', icon: LayoutDashboard },
    { to: '/invoices/received', label: 'Faktury odebrane', icon: Inbox },
    { to: '/invoices/issued', label: 'Faktury wystawione', icon: Send },
    { to: '/invoices/imported', label: 'Importowane', icon: Download },
    { to: '/clients', label: 'Klienci', icon: Users },
    { to: '/reports', label: 'Raporty', icon: BarChart3 },
];

export default function SideNav() {
    const {
        isAppAuthenticated,
        isKsefConnected,
        needsCompanySetup,
        ksefTokenExpired,
        authMethod,
        hasCertificate,
        user,
        logout,
    } = useAuth();

    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);

    function handleLogout() {
        logout();
        navigate('/login');
    }

    const ksefDotClass = isKsefConnected
        ? 'bg-accent'
        : ksefTokenExpired && authMethod === 'token'
            ? 'bg-warning'
            : 'bg-destructive';

    const ksefPingClass = isKsefConnected
        ? ''
        : ksefTokenExpired && authMethod === 'token'
            ? 'bg-warning/60'
            : 'bg-destructive/60';

    const ksefLabelColor = isKsefConnected
        ? 'text-accent'
        : ksefTokenExpired && authMethod === 'token'
            ? 'text-warning-foreground'
            : 'text-destructive/90';

    const ksefStatusLabel = isKsefConnected
        ? 'Połączony'
        : ksefTokenExpired && authMethod === 'token'
            ? 'Token wygasł'
            : 'Niepołączony';

    return (
        <aside
            className={`flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-200 ${isCollapsed ? 'w-16' : 'w-72'}`}
            aria-label="Nawigacja boczna"
        >
            {/* Brand */}
            <div className="px-4 pt-5 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-emerald-600 shadow-[var(--shadow-cta)] overflow-hidden">
                        <img src="/ico.svg" alt="KSeF Master" className="h-7 w-7 object-contain" />
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0">
                            <div className="text-[15px] font-semibold tracking-tight">KSeF Master</div>
                            <div className="text-[11px] text-sidebar-muted">e-Faktura PL</div>
                        </div>
                    )}
                </div>
                <button
                    className="shrink-0 rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition"
                    onClick={() => setIsCollapsed((p) => !p)}
                    aria-label={isCollapsed ? 'Rozwiń menu' : 'Zwiń menu'}
                >
                    {isCollapsed
                        ? <ChevronRight className="h-4 w-4" />
                        : <ChevronLeft className="h-4 w-4" />
                    }
                </button>
            </div>

            {/* Company context */}
            {isAppAuthenticated && !isCollapsed && (
                <div className="mx-4 mb-4 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">Firma</div>
                            <div className="text-sm font-medium text-sidebar-foreground truncate">
                                {user?.company?.companyName ?? '—'}
                            </div>
                            {user?.company && (
                                <div className="font-mono text-[11px] text-sidebar-muted">
                                    NIP {user.company.nip}
                                </div>
                            )}
                        </div>
                        <ShieldCheck className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    </div>

                    {/* KSeF connection status */}
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-black/20 px-3 py-2">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                {ksefPingClass && (
                                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${ksefPingClass}`} />
                                )}
                                <span className={`relative inline-flex h-2 w-2 rounded-full ${ksefDotClass}`} />
                            </span>
                            <span className="text-[12px] font-medium text-sidebar-foreground">KSeF</span>
                        </div>
                        <span className={`text-[11px] font-medium ${ksefLabelColor}`}>{ksefStatusLabel}</span>
                    </div>

                    {/* Auth method */}
                    {!needsCompanySetup && (
                        <div className="mt-2 flex items-center gap-1.5 px-1">
                            <Key className="h-3 w-3 text-sidebar-muted" />
                            <span className="text-[11px] text-sidebar-muted">
                                {authMethod === 'certificate'
                                    ? (hasCertificate ? 'Certyfikat' : 'Certyfikat (brak)')
                                    : 'Token'}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Primary CTA */}
            {isAppAuthenticated && !needsCompanySetup && (
                <div className={`${isCollapsed ? 'px-3' : 'px-4'} pb-4`}>
                    <NavLink
                        to="/invoices/new"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] transition hover:brightness-110 active:scale-[0.99]"
                        title={isCollapsed ? 'Wystaw e-Fakturę' : undefined}
                    >
                        <FilePlus2 className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        {!isCollapsed && 'Wystaw e-Fakturę'}
                    </NavLink>
                </div>
            )}

            {/* Setup company link */}
            {isAppAuthenticated && needsCompanySetup && !isCollapsed && (
                <div className="px-4 pb-4">
                    <NavLink
                        to="/settings"
                        className="flex w-full items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning-foreground transition hover:bg-warning/15"
                    >
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Skonfiguruj firmę
                    </NavLink>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3">
                {!isCollapsed && (
                    <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                        Nawigacja
                    </div>
                )}
                <ul className="space-y-0.5">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${isCollapsed ? 'justify-center' : ''} ${
                                            isActive
                                                ? 'bg-sidebar-accent text-white'
                                                : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-white'
                                        }`
                                    }
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {!isCollapsed && item.label}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            <div className="border-t border-sidebar-border px-3 py-3">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${isCollapsed ? 'justify-center' : ''} ${
                            isActive
                                ? 'bg-sidebar-accent text-white'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-white'
                        }`
                    }
                    title={isCollapsed ? 'Ustawienia' : undefined}
                >
                    <Settings className="h-4 w-4 shrink-0" />
                    {!isCollapsed && 'Ustawienia'}
                </NavLink>
                <button
                    className={`mt-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground transition hover:bg-sidebar-accent/70 hover:text-white ${isCollapsed ? 'justify-center' : ''}`}
                    onClick={handleLogout}
                    title={isCollapsed ? 'Wyloguj' : undefined}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!isCollapsed && 'Wyloguj'}
                </button>
                {!isCollapsed && (
                    <div className="mt-3 px-3 text-[11px] text-sidebar-muted">
                        © 2026 KSeF Master – by{' '}
                        <a
                            href={SHELLTY_HOMEPAGE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                        >
                            Shellty
                        </a>
                    </div>
                )}
            </div>
        </aside>
    );
}
