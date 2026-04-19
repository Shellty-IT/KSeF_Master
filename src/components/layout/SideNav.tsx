// src/components/layout/SideNav.tsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import KsefSetupModal from '../modal/KsefSetupModal';
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
        connectKsef,
    } = useAuth();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState<string | null>(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    const handleConnectKsef = async () => {
        setIsConnecting(true);
        setConnectError(null);

        const result = await connectKsef();

        setIsConnecting(false);

        if (!result.success) {
            if (result.tokenExpired) {
                setShowTokenModal(true);
            } else {
                setConnectError(result.error || 'Błąd połączenia');
                setTimeout(() => setConnectError(null), 5000);
            }
        }
    };

    const handleSetupSuccess = () => {
        setShowSetupModal(false);
        setShowTokenModal(false);
    };

    const getAuthMethodBadge = () => {
        if (authMethod === 'certificate') {
            return hasCertificate ? '🔐 Certyfikat' : '🔐 Certyfikat (brak)';
        }
        return '🔑 Token';
    };

    return (
        <>
            <aside className={`side-nav ${isCollapsed ? 'collapsed' : ''}`} aria-label="Nawigacja boczna">
                <button
                    className="collapse-btn"
                    onClick={toggleCollapse}
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
                                <a className="brand-icon-link" aria-label="Ikona KSeF Master">
                                    <img
                                        src="https://raw.githubusercontent.com/shellty-IT/KSeF-Master/main/public/ico.svg"
                                        alt="Ikona"
                                        className="brand-icon"
                                    />
                                </a>
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
                            <div className={`ksef-status-badge ${isKsefConnected ? 'connected' : 'disconnected'}`}>
                                {isKsefConnected ? '🟢 KSeF połączony' : '🔴 KSeF niepołączony'}
                            </div>
                            {!needsCompanySetup && (
                                <div className="ksef-auth-method-badge">
                                    {getAuthMethodBadge()}
                                </div>
                            )}
                        </div>
                    )}

                    {isAppAuthenticated && needsCompanySetup && !isCollapsed && (
                        <button
                            className="btn-accent setup-prompt-btn"
                            onClick={() => setShowSetupModal(true)}
                        >
                            🏢 Skonfiguruj firmę
                        </button>
                    )}

                    {isAppAuthenticated && !needsCompanySetup && !isKsefConnected && !isCollapsed && (
                        <div className="ksef-connect-section">
                            <button
                                className="btn-accent ksef-connect-btn"
                                onClick={handleConnectKsef}
                                disabled={isConnecting}
                            >
                                {isConnecting ? '⏳ Łączenie...' : '🔗 Połącz z KSeF'}
                            </button>
                            {connectError && (
                                <div className="ksef-connect-error">{connectError}</div>
                            )}
                            {ksefTokenExpired && authMethod === 'token' && (
                                <button
                                    className="ksef-token-update-link"
                                    onClick={() => setShowTokenModal(true)}
                                >
                                    🔑 Token wygasł — zaktualizuj
                                </button>
                            )}
                        </div>
                    )}

                    {isAppAuthenticated && !needsCompanySetup && (
                        <NavLink className="btn-accent new-invoice" to="/invoices/new">
                            {isCollapsed ? '+' : '+ Wystaw e-Fakturę'}
                        </NavLink>
                    )}

                    <nav className="nav-list">
                        <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/dashboard">
                            <span className="icon" aria-hidden>🏠</span>
                            {!isCollapsed && <span className="nav-label">Pulpit Główny</span>}
                        </NavLink>
                        <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/invoices/received">
                            <span className="icon" aria-hidden>📥</span>
                            {!isCollapsed && <span className="nav-label">Faktury odebrane</span>}
                        </NavLink>
                        <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/invoices/issued">
                            <span className="icon" aria-hidden>📤</span>
                            {!isCollapsed && <span className="nav-label">Faktury wystawione</span>}
                        </NavLink>
                        <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/invoices/imported">
                            <span className="icon" aria-hidden>📩</span>
                            {!isCollapsed && <span className="nav-label">Importowane</span>}
                        </NavLink>
                        <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/clients">
                            <span className="icon" aria-hidden>👥</span>
                            {!isCollapsed && <span className="nav-label">Klienci</span>}
                        </NavLink>
                        <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/reports">
                            <span className="icon" aria-hidden>📊</span>
                            {!isCollapsed && <span className="nav-label">Raporty</span>}
                        </NavLink>
                        <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/settings">
                            <span className="icon" aria-hidden>⚙️</span>
                            {!isCollapsed && <span className="nav-label">Ustawienia</span>}
                        </NavLink>

                        {isAppAuthenticated ? (
                            <button className="nav-item logout-btn" onClick={handleLogout}>
                                <span className="icon" aria-hidden>🚪</span>
                                {!isCollapsed && <span className="nav-label">Wyloguj</span>}
                            </button>
                        ) : (
                            <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/login">
                                <span className="icon" aria-hidden>🔐</span>
                                {!isCollapsed && <span className="nav-label">Zaloguj się</span>}
                            </NavLink>
                        )}
                    </nav>
                </div>

                {!isCollapsed && (
                    <footer className="side-nav-footer">
                        <a
                            href="https://shellty-it.github.io/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-logo-link"
                            aria-label="Strona wykonana przez Shellty IT"
                        >
                            <img
                                src="https://shellty-it.github.io/favicon-32x32.png"
                                alt="Shellty"
                                className="footer-logo"
                            />
                        </a>
                        <span className="footer-copyright">
                            © 2025 KSeF Master
                            <span className="footer-icon-wrapper" aria-hidden="true">
                                <img
                                    src="https://raw.githubusercontent.com/shellty-IT/KSeF-Master/main/public/ico.svg"
                                    alt=""
                                    className="footer-icon"
                                />
                            </span>
                        </span>
                    </footer>
                )}
            </aside>

            {showSetupModal && (
                <KsefSetupModal
                    mode="setup"
                    onClose={() => setShowSetupModal(false)}
                    onSuccess={handleSetupSuccess}
                />
            )}

            {showTokenModal && (
                <KsefSetupModal
                    mode="update-token"
                    onClose={() => setShowTokenModal(false)}
                    onSuccess={handleSetupSuccess}
                />
            )}
        </>
    );
}