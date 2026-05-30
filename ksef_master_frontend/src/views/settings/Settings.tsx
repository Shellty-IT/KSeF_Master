import { useState } from 'react';
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
    { id: 'ksef' as SettingsTab,            label: 'Połączenie KSeF',   Icon: Link2 },
    { id: 'company' as SettingsTab,         label: 'Dane firmy',         Icon: Building2 },
    { id: 'fraud' as SettingsTab,           label: 'Wykrywanie oszustw', Icon: ShieldAlert },
    { id: 'invoiceDefaults' as SettingsTab, label: 'Domyślne faktury',   Icon: FileText },
    { id: 'print' as SettingsTab,           label: 'Druk / PDF',         Icon: Printer },
    { id: 'danger' as SettingsTab,          label: 'Strefa ryzyka',      Icon: AlertTriangle },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('ksef');

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <SideNav />
            <main className="flex flex-1 flex-col overflow-hidden">
                <TopBar />
                <div className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-3xl space-y-6 p-8">
                        <header>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Ustawienia</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Konfiguracja aplikacji, firmy i domyślnych parametrów faktur</p>
                        </header>

                        {/* Tab navigation */}
                        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1">
                            {TABS.map(({ id, label, Icon }) => (
                                <button
                                    key={id}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                                        activeTab === id
                                            ? 'bg-card text-foreground shadow-[var(--shadow-card)]'
                                            : 'text-muted-foreground hover:text-foreground'
                                    } ${id === 'danger' ? 'ml-auto text-destructive/70 hover:text-destructive' : ''}`}
                                    onClick={() => setActiveTab(id)}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div>
                            {activeTab === 'ksef'            && <TabKsefConnection />}
                            {activeTab === 'company'         && <TabCompanyProfile />}
                            {activeTab === 'fraud'           && <TabFraudDetection />}
                            {activeTab === 'invoiceDefaults' && <TabInvoiceDefaults />}
                            {activeTab === 'print'           && <TabPrintPdf />}
                            {activeTab === 'danger'          && <TabDangerZone />}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
