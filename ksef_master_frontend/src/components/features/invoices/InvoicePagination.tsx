import { buildPageNumbers } from '../../../helpers/pagination';

interface InvoicePaginationProps {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export default function InvoicePagination({
    page,
    totalPages,
    total,
    pageSize,
    onPageChange,
}: InvoicePaginationProps) {
    if (totalPages <= 1) return null;

    const pageNumbers = buildPageNumbers(page, totalPages);

    const navBtn = 'rounded-lg border border-border bg-card px-3 py-1.5 text-sm transition hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed';

    return (
        <div className="flex flex-wrap items-center gap-1 pt-4">
            <button
                className={navBtn}
                disabled={page <= 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
            >
                ‹ Poprzednia
            </button>

            {pageNumbers.map((p, i) =>
                p === 'dots' ? (
                    <span key={`dots-${i}`} className="px-1 text-muted-foreground">…</span>
                ) : (
                    <button
                        key={p}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                            p === page
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card hover:bg-secondary'
                        }`}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                className={navBtn}
                disabled={page >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            >
                Następna ›
            </button>

            <span className="ml-2 text-[12px] text-muted-foreground">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} z {total}
            </span>
        </div>
    );
}
