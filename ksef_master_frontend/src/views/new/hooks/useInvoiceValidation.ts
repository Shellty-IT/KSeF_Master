import { round2 } from '../../../helpers/money';
import { isValidNip } from '../../../helpers/nip';
import { isValidBankAccount } from '../utils';
import type { InvoiceDraft, InvoiceTotals } from '../types';

export function useInvoiceValidation() {
    function validate(draft: InvoiceDraft, totals: InvoiceTotals): string[] {
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
            if ((l.discount || 0) < 0 || (l.discount || 0) > 100)
                errs.push(`Pozycja #${idx + 1}: rabat musi mieścić się w zakresie od 0 do 100%.`);
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

    return { validate };
}
