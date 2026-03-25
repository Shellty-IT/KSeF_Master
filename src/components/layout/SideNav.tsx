// src/components/layout/SideNav.tsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './SideNav.css';

export default function SideNav() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    return (
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

                <NavLink className="btn-accent new-invoice" to="/invoices/new">
                    {isCollapsed ? '+' : '+ Wystaw e-Fakturę'}
                </NavLink>

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

                    {isAuthenticated ? (
                        <button className="nav-item logout-btn" onClick={handleLogout}>
                            <span className="icon" aria-hidden>🚪</span>
                            {!isCollapsed && <span className="nav-label">Wyloguj</span>}
                        </button>
                    ) : (
                        <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/">
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
    );
}