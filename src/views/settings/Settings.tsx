// src/views/settings/Settings.tsx
import { useState } from 'react';
import './Settings.css';
import '../dashboard/Dashboard.css';
import SideNav from '../../components/layout/SideNav';
import TopBar from '../../components/layout/TopBar';
import TabKsefConnection from './tabs/TabKsefConnection';
import TabCompanyProfile from './tabs/TabCompanyProfile';
import TabFraudDetection from './tabs/TabFraudDetection';
import TabInvoiceDefaults from './tabs/TabInvoiceDefaults';
import TabPrintPdf from './tabs/TabPrintPdf';
import TabDangerZone from './tabs/TabDangerZone';

type SettingsTab =
    | 'ksef'
    | 'company'
    | 'fraud'
    | 'invoiceDefaults'
    | 'print'
    | 'danger';

interface TabConfig {
    id: SettingsTab;
    label: string;
    icon: string;
}

const TABS: TabConfig[] = [
    { id: 'ksef',           label: 'Połączenie KSeF',   icon: '🔗' },
    { id: 'company',        label: 'Dane firmy',         icon: '🏢' },
    { id: 'fraud',          label: 'Wykrywanie oszustw', icon: '🚨' },
    { id: 'invoiceDefaults',label: 'Domyślne faktury',   icon: '📄' },
    { id: 'print',          label: 'Druk / PDF',         icon: '🖨️' },
    { id: 'danger',         label: 'Strefa ryzyka',      icon: '⚠️' },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('ksef');

    return (
        <div className="dash-root">
            <SideNav />
            <main className="dash-main">
                <TopBar />
                <div className="dash-content">
                    <header className="dash-header">
                        <h1>Ustawienia</h1>
                        <p className="subtitle">Konfiguracja aplikacji, firmy i domyślnych parametrów faktur</p>
                    </header>

                    <div className="settings-tabs-nav">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="settings-tab-icon">{tab.icon}</span>
                                <span className="settings-tab-label">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="settings-tab-content">
                        {activeTab === 'ksef'            && <TabKsefConnection />}
                        {activeTab === 'company'         && <TabCompanyProfile />}
                        {activeTab === 'fraud'           && <TabFraudDetection />}
                        {activeTab === 'invoiceDefaults' && <TabInvoiceDefaults />}
                        {activeTab === 'print'           && <TabPrintPdf />}
                        {activeTab === 'danger'          && <TabDangerZone />}
                    </div>
                </div>
            </main>
        </div>
    );
}