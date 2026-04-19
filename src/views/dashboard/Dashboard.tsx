// src/views/dashboard/Dashboard.tsx
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { getInvoices, type InvoiceMetadata } from '../../services/ksefApi';
import { useAuth } from '../../hooks/useAuth';
import SideNav from '../../components/layout/SideNav';
import TopBar from '../../components/layout/TopBar';

export default function Dashboard() {
    const { isKsefConnected, needsCompanySetup, user, nip } = useAuth();
    const navigate = useNavigate();

    const { data: receivedData, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['receivedInvoices', nip],
        queryFn: async () => {
            const now = new Date();
            const from = new Date(now);
            from.setMonth(from.getMonth() - 1);

            const response = await getInvoices({
                subjectType: 'Subject2',
                dateRange: {
                    dateType: 'PermanentStorage',
                    from: from.toISOString(),
                    to: now.toISOString(),
                },
            });

            if (!response.success) {
                throw new Error(response.error || 'Błąd pobierania faktur');
            }

            return response.data?.invoices || [];
        },
        enabled: isKsefConnected,
        staleTime: 60_000,
    });

    const invoices: InvoiceMetadata[] = useMemo(() => receivedData || [], [receivedData]);

    const errorMessage = error
        ? (error as Error).message || 'Nie udało się pobrać faktur.'
        : null;

    const stats = useMemo(() => {
        const total = invoices.length;
        const totalGross = invoices.reduce((sum, inv) => sum + (inv.grossAmount || 0), 0);
        return { total, totalGross };
    }, [invoices]);

    const chartDays = Array.from({ length: 14 }).map((_, i) => ({
        day: i + 1,
        issued: Math.round(10 + 20 * Math.sin(i / 2) + (i % 3) * 3),
        received: Math.round(8 + 18 * Math.cos(i / 3) + (i % 4)),
    }));
    const balanceIssued = chartDays.reduce((sum, d) => sum + d.issued, 0);
    const balanceReceived = chartDays.reduce((sum, d) => sum + d.received, 0);

    const subtitleText = useMemo(() => {
        if (needsCompanySetup) {
            return 'Skonfiguruj firmę, aby rozpocząć pracę z KSeF';
        }
        if (!isKsefConnected) {
            return `Firma: ${user?.company?.companyName || '—'} • NIP: ${nip || '—'} • Niepołączony z KSeF`;
        }
        return `Firma: ${user?.company?.companyName || '—'} • NIP: ${nip || '—'} • Połączony z KSeF`;
    }, [needsCompanySetup, isKsefConnected, user, nip]);

    return (
        <div className="dash-root">
            <SideNav />
            <main className="dash-main">
                <TopBar />
                <div className="dash-content">
                    <header className="dash-header">
                        <h1>Pulpit Główny</h1>
                        <p className="subtitle">{subtitleText}</p>
                    </header>

                    {needsCompanySetup && (
                        <div className="alert-box warning">
                            <span className="alert-icon">⚙️</span>
                            <div className="alert-content">
                                <strong>Firma nie jest skonfigurowana</strong>
                                <p>
                                    Aby pobierać i wystawiać faktury w KSeF, skonfiguruj dane firmy (NIP + token autoryzacyjny).
                                    Użyj przycisku „Skonfiguruj firmę" w panelu bocznym.
                                </p>
                            </div>
                        </div>
                    )}

                    {!needsCompanySetup && !isKsefConnected && (
                        <div className="alert-box warning">
                            <span className="alert-icon">🔌</span>
                            <div className="alert-content">
                                <strong>Brak połączenia z KSeF</strong>
                                <p>
                                    Połącz się z Krajowym Systemem e-Faktur, aby pobierać i wystawiać faktury.
                                    Użyj przycisku „Połącz z KSeF" w panelu bocznym lub przejdź do{' '}
                                    <button onClick={() => navigate('/settings')} className="link-button">
                                        Ustawień
                                    </button>.
                                </p>
                            </div>
                        </div>
                    )}

                    <section className="kpi-grid" aria-label="Szybka analiza">
                        <div className="kpi-card">
                            <div className="kpi-title">Faktury odebrane (ostatni miesiąc)</div>
                            <div className="kpi-value accent">
                                {!isKsefConnected ? '—' : isLoading ? '...' : stats.total}
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-title">Suma brutto (odebrane)</div>
                            <div className="kpi-value">
                                {!isKsefConnected ? '—' : isLoading ? '...' : stats.totalGross.toLocaleString('pl-PL', {
                                    style: 'currency',
                                    currency: 'PLN'
                                })}
                            </div>
                        </div>
                        <div className="kpi-card wide">
                            <div className="kpi-title">Saldo KSeF (Wystawione vs. Odebrane)</div>
                            <div className="mini-chart" aria-hidden>
                                {chartDays.map((d, idx) => (
                                    <div className="bar-pair" key={idx}>
                                        <div className="bar issued" style={{ height: Math.min(100, d.issued) + '%' }} />
                                        <div className="bar received" style={{ height: Math.min(100, d.received) + '%' }} />
                                    </div>
                                ))}
                            </div>
                            <div className="chart-legend">
                                <span className="legend-item"><i className="dot issued" /> Wystawione: {balanceIssued}</span>
                                <span className="legend-item"><i className="dot received" /> Odebrane: {balanceReceived}</span>
                            </div>
                        </div>
                    </section>

                    <section className="ops-section">
                        <div className="section-header-centered">
                            <h2>Ostatnio Odebrane Dokumenty KSeF</h2>
                            <button
                                className="btn-fetch"
                                onClick={() => refetch()}
                                disabled={!isKsefConnected || isLoading || isFetching}
                                title={!isKsefConnected ? 'Połącz się z KSeF, aby pobierać faktury' : ''}
                            >
                                <span className="btn-icon" aria-hidden>⟳</span>
                                <span>{isLoading || isFetching ? 'Pobieranie...' : 'Pobierz z KSeF'}</span>
                            </button>
                        </div>

                        <div className="table-wrap">
                            {isLoading && <div className="loading-overlay">Ładowanie...</div>}
                            {errorMessage && <div className="error-message">{errorMessage}</div>}
                            {!isLoading && !errorMessage && (
                                <table className="data-table">
                                    <thead>
                                    <tr>
                                        <th>Numer KSeF</th>
                                        <th>Numer Faktury</th>
                                        <th>Sprzedawca</th>
                                        <th>NIP</th>
                                        <th>Kwota Brutto</th>
                                        <th>Data</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {invoices.length > 0 ? (
                                        invoices.slice(0, 10).map((row) => (
                                            <tr key={row.ksefNumber}>
                                                <td>{row.ksefNumber}</td>
                                                <td>{row.invoiceNumber || '-'}</td>
                                                <td>{row.seller?.name || '-'}</td>
                                                <td>{row.seller?.nip || '-'}</td>
                                                <td>
                                                    {row.grossAmount?.toLocaleString('pl-PL', {
                                                        style: 'currency',
                                                        currency: row.currency || 'PLN'
                                                    }) || '-'}
                                                </td>
                                                <td>{row.issueDate || '-'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center' }}>
                                                {!isKsefConnected
                                                    ? 'Połącz się z KSeF, aby pobrać faktury.'
                                                    : 'Brak faktur do wyświetlenia.'}
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>

                    <section className="future-section">
                        <h2>Szybkie Działania</h2>
                        <div className="future-grid">
                            <div className="future-card" onClick={() => navigate('/invoices/new')} style={{ cursor: 'pointer' }}>
                                <div className="future-icon">📄</div>
                                <div className="future-title">Wystaw fakturę</div>
                                <div className="future-badge">Dostępne</div>
                            </div>
                            <div className="future-card">
                                <div className="future-icon">✏️</div>
                                <div className="future-title">Wprowadź Korektę</div>
                                <div className="future-badge">Dostępne wkrótce</div>
                            </div>
                            <div className="future-card">
                                <div className="future-icon">📊</div>
                                <div className="future-title">Wygeneruj Raport</div>
                                <div className="future-badge">Dostępne wkrótce</div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}