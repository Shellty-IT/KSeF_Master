import { useMemo } from 'react';
import { round2 } from '../../../helpers/money';
import { calcLine } from '../../../helpers/vat';
import type { InvoiceLineDraft, InvoiceTotals } from '../types';

export function useInvoiceTotals(lines: InvoiceLineDraft[]): InvoiceTotals {
    return useMemo(() => {
        let totalNet = 0;
        let totalVat = 0;
        let totalGross = 0;
        const perRate: Record<string, { net: number; vat: number; gross: number }> = {};

        lines.forEach(line => {
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
    }, [lines]);
}