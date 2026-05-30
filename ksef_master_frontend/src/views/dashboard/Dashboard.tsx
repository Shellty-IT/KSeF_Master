import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getInvoices, type InvoiceMetadata } from '../../services/ksefApi';
import { useAuth } from '../../hooks/useAuth';
import KsefStatusAlerts from '../../components/features/ksef/KsefStatusAlerts';
import SideNav from '../../components/layout/SideNav';
import TopBar from '../../components/layout/TopBar';
import {
    Inbox, TrendingUp, BarChart3, FilePlus2, PenLine,
    RefreshCw, Loader2,
} from 'lucide-react';

const CHART_DAYS = Array.from({ length: 14 }, (_, i) => ({
    day: i + 1,
    issued: Math.round(10 + 20 * Math.sin(i / 2) + (i % 3) * 3),
    received: Math.round(8 + 18 * Math.cos(i / 3) + (i % 4)),
}));

const BALANCE_ISSUED = CHART_DAYS.reduce((sum, d) => sum + d.issued, 0);
const BALANCE_RECEIVED = CHART_DAYS.reduce((sum, d) => sum + d.received, 0);
const CHART_MAX = Math.max(...CHART_DAYS.map((d) => Math.max(d.issued, d.received)));

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

    const stats = useMemo(() => ({
        total: invoices.length,
        totalGross: invoices.reduce((sum, inv) => sum + (inv.grossAmount || 0), 0),
    }), [invoices]);

    const subtitleText = useMemo(() => {
        if (needsCompanySetup) return 'Skonfiguruj firmę, aby rozpocząć pracę z KSeF';
        if (!isKsefConnected) return `Firma: ${user?.company?.companyName || '—'} • NIP: ${nip || '—'} • Niepołączony z KSeF`;
        return `Firma: ${user?.company?.companyName || '—'} • NIP: ${nip || '—'} • Połączony z KSeF`;
    }, [needsCompanySetup, isKsefConnected, user, nip]);

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <SideNav />
            <main className="flex flex-1 flex-col overflow-hidden">
                <TopBar />
                <div className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-7xl space-y-6 p-8">
                        {/* Header */}
                        <header>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Pulpit główny</h1>
                            <p className="mt-1 text-sm text-muted-foreground">{subtitleText}</p>
                        </header>

                        <KsefStatusAlerts
                            needsCompanySetup={needsCompanySetup}
                            isKsefConnected={isKsefConnected}
                        />

                        {/* KPI grid */}
                        <section aria-label="Szybka analiza" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {/* KPI: Faktury odebrane */}
                            <div className="ks-card p-5">
                                <div className="flex items-center justify-between">
                                    <p className="ks-label">Faktury odebrane (ostatni miesiąc)</p>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                                        <Inbox className="h-4 w-4 text-accent" />
                                    </div>
                                </div>
                                <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                                    {!isKsefConnected ? '—' : isLoading ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    ) : stats.total}
                                </p>
                            </div>

                            {/* KPI: Suma brutto */}
                            <div className="ks-card p-5">
                                <div className="flex items-center justify-between">
                                    <p className="ks-label">Suma brutto (odebrane)</p>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                                <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                                    {!isKsefConnected ? '—' : isLoading ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    ) : stats.totalGross.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                                </p>
                            </div>

                            {/* KPI: Mini chart */}
                            <div className="ks-card p-5 sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center justify-between">
                                    <p className="ks-label">Saldo KSeF (14 dni)</p>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="mt-3 flex h-12 items-end gap-0.5" aria-hidden>
                                    {CHART_DAYS.map((d) => (
                                        <div key={d.day} className="flex flex-1 items-end gap-px">
                                            <div
                                                className="flex-1 rounded-sm bg-accent/70"
                                                style={{ height: `${(d.issued / CHART_MAX) * 100}%` }}
                                            />
                                            <div
                                                className="flex-1 rounded-sm bg-primary/40"
                                                style={{ height: `${(d.received / CHART_MAX) * 100}%` }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-sm bg-accent/70" />
                                        Wystawione: {BALANCE_ISSUED}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-sm bg-primary/40" />
                                        Odebrane: {BALANCE_RECEIVED}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Recent invoices table */}
                        <section className="ks-card overflow-hidden">
                            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                                <h2 className="text-sm font-semibold text-foreground">Ostatnio odebrane dokumenty KSeF</h2>
                                <button
                                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                                    onClick={() => refetch()}
                                    disabled={!isKsefConnected || isLoading || isFetching}
                                    title={!isKsefConnected ? 'Połącz się z KSeF, aby pobierać faktury' : ''}
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                                    {isLoading || isFetching ? 'Pobieranie...' : 'Pobierz z KSeF'}
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                {isLoading && (
                                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Ładowanie...
                                    </div>
                                )}
                                {errorMessage && (
                                    <div className="px-6 py-4 text-sm text-destructive">{errorMessage}</div>
                                )}
                                {!isLoading && !errorMessage && (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/40">
                                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Numer KSeF</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Numer faktury</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sprzedawca</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">NIP</th>
                                                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Kwota brutto</th>
                                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {invoices.length > 0 ? (
                                                invoices.slice(0, 10).map((row) => (
                                                    <tr key={row.ksefNumber} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-6 py-3 font-mono text-[12px] text-muted-foreground">{row.ksefNumber}</td>
                                                        <td className="px-4 py-3">{row.invoiceNumber || '—'}</td>
                                                        <td className="px-4 py-3">{row.seller?.name || '—'}</td>
                                                        <td className="px-4 py-3 font-mono text-[12px]">{row.seller?.nip || '—'}</td>
                                                        <td className="px-4 py-3 text-right font-medium">
                                                            {row.grossAmount?.toLocaleString('pl-PL', {
                                                                style: 'currency',
                                                                currency: row.currency || 'PLN',
                                                            }) || '—'}
                                                        </td>
                                                        <td className="px-6 py-3 text-muted-foreground">{row.issueDate || '—'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
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

                        {/* Quick actions */}
                        <section>
                            <h2 className="mb-4 text-sm font-semibold text-foreground">Szybkie działania</h2>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <button
                                    className="ks-card flex items-center gap-3 p-4 text-left transition hover:shadow-[var(--shadow-elevated)] hover:-translate-y-px"
                                    onClick={() => navigate('/invoices/new')}
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                                        <FilePlus2 className="h-5 w-5 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Wystaw fakturę</p>
                                        <p className="text-[11px] text-accent font-semibold">Dostępne</p>
                                    </div>
                                </button>
                                <div className="ks-card flex items-center gap-3 p-4 opacity-50">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <PenLine className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Wprowadź korektę</p>
                                        <p className="text-[11px] text-muted-foreground">Dostępne wkrótce</p>
                                    </div>
                                </div>
                                <div className="ks-card flex items-center gap-3 p-4 opacity-50">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Wygeneruj raport</p>
                                        <p className="text-[11px] text-muted-foreground">Dostępne wkrótce</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
