import type { ExternalDraftStatus } from '../../types/externalDraft';

export type StatusFilter = 'all' | ExternalDraftStatus;

export const STATUS_LABELS: Record<ExternalDraftStatus, string> = {
    PENDING: 'Oczekujący',
    APPROVED: 'Zatwierdzony',
    REJECTED: 'Odrzucony',
};

export const STATUS_BADGE_VARIANTS: Record<ExternalDraftStatus, 'warning' | 'success' | 'danger'> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
};

export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pl-PL');
}

export function formatMoney(amount: number, currency: string): string {
    return amount.toLocaleString('pl-PL', { style: 'currency', currency });
}
