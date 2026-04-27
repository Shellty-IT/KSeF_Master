// src/components/layout/SideNav.tsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './SideNav.css';

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

    function getAuthMethodLabel() {
        if (authMethod === 'certificate') {
            return hasCertificate ? '🔐 Certyfikat' : '🔐 Certyfikat (brak)';
        }
        return '🔑 Token';
    }

    function getKsefStatusLabel() {
        if (isKsefConnected) return '🟢 KSeF połączony';
        if (ksefTokenExpired && authMethod === 'token') return '🟡 Token wygasł';
        return '🔴 KSeF niepołączony';
    }

    function getKsefStatusClass() {
        if (isKsefConnected) return 'connected';
        if (ksefTokenExpired && authMethod === 'token') return 'expired';
        return 'disconnected';
    }

    return (
        <aside
            className={`side-nav ${isCollapsed ? 'collapsed' : ''}`}
            aria-label="Nawigacja boczna"
        >
            <button
                className="collapse-btn"
                onClick={() => setIsCollapsed((prev) => !prev)}
                aria-label={isCollapsed ? 'Rozwiń menu' : 'Zwiń menu'}
                title={isCollapsed ? 'Rozwiń menu' : 'Zwiń menu'}
            >
                <span className="collapse-icon">{isCollapsed ? '»' : '«'}</span>
            </button>

            <div className="side-nav-content">
                <div className="brand">
                    <div className="logo-dot" aria-hidden="true" />
                    {!isCollapsed && (
                        <span className="brand-name">
                            KSeF Master
                            <img
                                src="/ico.svg"
                                alt="Ikona KSeF Master"
                                className="brand-icon"
                            />
                        </span>
                    )}
                </div>

                {!isCollapsed && isAppAuthenticated && (
                    <div className="side-nav-user-info">
                        {user && (
                            <div className="user-name-badge">
                                👤 {user.name}
                            </div>
                        )}
                        {user?.company && (
                            <div className="company-name-badge">
                                🏢 {user.company.companyName}
                            </div>
                        )}
                        <div className={`ksef-status-badge ${getKsefStatusClass()}`}>
                            {getKsefStatusLabel()}
                        </div>
                        {!needsCompanySetup && (
                            <div className="ksef-auth-method-badge">
                                {getAuthMethodLabel()}
                            </div>
                        )}
                        {needsCompanySetup && (
                            <NavLink
                                to="/settings"
                                className="ksef-setup-link"
                            >
                                ⚙️ Skonfiguruj firmę
                            </NavLink>
                        )}
                    </div>
                )}

                {isAppAuthenticated && !needsCompanySetup && (
                    <NavLink className="btn-accent new-invoice" to="/invoices/new">
                        {isCollapsed ? '+' : '+ Wystaw e-Fakturę'}
                    </NavLink>
                )}

                <nav className="nav-list">
                    <NavLink
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        to="/dashboard"
                    >
                        <span className="icon" aria-hidden>🏠</span>
                        {!isCollapsed && <span className="nav-label">Pulpit Główny</span>}
                    </NavLink>
                    <NavLink
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        to="/invoices/received"
                    >
                        <span className="icon" aria-hidden>📥</span>
                        {!isCollapsed && <span className="nav-label">Faktury odebrane</span>}
                    </NavLink>
                    <NavLink
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        to="/invoices/issued"
                    >
                        <span className="icon" aria-hidden>📤</span>
                        {!isCollapsed && <span className="nav-label">Faktury wystawione</span>}
                    </NavLink>
                    <NavLink
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        to="/invoices/imported"
                    >
                        <span className="icon" aria-hidden>📩</span>
                        {!isCollapsed && <span className="nav-label">Importowane</span>}
                    </NavLink>
                    <NavLink
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        to="/clients"
                    >
                        <span className="icon" aria-hidden>👥</span>
                        {!isCollapsed && <span className="nav-label">Klienci</span>}
                    </NavLink>
                    <NavLink
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        to="/reports"
                    >
                        <span className="icon" aria-hidden>📊</span>
                        {!isCollapsed && <span className="nav-label">Raporty</span>}
                    </NavLink>
                    <NavLink
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        to="/settings"
                    >
                        <span className="icon" aria-hidden>⚙️</span>
                        {!isCollapsed && <span className="nav-label">Ustawienia</span>}
                    </NavLink>

                    {isAppAuthenticated ? (
                        <button className="nav-item logout-btn" onClick={handleLogout}>
                            <span className="icon" aria-hidden>🚪</span>
                            {!isCollapsed && <span className="nav-label">Wyloguj</span>}
                        </button>
                    ) : (
                        <NavLink
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            to="/login"
                        >
                            <span className="icon" aria-hidden>🔐</span>
                            {!isCollapsed && <span className="nav-label">Zaloguj się</span>}
                        </NavLink>
                    )}
                </nav>
            </div>

            {!isCollapsed && (
                <footer className="side-nav-footer">
                    <span className="footer-copyright">
                        © 2026 KSeF Master
                        <img
                            src="/ico.svg"
                            alt=""
                            className="footer-icon"
                            aria-hidden="true"
                        />
                    </span>
                </footer>
            )}
        </aside>
    );
}