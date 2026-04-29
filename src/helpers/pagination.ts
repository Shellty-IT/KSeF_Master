export function buildPageNumbers(current: number, total: number): (number | 'dots')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | 'dots')[] = [1];
    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);

    if (left > 2) pages.push('dots');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push('dots');

    pages.push(total);
    return pages;
}