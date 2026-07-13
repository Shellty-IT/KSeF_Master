import type { Invoice } from './ksefApi';
import {
    defaultAlertSettings,
    type AlertSettings,
    type FraudAlert,
    type FraudAnalysisResult,
    type AlertLevel,
} from '../types/fraud';

const ALERT_SETTINGS_KEY = 'app:alertSettings';
const DISMISSED_ALERTS_KEY = 'app:dismissedAlerts';
const KNOWN_CONTRACTORS_KEY = 'app:knownContractors';
const DAY_MS = 24 * 60 * 60 * 1000;

export interface FraudAnalysisPreferences {
    dismissedAlerts?: ReadonlySet<string>;
    knownContractors?: ReadonlySet<string>;
}

interface AnalysisIndex {
    duplicateCounts: Map<string, number>;
    firstInvoiceByContractor: Map<string, string>;
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function normalizeSettings(value: unknown): AlertSettings {
    const parsed = typeof value === 'object' && value !== null
        ? value as Partial<AlertSettings>
        : {};

    return {
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : defaultAlertSettings.enabled,
        highAmountThreshold: finiteNumber(parsed.highAmountThreshold, defaultAlertSettings.highAmountThreshold, 0, 1_000_000_000),
        unknownContractorThreshold: finiteNumber(parsed.unknownContractorThreshold, defaultAlertSettings.unknownContractorThreshold, 0, 1_000_000_000),
        unusualHoursEnabled: typeof parsed.unusualHoursEnabled === 'boolean' ? parsed.unusualHoursEnabled : defaultAlertSettings.unusualHoursEnabled,
        unusualHoursStart: /^\d{2}:\d{2}$/.test(parsed.unusualHoursStart ?? '') ? parsed.unusualHoursStart! : defaultAlertSettings.unusualHoursStart,
        unusualHoursEnd: /^\d{2}:\d{2}$/.test(parsed.unusualHoursEnd ?? '') ? parsed.unusualHoursEnd! : defaultAlertSettings.unusualHoursEnd,
        duplicateDetectionEnabled: typeof parsed.duplicateDetectionEnabled === 'boolean' ? parsed.duplicateDetectionEnabled : defaultAlertSettings.duplicateDetectionEnabled,
        duplicateWindowDays: finiteNumber(parsed.duplicateWindowDays, defaultAlertSettings.duplicateWindowDays, 1, 365),
        roundAmountDetectionEnabled: typeof parsed.roundAmountDetectionEnabled === 'boolean' ? parsed.roundAmountDetectionEnabled : defaultAlertSettings.roundAmountDetectionEnabled,
    };
}

export function getAlertSettings(): AlertSettings {
    try {
        const raw = localStorage.getItem(ALERT_SETTINGS_KEY);
        return normalizeSettings(raw ? JSON.parse(raw) : null);
    } catch {
        return { ...defaultAlertSettings };
    }
}

export function saveAlertSettings(settings: AlertSettings): void {
    localStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
}

function readStringSet(key: string): Set<string> {
    try {
        const raw = localStorage.getItem(key);
        const values: unknown = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(values)) return new Set();
        return new Set(values.filter((value): value is string => typeof value === 'string'));
    } catch {
        return new Set();
    }
}

export function getDismissedAlerts(): Set<string> {
    return readStringSet(DISMISSED_ALERTS_KEY);
}

export function dismissAlert(alertId: string): void {
    const dismissed = getDismissedAlerts();
    dismissed.add(alertId);
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify([...dismissed].sort()));
}

export function undismissAlert(alertId: string): void {
    const dismissed = getDismissedAlerts();
    dismissed.delete(alertId);
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify([...dismissed].sort()));
}

export function clearDismissedAlerts(): void {
    localStorage.removeItem(DISMISSED_ALERTS_KEY);
}

function normalizeNip(nip: string | undefined): string {
    return (nip ?? '').replace(/\D/g, '');
}

export function getKnownContractors(): Set<string> {
    return new Set([...readStringSet(KNOWN_CONTRACTORS_KEY)].map(normalizeNip).filter(Boolean));
}

export function addKnownContractor(nip: string): void {
    const normalizedNip = normalizeNip(nip);
    if (!normalizedNip) return;

    const known = getKnownContractors();
    known.add(normalizedNip);
    localStorage.setItem(KNOWN_CONTRACTORS_KEY, JSON.stringify([...known].sort()));
}

function generateAlertId(invoiceId: string, alertType: string): string {
    return `${invoiceId}:${alertType}`;
}

