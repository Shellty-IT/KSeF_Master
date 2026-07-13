import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { useAuth } from './hooks/useAuth';
import StartView from './views/start/StartView';
import LoginView from './views/start/LoginView';
import RegisterView from './views/start/RegisterView';

const Dashboard = lazy(() => import('./views/dashboard/Dashboard'));
const ReceivedInvoices = lazy(() => import('./views/received/ReceivedInvoices'));
const IssuedInvoices = lazy(() => import('./views/issued/IssuedInvoices'));
const NewInvoice = lazy(() => import('./views/new/NewInvoice'));
const ImportedDrafts = lazy(() => import('./views/imported/ImportedDrafts'));
const ClientsView = lazy(() => import('./views/clients/ClientsView'));
const Reports = lazy(() => import('./views/reports/Reports'));
const Settings = lazy(() => import('./views/settings/Settings'));

function LoadingScreen() {
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

function InvoiceDetailsPlaceholder() {
    return (
        <div style={{ padding: 24, color: 'white', background: '#0e1116', minHeight: '100vh' }}>
            <h2>Podgląd faktury</h2>
            <p>Widok szczegółów faktury będzie dostępny wkrótce.</p>
        </div>
    );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAppAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isAppAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
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
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<LoadingScreen />}>
                <AppRoutes />
            </Suspense>
        </HashRouter>
    );
}
