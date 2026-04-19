// src/App.tsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import StartView from './views/start/StartView';
import LoginView from './views/start/LoginView';
import RegisterView from './views/start/RegisterView';
import Dashboard from './views/dashboard/Dashboard';
import ReceivedInvoices from './views/received/ReceivedInvoices';
import IssuedInvoices from './views/issued/IssuedInvoices';
import NewInvoice from './views/new/NewInvoice';
import ImportedDrafts from './views/imported/ImportedDrafts';
import ClientsView from './views/clients/ClientsView';
import Reports from './views/reports/Reports';
import Settings from './views/settings/Settings';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAppAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#0e1116',
                color: '#a4a9b6',
                fontSize: '16px',
            }}>
                ⏳ Ładowanie...
            </div>
        );
    }

    if (!isAppAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

function InvoiceDetailsPlaceholder() {
    return (
        <div style={{ padding: 24, color: 'white', background: '#0e1116', minHeight: '100vh' }}>
            <h2>Podgląd faktury</h2>
            <p>Widok szczegółów faktury będzie dostępny wkrótce.</p>
        </div>
    );
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<StartView />} />
            <Route path="/login" element={<LoginView />} />
            <Route path="/register" element={<RegisterView />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/invoices/received" element={<ProtectedRoute><ReceivedInvoices /></ProtectedRoute>} />
            <Route path="/invoices/issued" element={<ProtectedRoute><IssuedInvoices /></ProtectedRoute>} />
            <Route path="/invoices/new" element={<ProtectedRoute><NewInvoice /></ProtectedRoute>} />
            <Route path="/invoices/imported" element={<ProtectedRoute><ImportedDrafts /></ProtectedRoute>} />
            <Route path="/invoices/:ksefId" element={<ProtectedRoute><InvoiceDetailsPlaceholder /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><ClientsView /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AppRoutes />
            </HashRouter>
        </AuthProvider>
    );
}