function parseMinutes(time: string): number {
    const [hours = 0, minutes = 0] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function isTimeInRange(date: Date, startTime: string, endTime: string): boolean {
    const current = date.getHours() * 60 + date.getMinutes();
    const start = parseMinutes(startTime);
    const end = parseMinutes(endTime);

    // A range such as 22:00–06:00 intentionally crosses midnight.
    return start <= end
        ? current >= start && current <= end
        : current >= start || current <= end;
}

function includesExplicitTime(value: string): boolean {
    return /(?:T|\s)\d{2}:\d{2}/.test(value);
}

function amountInCents(amount: number): number {
    return Math.round((Number.isFinite(amount) ? amount : 0) * 100);
}

function isRoundAmount(amount: number): boolean {
    const cents = amountInCents(amount);
    return cents >= 100_000 && cents % 100_000 === 0;
}

function invoiceTimestamp(invoice: Invoice): number | null {
    const timestamp = new Date(invoice.dataWystawienia).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
}

function compareInvoices(a: Invoice, b: Invoice): number {
    const aTime = invoiceTimestamp(a) ?? Number.MAX_SAFE_INTEGER;
    const bTime = invoiceTimestamp(b) ?? Number.MAX_SAFE_INTEGER;
    return aTime - bTime || a.numerKsef.localeCompare(b.numerKsef);
}

function lowerBound(values: number[], target: number): number {
    let low = 0;
    let high = values.length;
    while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (values[middle] < target) low = middle + 1;
        else high = middle;
    }
    return low;
}

function upperBound(values: number[], target: number): number {
    let low = 0;
    let high = values.length;
    while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (values[middle] <= target) low = middle + 1;
        else high = middle;
    }
    return low;
}

function buildAnalysisIndex(invoices: Invoice[], duplicateWindowDays: number): AnalysisIndex {
    const firstInvoiceByContractor = new Map<string, string>();
    const duplicateGroups = new Map<string, Array<{ id: string; timestamp: number }>>();

    for (const invoice of [...invoices].sort(compareInvoices)) {
        const nip = normalizeNip(invoice.nipKontrahenta);
        if (nip && !firstInvoiceByContractor.has(nip)) {
            firstInvoiceByContractor.set(nip, invoice.numerKsef);
        }

        const timestamp = invoiceTimestamp(invoice);
        if (!nip || timestamp === null || !Number.isFinite(invoice.kwotaBrutto)) continue;

        const key = `${nip}:${amountInCents(invoice.kwotaBrutto)}`;
        const group = duplicateGroups.get(key) ?? [];
        group.push({ id: invoice.numerKsef, timestamp });
        duplicateGroups.set(key, group);
    }

    const duplicateCounts = new Map<string, number>();
    const windowMs = duplicateWindowDays * DAY_MS;

    for (const group of duplicateGroups.values()) {
        if (group.length < 2) continue;
        group.sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));
        const timestamps = group.map(item => item.timestamp);

        group.forEach((item, index) => {
            const first = lowerBound(timestamps, item.timestamp - windowMs);
            const lastExclusive = upperBound(timestamps, item.timestamp + windowMs);
            const count = lastExclusive - first - 1;
            if (count > 0) duplicateCounts.set(group[index].id, count);
        });
    }

    return { duplicateCounts, firstInvoiceByContractor };
}

function formatCurrency(amount: number): string {
    return amount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' });
}

function resolveLevel(alerts: FraudAlert[]): AlertLevel {
    if (alerts.some(alert => alert.level === 'high')) return 'high';
    if (alerts.some(alert => alert.level === 'medium')) return 'medium';
    return alerts.length > 0 ? 'low' : 'none';
}

