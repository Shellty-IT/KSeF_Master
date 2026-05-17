import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sanitizeNip } from '../../../helpers/nip';
import { calcLine } from '../../../helpers/vat';
import { sendInvoice } from '../../../services/ksefApi';
import type { CreateInvoiceRequest } from '../../../types/invoice';
import { approveDraft } from '../../../services/externalDraftsApi';
import { useAuth } from '../../../hooks/useAuth';
import { useInvoiceTotals } from './useInvoiceTotals';
import { useInvoiceValidation } from './useInvoiceValidation';
import type { InvoiceDraft, InvoiceLineDraft } from '../types';
import type { PartyValue } from '../../../components/form/ContractorSelect';
import { DRAFT_KEY, SELLER_KEY, emptyLine } from '../constants';
import { addDays, loadDraft, loadImportedData, saveSentInvoice, mapVatRateToKsef, createEmptyDraft } from '../utils';
import { STORAGE_KEYS } from '../../../constants/storage';

export default function useNewInvoice() {
    const { nip: sessionNip, isAuthenticated } = useAuth();
    const [searchParams] = useSearchParams();
    const isImported = searchParams.get('source') === 'imported';
    const { validate } = useInvoiceValidation();

    const [importedDraftId, setImportedDraftId] = useState<string | null>(null);

    const initial: InvoiceDraft = useMemo(() => {
        if (isImported) {
            const imported = loadImportedData();
            if (imported) {
                setImportedDraftId(imported.draftId);
                return imported.draft;
            }
        }
        const fromDraft = loadDraft(sessionNip);
        if (fromDraft) return fromDraft;
        return createEmptyDraft(sessionNip);
    }, [sessionNip, isImported]);

    const [draft, setDraft] = useState<InvoiceDraft>(initial);
    const [errors, setErrors] = useState<string[]>([]);
    const [info, setInfo] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [invoiceSent, setInvoiceSent] = useState(false);

    const totals = useInvoiceTotals(draft.lines);

    useEffect(() => {
        if (sessionNip && draft.seller.nip !== sessionNip) {
            setDraft(prev => ({
                ...prev,
                seller: { ...prev.seller, nip: sessionNip },
            }));
        }
    }, [sessionNip, draft.seller.nip]);

    useEffect(() => {
        if (isImported) return;

        const timer = setTimeout(() => {
            try {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
                localStorage.setItem(SELLER_KEY, JSON.stringify(draft.seller));
            } catch {
                // noop
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [draft, isImported]);

    useEffect(() => {
        setDraft(prev => ({
            ...prev,
            payment: {
                ...prev.payment,
                dueDate: addDays(prev.issueDate, prev.payment.dueDays),
            },
        }));
    }, [draft.issueDate, draft.payment.dueDays]);

    function updateBuyer(v: PartyValue) {
        setDraft(prev => ({
            ...prev,
            buyer: {
                name: v.name,
                nip: sanitizeNip(v.nip),
                address: v.address,
                bankAccount: v.bankAccount,
            },
        }));
    }

    function updateLine(index: number, patch: Partial<InvoiceLineDraft>) {
        setDraft(prev => ({
            ...prev,
            lines: prev.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)),
        }));
    }

    function addLine() {
        setDraft(prev => ({ ...prev, lines: [...prev.lines, { ...emptyLine }] }));
    }

    function removeLine(index: number) {
        setDraft(prev => ({
            ...prev,
            lines: prev.lines.filter((_, i) => i !== index),
        }));
    }

    function saveDraftToStorage() {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
            localStorage.setItem(SELLER_KEY, JSON.stringify(draft.seller));
            setInfo('Szkic zapisany lokalnie.');
            setTimeout(() => setInfo(null), 2000);
        } catch {
            setInfo('Nie udało się zapisać szkicu.');
            setTimeout(() => setInfo(null), 2000);
        }
    }

    function clearForm() {
        localStorage.removeItem(DRAFT_KEY);
        sessionStorage.removeItem(STORAGE_KEYS.importedDraftId);
        setImportedDraftId(null);
        setInvoiceSent(false);
        setDraft(createEmptyDraft(sessionNip));
        setErrors([]);
    }

    function handlePrint() {
        const errs = validate(draft, totals);
        setErrors(errs);
        if (errs.length > 0) return;
        setTimeout(() => window.print(), 100);
    }

    async function handleSendToKsef() {
        if (!isAuthenticated) {
            setErrors(['Musisz być zalogowany do KSeF, aby wysłać fakturę.']);
            return;
        }

        const errs = validate(draft, totals);
        setErrors(errs);
        if (errs.length > 0) return;

        setIsSending(true);
        setInfo('Wysyłanie faktury do KSeF...');

        try {
            const invoiceRequest: CreateInvoiceRequest = {
                invoiceNumber: draft.number,
                issueDate: draft.issueDate,
                saleDate: draft.sellDate,
                seller: {
                    nip: draft.seller.nip,
                    name: draft.seller.name,
                    countryCode: 'PL',
                    addressLine1: draft.seller.address,
                },
                buyer: {
                    nip: draft.buyer.nip,
                    name: draft.buyer.name,
                    countryCode: 'PL',
                    addressLine1: draft.buyer.address,
                },
                items: draft.lines.map(line => ({
                    name: line.name,
                    unit: line.unit,
                    quantity: line.qty,
                    unitPriceNet: line.priceNet,
                    vatRate: mapVatRateToKsef(line.vatRate),
                })),
                currency: draft.currency,
                issuePlace: draft.place,
                payment: {
                    method: draft.payment.method,
                    dueDate: draft.payment.dueDate,
                    bankAccount: draft.payment.bankAccount,
                },
            };

            const sendResponse = await sendInvoice(invoiceRequest);

            if (!sendResponse.success) {
                throw new Error(sendResponse.error || 'Nie udało się wysłać faktury');
            }

            const refNumber = sendResponse.data?.elementReferenceNumber || null;
            const invoiceHash = sendResponse.data?.invoiceHash || null;

            const itemsWithValues = draft.lines.map(line => {
                const res = calcLine({
                    qty: line.qty,
                    priceNet: line.priceNet,
                    discount: line.discount || 0,
                    vatRate: line.vatRate,
                });
                return {
                    name: line.name,
                    unit: line.unit,
                    quantity: line.qty,
                    unitPriceNet: line.priceNet,
                    vatRate: typeof line.vatRate === 'number' ? `${line.vatRate}` : line.vatRate,
                    netValue: res.net,
                    vatValue: res.vat,
                    grossValue: res.gross,
                };
            });

            saveSentInvoice({
                invoiceNumber: draft.number,
                elementReferenceNumber: refNumber || 'oczekuje',
                sentAt: new Date().toISOString(),
                sellerNip: draft.seller.nip,
                buyerNip: draft.buyer.nip,
                buyerName: draft.buyer.name,
                grossAmount: totals.gross,
                invoiceHash: invoiceHash || undefined,
                issueDate: draft.issueDate,
                saleDate: draft.sellDate,
                issuePlace: draft.place,
                sellerName: draft.seller.name,
                sellerAddress: draft.seller.address,
                sellerBankAccount: draft.payment.bankAccount,
                buyerAddress: draft.buyer.address,
                items: itemsWithValues,
                totals: {
                    net: totals.net,
                    vat: totals.vat,
                    gross: totals.gross,
                    perRate: totals.perRate,
                },
                paymentMethod: draft.payment.method,
                paymentDueDate: draft.payment.dueDate,
                paymentBankAccount: draft.payment.bankAccount,
            });

            if (importedDraftId) {
                approveDraft(importedDraftId).catch(() => {});
                sessionStorage.removeItem(STORAGE_KEYS.importedDraftId);
                setImportedDraftId(null);
            }

            if (refNumber) {
                setInfo(`✅ Faktura wysłana do KSeF! Numer referencyjny: ${refNumber}`);
            } else {
                setInfo('✅ Faktura została przyjęta do przetwarzania w KSeF.');
            }

            setInvoiceSent(true);

            setTimeout(() => {
                if (window.confirm('Faktura została wysłana. Czy chcesz wyczyścić formularz?')) {
                    clearForm();
                }
            }, 1500);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
            setErrors([`Błąd wysyłki do KSeF: ${errorMessage}`]);
            setInfo(null);
        } finally {
            setIsSending(false);
        }
    }

    return {
        draft,
        setDraft,
        errors,
        info,
        isSending,
        isAuthenticated,
        isImported,
        invoiceSent,
        totals,
        updateBuyer,
        updateLine,
        addLine,
        removeLine,
        saveDraftToStorage,
        clearForm,
        handlePrint,
        handleSendToKsef,
    };
}