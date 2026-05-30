import './NewInvoice.css'; // keep for print styles only
import PrimaryButton from '../../components/ui/PrimaryButton';
import SideNav from '../../components/layout/SideNav';
import TopBar from '../../components/layout/TopBar';
import useNewInvoice from './hooks/useNewInvoice';
import InvoiceDocumentCard from './components/InvoiceDocumentCard';
import InvoiceParties from './components/InvoiceParties';
import InvoiceLinesTable from './components/InvoiceLinesTable';
import InvoicePayment from './components/InvoicePayment';
import InvoicePrintView from './components/InvoicePrintView';
import { useAuth } from '../../hooks/useAuth';
import { useCloseSession } from '../../hooks/useCloseSession';
import { Save, Printer, Send, Lock, AlertTriangle, AlertCircle, Info, Inbox } from 'lucide-react';

export default function NewInvoice() {
    const { isKsefConnected } = useAuth();
    const { isClosing, closeInfo, closeSession } = useCloseSession();

    const {
        draft, setDraft, errors, info, isSending, isAuthenticated,
        isImported, invoiceSent, totals,
        updateBuyer, updateLine, addLine, removeLine,
        saveDraftToStorage, clearForm, handlePrint, handleSendToKsef,
    } = useNewInvoice();

    const showCloseButton = isKsefConnected && invoiceSent;

    return (
        <div className="flex h-screen overflow-hidden bg-background print-hide-nav">
            <SideNav />
            <main className="flex flex-1 flex-col overflow-hidden">
                <TopBar />
                <div className="flex-1 overflow-y-auto no-print">
                    <div className="mx-auto max-w-7xl space-y-4 p-8">
                        <header className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {isImported ? 'Faktura z importu SmartQuote' : 'Nowa faktura'}
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {isImported ? 'Zweryfikuj dane i wyślij fakturę do KSeF' : 'Wystaw fakturę sprzedaży i wyślij do KSeF'}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <PrimaryButton onClick={saveDraftToStorage}>
                                    <Save className="h-4 w-4" /> Zapisz szkic
                                </PrimaryButton>
                                <button className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-secondary"
                                    onClick={clearForm}>Wyczyść</button>
                                <PrimaryButton onClick={handlePrint}>
                                    <Printer className="h-4 w-4" /> Podgląd / Drukuj
                                </PrimaryButton>
                                <PrimaryButton onClick={handleSendToKsef}
                                    disabled={isSending || !isAuthenticated}
                                    title={!isAuthenticated ? 'Zaloguj się do KSeF, aby wysłać fakturę' : undefined}>
                                    <Send className="h-4 w-4" />
                                    {isSending ? 'Wysyłanie...' : 'Wyślij do KSeF'}
                                </PrimaryButton>
                                {showCloseButton && (
                                    <button
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-secondary disabled:opacity-40"
                                        onClick={closeSession} disabled={isClosing}
                                        title="Zamknij sesję interaktywną i pobierz zbiorcze UPO">
                                        <Lock className="h-4 w-4" />
                                        {isClosing ? 'Zamykanie...' : 'Zakończ sesję i pobierz UPO'}
                                    </button>
                                )}
                            </div>
                        </header>

                        {/* Banners */}
                        {!isAuthenticated && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                                <span className="text-warning-foreground">Nie jesteś zalogowany do KSeF. Aby wysłać fakturę, najpierw się zaloguj.</span>
                            </div>
                        )}
                        {isImported && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm">
                                <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <span className="text-foreground">Dane zaimportowane ze SmartQuote. Zweryfikuj i uzupełnij brakujące pola przed wysyłką.</span>
                            </div>
                        )}
                        {closeInfo && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
                                <Info className="mt-0.5 h-4 w-4 shrink-0" />{closeInfo}
                            </div>
                        )}
                        {info && (
                            <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${info.startsWith('✅') ? 'border-accent/20 bg-accent/10 text-accent' : 'border-primary/15 bg-primary/5 text-foreground'}`}>
                                <Info className="mt-0.5 h-4 w-4 shrink-0" />{info}
                            </div>
                        )}
                        {errors.length > 0 && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <strong className="font-semibold">Popraw poniższe błędy:</strong>
                                    <ul className="mt-1 space-y-0.5">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                                </div>
                            </div>
                        )}

                        <InvoiceDocumentCard draft={draft} onChange={patch => setDraft(prev => ({ ...prev, ...patch }))} />
                        <InvoiceParties draft={draft}
                            onSellerChange={patch => setDraft(prev => ({ ...prev, seller: { ...prev.seller, ...patch } }))}
                            onBuyerChange={updateBuyer} />
                        <InvoiceLinesTable lines={draft.lines} totals={totals}
                            onUpdateLine={updateLine} onAddLine={addLine} onRemoveLine={removeLine} />
                        <InvoicePayment payment={draft.payment}
                            onChange={patch => setDraft(prev => ({ ...prev, payment: { ...prev.payment, ...patch } }))} />
                    </div>
                </div>

                <InvoicePrintView draft={draft} totals={totals} />
            </main>
        </div>
    );
}
