// src/views/new/hooks/useNewInvoice.ts
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { round2 } from '../../../helpers/money';
import { isValidNip, sanitizeNip } from '../../../helpers/nip';
import { calcLine } from '../../../helpers/vat';
import { sendInvoice, type CreateInvoiceRequest } from '../../../services/ksefApi';
import { approveDraft } from '../../../services/externalDraftsApi';
import { useAuth } from '../../../context/AuthContext';
import type { InvoiceDraft, InvoiceLineDraft, InvoiceTotals } from '../types';
import type { PartyValue } from '../../../components/form/ContractorSelect';
import {
    DRAFT_KEY,
    SELLER_KEY,
    emptyParty,
    emptyLine,
} from '../constants';
import {
    today,
    addDays,
    suggestNumber,
    loadSellerFromStorage,
    loadDraft,
    loadImportedData,
    saveSentInvoice,
    mapVatRateToKsef,
    isValidBankAccount,
    createEmptyDraft,
} from '../utils';

export default function useNewInvoice() {
    const mountedRef = useRef(false);
    const { nip: sessionNip, isAuthenticated } = useAuth();
    const [searchParams] = useSearchParams();
    const isImported = searchParams.get('source') === 'imported';

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

    useEffect(() => {
        if (sessionNip && draft.seller.nip !== sessionNip) {
            setDraft(prev => ({
                ...prev,
                seller: { ...prev.seller, nip: sessionNip },
            }));
        }
    }, [sessionNip, draft.seller.nip]);

    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            return;
        }
        if (isImported) return;
        const t = setTimeout(() => {
            try {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
                localStorage.setItem(SELLER_KEY, JSON.stringify(draft.seller));
            } catch {
                // fallback
            }
        }, 1000);
        return () => clearTimeout(t);
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

    const totals: InvoiceTotals = useMemo(() => {
        let totalNet = 0;
        let totalVat = 0;
        let totalGross = 0;
        const perRate: Record<string, { net: number; vat: number; gross: number }> = {};

        draft.lines.forEach(line => {
            const { net, vat, gross } = calcLine({
                qty: line.qty,
                priceNet: line.priceNet,
                discount: line.discount || 0,
                vatRate: line.vatRate,
            });
            totalNet += net;
            totalVat += vat;
            totalGross += gross;

            const rateKey = typeof line.vatRate === 'number' ? `${line.vatRate}%` : line.vatRate;
            if (!perRate[rateKey]) perRate[rateKey] = { net: 0, vat: 0, gross: 0 };
            perRate[rateKey].net += net;
            perRate[rateKey].vat += vat;
            perRate[rateKey].gross += gross;
        });

        return {
            net: round2(totalNet),
            vat: round2(totalVat),
            gross: round2(totalGross),
            perRate,
        };
    }, [draft.lines]);

    function validate(): string[] {
        const errs: string[] = [];

        if (!draft.number.trim()) errs.push('Numer faktury jest wymagany.');
        if (!draft.issueDate) errs.push('Data wystawienia jest wymagana.');
        if (!draft.sellDate) errs.push('Data sprzedaży jest wymagana.');
        if (draft.currency !== 'PLN') errs.push('Waluta musi być PLN.');

        if (!isValidNip(draft.seller.nip))
            errs.push('NIP sprzedawcy jest nieprawidłowy (10 cyfr + suma kontrolna).');
        if (!draft.seller.name.trim()) errs.push('Nazwa sprzedawcy jest wymagana.');
        if (!draft.seller.address.trim()) errs.push('Adres sprzedawcy jest wymagany.');

        if (!isValidNip(draft.buyer.nip))
            errs.push('NIP nabywcy jest nieprawidłowy (10 cyfr + suma kontrolna).');
        if (!draft.buyer.name.trim()) errs.push('Nazwa nabywcy jest wymagana.');
        if (!draft.buyer.address.trim()) errs.push('Adres nabywcy jest wymagany.');

        if (!draft.lines.length) errs.push('Dodaj co najmniej jedną pozycję.');
        draft.lines.forEach((l, idx) => {
            if (!l.name.trim()) errs.push(`Pozycja #${idx + 1}: nazwa jest wymagana.`);
            if (!(l.qty > 0)) errs.push(`Pozycja #${idx + 1}: ilość musi być dodatnia.`);
            if (!(l.priceNet > 0)) errs.push(`Pozycja #${idx + 1}: cena netto musi być dodatnia.`);
        });

        if (Math.abs(round2(totals.net + totals.vat) - totals.gross) > 0.01) {
            errs.push('Suma kontrolna nie zgadza się: netto + VAT musi równać się brutto.');
        }

        if (draft.payment.method === 'przelew') {
            if (!draft.payment.bankAccount) {
                errs.push('Dla przelewu wymagany jest rachunek bankowy.');
            } else if (!isValidBankAccount(draft.payment.bankAccount)) {
                errs.push('Rachunek bankowy musi mieć 26 cyfr.');
            }
        }

        return errs;
    }

    function updateField<K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) {
        setDraft(prev => ({ ...prev, [key]: value }));
    }

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
        sessionStorage.removeItem('importedDraftId');
        setImportedDraftId(null);
        setDraft(createEmptyDraft(sessionNip));
        setErrors([]);
    }

    function handlePrint() {
        const errs = validate();
        setErrors(errs);
        if (errs.length > 0) return;
        setTimeout(() => window.print(), 100);
    }

    async function handleSendToKsef() {
        if (!isAuthenticated) {
            setErrors(['Musisz być zalogowany do KSeF, aby wysłać fakturę.']);
            return;
        }

        const errs = validate();
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
                sessionStorage.removeItem('importedDraftId');
                setImportedDraftId(null);
            }

            if (refNumber) {
                setInfo(`✅ Faktura wysłana do KSeF! Numer referencyjny: ${refNumber}`);
            } else {
                setInfo('✅ Faktura została przyjęta do przetwarzania w KSeF.');
            }

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
        totals,
        updateField,
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