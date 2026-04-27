// FRONTEND: src/views/new/NewInvoice.tsx
import { useState } from 'react';
import './NewInvoice.css';
import '../dashboard/Dashboard.css';
import PrimaryButton from '../../components/buttons/PrimaryButton';
import SideNav from '../../components/layout/SideNav';
import TopBar from '../../components/layout/TopBar';
import useNewInvoice from './hooks/useNewInvoice';
import InvoiceDocumentCard from './components/InvoiceDocumentCard';
import InvoiceParties from './components/InvoiceParties';
import InvoiceLinesTable from './components/InvoiceLinesTable';
import InvoicePayment from './components/InvoicePayment';
import InvoicePrintView from './components/InvoicePrintView';
import { useAuth } from '../../hooks/useAuth';
import { closeSessionAndGetUpo } from '../../services/ksefApi';

export default function NewInvoice() {
    const { isKsefConnected } = useAuth();
    const [isClosingSession, setIsClosingSession] = useState(false);
    const [sessionCloseInfo, setSessionCloseInfo] = useState<string | null>(null);
    // Przycisk pojawia się dopiero po wysłaniu co najmniej jednej faktury
    const [invoiceSentInSession, setInvoiceSentInSession] = useState(false);

    const {
        draft,
        setDraft,
        errors,
        info,
        isSending,
        isAuthenticated,
        isImported,
        totals,
        updateBuyer,
        updateLine,
        addLine,
        removeLine,
        saveDraftToStorage,
        clearForm,
        handlePrint,
        handleSendToKsef,
    } = useNewInvoice();

    const handleSendAndTrack = async () => {
        await handleSendToKsef();
        // Po wywołaniu handleSendToKsef, hook ustawia `info` na komunikat z ✅ jeśli sukces.
        // Używamy małego opóźnienia żeby state zdążył się zaktualizować.
        setTimeout(() => {
            setInvoiceSentInSession(true);
        }, 300);
    };

    const handleCloseSessionAndUpo = async () => {
        setIsClosingSession(true);
        setSessionCloseInfo(null);
        try {
            const result = await closeSessionAndGetUpo();
            if (result.success) {
                if (result.data?.upoAvailable && result.data?.upoXml) {
                    // Pobieramy UPO jako plik XML
                    const blob = new Blob([result.data.upoXml], { type: 'text/xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `UPO_${result.data.sessionReferenceNumber ?? 'sesja'}.xml`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    setSessionCloseInfo('✅ Sesja zamknięta. UPO zbiorcze pobrane i zapisane.');
                } else {
                    setSessionCloseInfo(`✅ ${result.message ?? 'Sesja zamknięta.'}`);
                }
                setInvoiceSentInSession(false);
            } else {
                setSessionCloseInfo(`⚠️ ${result.error ?? 'Nie udało się zamknąć sesji.'}`);
            }
        } catch {
            setSessionCloseInfo('⚠️ Błąd połączenia podczas zamykania sesji.');
        } finally {
            setIsClosingSession(false);
        }
    };

    const showCloseButton = isKsefConnected && invoiceSentInSession;

    return (
        <div className="dash-root print-hide-nav">
            <SideNav />
            <main className="dash-main">
                <TopBar />
                <div className="dash-content">
                    <header className="dash-header no-print">
                        <h1>{isImported ? 'Faktura z importu SmartQuote' : 'Nowa Faktura'}</h1>
                        <p className="subtitle">
                            {isImported
                                ? 'Zweryfikuj dane i wyślij fakturę do KSeF'
                                : 'Wystaw fakturę sprzedaży i wyślij do KSeF'}
                        </p>
                    </header>

                    <section className="ops-section no-print">
                        <div className="ops-header">
                            <h2>Dane dokumentu</h2>
                            <div className="ops-actions">
                                <PrimaryButton onClick={saveDraftToStorage} icon="💾">
                                    Zapisz szkic
                                </PrimaryButton>
                                <button className="btn-light" onClick={clearForm}>
                                    Wyczyść
                                </button>
                                <PrimaryButton onClick={handlePrint} icon="🖨">
                                    Podgląd / Drukuj
                                </PrimaryButton>
                                <PrimaryButton
                                    onClick={handleSendAndTrack}
                                    icon="📤"
                                    disabled={isSending || !isAuthenticated}
                                    title={!isAuthenticated ? 'Zaloguj się do KSeF, aby wysłać fakturę' : undefined}
                                >
                                    {isSending ? 'Wysyłanie...' : 'Wyślij do KSeF'}
                                </PrimaryButton>
                                {showCloseButton && (
                                    <button
                                        className="btn-close-session"
                                        onClick={handleCloseSessionAndUpo}
                                        disabled={isClosingSession}
                                        title="Zamknij sesję interaktywną i pobierz zbiorcze UPO"
                                    >
                                        {isClosingSession ? '⏳ Zamykanie...' : '🔒 Zakończ sesję i pobierz UPO'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {!isAuthenticated && (
                            <div className="warning-banner">
                                ⚠️ Nie jesteś zalogowany do KSeF. Aby wysłać fakturę, najpierw się zaloguj.
                            </div>
                        )}

                        {isImported && (
                            <div className="info-banner">
                                📩 Dane zaimportowane ze SmartQuote. Zweryfikuj i uzupełnij brakujące pola przed wysyłką.
                            </div>
                        )}

                        {sessionCloseInfo && (
                            <div className={`info-banner ${sessionCloseInfo.startsWith('✅') ? 'success' : ''}`}>
                                {sessionCloseInfo}
                            </div>
                        )}

                        {info && (
                            <div className={`info-banner ${info.startsWith('✅') ? 'success' : ''}`}>
                                {info}
                            </div>
                        )}

                        {errors.length > 0 && (
                            <div className="error-message" style={{ marginBottom: 12 }}>
                                <strong>Popraw poniższe błędy:</strong>
                                <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                            </div>
                        )}

                        <InvoiceDocumentCard
                            draft={draft}
                            onChange={patch => setDraft(prev => ({ ...prev, ...patch }))}
                        />

                        <InvoiceParties
                            draft={draft}
                            onSellerChange={patch => setDraft(prev => ({
                                ...prev,
                                seller: { ...prev.seller, ...patch },
                            }))}
                            onBuyerChange={updateBuyer}
                        />

                        <InvoiceLinesTable
                            lines={draft.lines}
                            totals={totals}
                            onUpdateLine={updateLine}
                            onAddLine={addLine}
                            onRemoveLine={removeLine}
                        />

                        <InvoicePayment
                            payment={draft.payment}
                            onChange={patch => setDraft(prev => ({
                                ...prev,
                                payment: { ...prev.payment, ...patch },
                            }))}
                        />
                    </section>
                </div>

                <InvoicePrintView draft={draft} totals={totals} />
            </main>
        </div>
    );
}