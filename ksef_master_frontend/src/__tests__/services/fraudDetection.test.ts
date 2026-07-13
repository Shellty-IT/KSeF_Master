import { beforeEach, describe, expect, it } from 'vitest';
import type { Invoice } from '../../types/ksef';
import { defaultAlertSettings, type AlertSettings } from '../../types/fraud';
import { analyzeInvoices, getAlertSettings, getAlertsSummary } from '../../services/fraudDetection';

const quietSettings: AlertSettings = {
    ...defaultAlertSettings,
    highAmountThreshold: 0,
    unknownContractorThreshold: 0,
    unusualHoursEnabled: false,
    duplicateDetectionEnabled: false,
    roundAmountDetectionEnabled: false,
};

function invoice(id: string, overrides: Partial<Invoice> = {}): Invoice {
    return {
        numerKsef: id,
        numerFaktury: `FV/${id}`,
        nipKontrahenta: '5252161248',
        nazwaKontrahenta: 'Przykładowa spółka',
        kwotaBrutto: 1234.56,
        dataWystawienia: '2026-01-10',
        status: 'accepted',
        ...overrides,
    };
}

function alertTypes(result: ReturnType<typeof analyzeInvoices>, id: string) {
    return result.get(id)?.alerts.map(alert => alert.type) ?? [];
}

describe('fraudDetection', () => {
    beforeEach(() => localStorage.clear());

    it('merges incomplete persisted settings with safe defaults', () => {
        localStorage.setItem('app:alertSettings', JSON.stringify({ enabled: false, duplicateWindowDays: -10 }));

        expect(getAlertSettings()).toMatchObject({
            enabled: false,
            duplicateWindowDays: 1,
            highAmountThreshold: defaultAlertSettings.highAmountThreshold,
        });
    });

    it('detects duplicates by normalized NIP and amount within the configured window', () => {
        const invoices = [
            invoice('a', { dataWystawienia: '2026-01-10', nipKontrahenta: '525-216-12-48' }),
            invoice('b', { dataWystawienia: '2026-01-12' }),
            invoice('c', { dataWystawienia: '2026-02-20' }),
        ];
        const result = analyzeInvoices(invoices, { ...quietSettings, duplicateDetectionEnabled: true, duplicateWindowDays: 7 }, {
            dismissedAlerts: new Set(),
            knownContractors: new Set(),
        });

        expect(alertTypes(result, 'a')).toContain('duplicate');
        expect(alertTypes(result, 'b')).toContain('duplicate');
        expect(alertTypes(result, 'c')).not.toContain('duplicate');
    });

    it('flags only the first invoice from an unknown contractor and respects trusted NIPs', () => {
        const invoices = [
            invoice('newer', { dataWystawienia: '2026-01-12', kwotaBrutto: 2000 }),
            invoice('older', { dataWystawienia: '2026-01-10', kwotaBrutto: 2000 }),
        ];
        const settings = { ...quietSettings, unknownContractorThreshold: 1000 };
        const unknown = analyzeInvoices(invoices, settings, { dismissedAlerts: new Set(), knownContractors: new Set() });
        const trusted = analyzeInvoices(invoices, settings, { dismissedAlerts: new Set(), knownContractors: new Set(['5252161248']) });

        expect(alertTypes(unknown, 'older')).toContain('unknown_contractor');
        expect(alertTypes(unknown, 'newer')).not.toContain('unknown_contractor');
        expect(alertTypes(trusted, 'older')).not.toContain('unknown_contractor');
    });

    it('does not infer midnight when an invoice contains only a date', () => {
        const settings = { ...quietSettings, unusualHoursEnabled: true, unusualHoursStart: '06:00', unusualHoursEnd: '22:00' };
        const result = analyzeInvoices([
            invoice('date-only', { dataWystawienia: '2026-01-10' }),
            invoice('night', { dataWystawienia: '2026-01-10T02:00:00' }),
        ], settings, { dismissedAlerts: new Set(), knownContractors: new Set() });

        expect(alertTypes(result, 'date-only')).not.toContain('unusual_hour');
        expect(alertTypes(result, 'night')).toContain('unusual_hour');
    });

    it('supports a normal-hours range that crosses midnight', () => {
        const settings = { ...quietSettings, unusualHoursEnabled: true, unusualHoursStart: '22:00', unusualHoursEnd: '06:00' };
        const result = analyzeInvoices([
            invoice('inside', { dataWystawienia: '2026-01-10T23:30:00' }),
            invoice('outside', { dataWystawienia: '2026-01-10T12:00:00' }),
        ], settings, { dismissedAlerts: new Set(), knownContractors: new Set() });

        expect(alertTypes(result, 'inside')).not.toContain('unusual_hour');
        expect(alertTypes(result, 'outside')).toContain('unusual_hour');
    });

    it('excludes dismissed signals and summarizes the highest level per invoice', () => {
        const settings = { ...quietSettings, highAmountThreshold: 1000, unknownContractorThreshold: 1000 };
        const result = analyzeInvoices([
            invoice('high', { kwotaBrutto: 2000 }),
            invoice('low', { nipKontrahenta: '', kwotaBrutto: 1500 }),
        ], settings, {
            dismissedAlerts: new Set(['high:high_amount']),
            knownContractors: new Set(),
        });

        expect(alertTypes(result, 'high')).toEqual(['unknown_contractor']);
        expect(getAlertsSummary(result)).toEqual({ total: 2, high: 1, medium: 0, low: 1 });
    });
});