function analyzeWithIndex(
    invoice: Invoice,
    settings: AlertSettings,
    preferences: Required<FraudAnalysisPreferences>,
    index: AnalysisIndex,
): FraudAnalysisResult {
    const alerts: FraudAlert[] = [];
    const isDismissed = (type: string) => preferences.dismissedAlerts.has(generateAlertId(invoice.numerKsef, type));
    const nip = normalizeNip(invoice.nipKontrahenta);

    if (!settings.enabled) {
        return { invoiceId: invoice.numerKsef, alertLevel: 'none', alerts };
    }

    const isFirstInvoiceFromContractor = nip && index.firstInvoiceByContractor.get(nip) === invoice.numerKsef;
    if (
        settings.unknownContractorThreshold > 0
        && Number.isFinite(invoice.kwotaBrutto)
        && invoice.kwotaBrutto >= settings.unknownContractorThreshold
        && isFirstInvoiceFromContractor
        && !preferences.knownContractors.has(nip)
        && !isDismissed('unknown_contractor')
    ) {
        alerts.push({
            type: 'unknown_contractor',
            level: 'high',
            message: `Pierwsza faktura od niezaufanego kontrahenta (${invoice.nazwaKontrahenta || nip}) na kwotę ${formatCurrency(invoice.kwotaBrutto)}`,
        });
    }

    const duplicateCount = index.duplicateCounts.get(invoice.numerKsef) ?? 0;
    if (settings.duplicateDetectionEnabled && duplicateCount > 0 && !isDismissed('duplicate')) {
        alerts.push({
            type: 'duplicate',
            level: 'medium',
            message: `Potencjalny duplikat — ${duplicateCount} ${duplicateCount === 1 ? 'inna faktura ma' : 'inne faktury mają'} tę samą kwotę i NIP w oknie ${settings.duplicateWindowDays} dni`,
        });
    }

    if (
        settings.highAmountThreshold > 0
        && Number.isFinite(invoice.kwotaBrutto)
        && invoice.kwotaBrutto >= settings.highAmountThreshold
        && !isDismissed('high_amount')
    ) {
        alerts.push({
            type: 'high_amount',
            level: 'low',
            message: `Wysoka wartość faktury: ${formatCurrency(invoice.kwotaBrutto)}`,
        });
    }

    if (
        settings.unusualHoursEnabled
        && includesExplicitTime(invoice.dataWystawienia)
        && !isDismissed('unusual_hour')
    ) {
        const date = new Date(invoice.dataWystawienia);
        if (Number.isFinite(date.getTime()) && !isTimeInRange(date, settings.unusualHoursStart, settings.unusualHoursEnd)) {
            const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            alerts.push({
                type: 'unusual_hour',
                level: 'low',
                message: `Faktura wystawiona o nietypowej godzinie: ${time}`,
            });
        }
    }

    if (
        settings.roundAmountDetectionEnabled
        && Number.isFinite(invoice.kwotaBrutto)
        && isRoundAmount(invoice.kwotaBrutto)
        && !isDismissed('round_amount')
    ) {
        alerts.push({
            type: 'round_amount',
            level: 'low',
            message: `Okrągła kwota faktury: ${formatCurrency(invoice.kwotaBrutto)}`,
        });
    }

    return {
        invoiceId: invoice.numerKsef,
        alertLevel: resolveLevel(alerts),
        alerts,
    };
}

export function analyzeInvoice(
    invoice: Invoice,
    allInvoices: Invoice[],
    settings: AlertSettings,
    knownContractors: ReadonlySet<string>,
): FraudAnalysisResult {
    const normalizedSettings = normalizeSettings(settings);
    const preferences: Required<FraudAnalysisPreferences> = {
        dismissedAlerts: getDismissedAlerts(),
        knownContractors: new Set([...knownContractors].map(normalizeNip).filter(Boolean)),
    };
    return analyzeWithIndex(
        invoice,
        normalizedSettings,
        preferences,
        buildAnalysisIndex(allInvoices, normalizedSettings.duplicateWindowDays),
    );
}

export function analyzeInvoices(
    invoices: Invoice[],
    settings: AlertSettings,
    preferences: FraudAnalysisPreferences = {},
): Map<string, FraudAnalysisResult> {
    const normalizedSettings = normalizeSettings(settings);
    const resolvedPreferences: Required<FraudAnalysisPreferences> = {
        dismissedAlerts: preferences.dismissedAlerts ?? getDismissedAlerts(),
        knownContractors: new Set(
            [...(preferences.knownContractors ?? getKnownContractors())]
                .map(normalizeNip)
                .filter(Boolean),
        ),
    };
    const index = buildAnalysisIndex(invoices, normalizedSettings.duplicateWindowDays);

    return new Map(invoices.map(invoice => [
        invoice.numerKsef,
        analyzeWithIndex(invoice, normalizedSettings, resolvedPreferences, index),
    ]));
}

export function getAlertsSummary(results: ReadonlyMap<string, FraudAnalysisResult>): {
    total: number;
    high: number;
    medium: number;
    low: number;
} {
    const summary = { total: 0, high: 0, medium: 0, low: 0 };

    for (const result of results.values()) {
        if (result.alertLevel === 'none') continue;
        summary.total++;
        summary[result.alertLevel]++;
    }

    return summary;
}
