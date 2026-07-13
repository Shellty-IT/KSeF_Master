import { useSearchParams } from 'react-router-dom';
import SideNav from '../../components/layout/SideNav';
import TopBar from '../../components/layout/TopBar';
import TabKsefConnection from './tabs/TabKsefConnection';
import TabCompanyProfile from './tabs/TabCompanyProfile';
import TabFraudDetection from './tabs/TabFraudDetection';
import TabInvoiceDefaults from './tabs/TabInvoiceDefaults';
import TabPrintPdf from './tabs/TabPrintPdf';
import TabDangerZone from './tabs/TabDangerZone';
import { Link2, Building2, ShieldAlert, FileText, Printer, AlertTriangle } from 'lucide-react';

type SettingsTab = 'ksef' | 'company' | 'fraud' | 'invoiceDefaults' | 'print' | 'danger';

const TABS = [
    { id: 'ksef' as SettingsTab, label: 'Połączenie KSeF', description: 'Środowisko, sesja i metoda uwierzytelniania', group: 'Integracja', Icon: Link2 },
    { id: 'company' as SettingsTab, label: 'Dane firmy', description: 'Profil sprzedawcy i dane organizacji', group: 'Organizacja', Icon: Building2 },
    { id: 'invoiceDefaults' as SettingsTab, label: 'Domyślne faktury', description: 'Numeracja, płatności i wartości początkowe', group: 'Fakturowanie', Icon: FileText },
    { id: 'print' as SettingsTab, label: 'Druk i PDF', description: 'Wygląd i parametry generowanych dokumentów', group: 'Fakturowanie', Icon: Printer },
    { id: 'fraud' as SettingsTab, label: 'Sygnały ryzyka', description: 'Reguły analizy odebranych faktur', group: 'Bezpieczeństwo', Icon: ShieldAlert },
    { id: 'danger' as SettingsTab, label: 'Dane lokalne', description: 'Kopia zapasowa i operacje nieodwracalne', group: 'Bezpieczeństwo', Icon: AlertTriangle },
];

const SETTINGS_GROUPS = ['Integracja', 'Organizacja', 'Fakturowanie', 'Bezpieczeństwo'] as const;

function isSettingsTab(value: string | null): value is SettingsTab {
    return TABS.some(tab => tab.id === value);
}

export default function Settings() {
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedSection = searchParams.get('section');
    const activeTab: SettingsTab = isSettingsTab(requestedSection) ? requestedSection : 'ksef';
    const activeDefinition = TABS.find(tab => tab.id === activeTab)!;
    const ActiveSectionIcon = activeDefinition.Icon;

    function selectTab(tab: SettingsTab) {
        setSearchParams(tab === 'ksef' ? {} : { section: tab }, { replace: true });
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <SideNav />
            <main className="flex flex-1 flex-col overflow-hidden">
                <TopBar />
                <div className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
                        <header>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Ustawienia</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Konfiguracja integracji, organizacji, faktur i bezpieczeństwa danych</p>
                        </header>

                        <div className="lg:hidden">
                            <label className="ks-label" htmlFor="settings-section">Sekcja ustawień</label>
                            <select
                                id="settings-section"
                                className="ks-input mt-1.5"
                                value={activeTab}
                                onChange={(event) => selectTab(event.target.value as SettingsTab)}
                            >
                                {TABS.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
                            </select>
                        </div>

                        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                            <nav className="ks-card sticky top-4 hidden overflow-hidden p-2 lg:block" aria-label="Sekcje ustawień">
                                {SETTINGS_GROUPS.map(group => (
                                    <div key={group} className="mb-2 last:mb-0">
                                        <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{group}</p>
                                        <div className="space-y-0.5">
                                            {TABS.filter(tab => tab.group === group).map(({ id, label, Icon }) => (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    aria-current={activeTab === id ? 'page' : undefined}
                                                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition ${
                                                        activeTab === id
                                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                                            : id === 'danger'
                                                                ? 'text-destructive hover:bg-destructive/5'
                                                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                                    }`}
                                                    onClick={() => selectTab(id)}
                                                >
                                                    <Icon className="h-4 w-4 shrink-0" />
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </nav>

                            <section aria-labelledby="settings-section-title" className="min-w-0 space-y-4">
                                <div className="border-b border-border pb-4">
                                    <div className="flex items-center gap-2">
                                        <ActiveSectionIcon className="h-5 w-5 text-accent" />
                                        <h2 id="settings-section-title" className="text-lg font-semibold text-foreground">{activeDefinition.label}</h2>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">{activeDefinition.description}</p>
                                </div>

                                {activeTab === 'ksef'            && <TabKsefConnection />}
                                {activeTab === 'company'         && <TabCompanyProfile />}
                                {activeTab === 'fraud'           && <TabFraudDetection />}
                                {activeTab === 'invoiceDefaults' && <TabInvoiceDefaults />}
                                {activeTab === 'print'           && <TabPrintPdf />}
                                {activeTab === 'danger'          && <TabDangerZone />}
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
