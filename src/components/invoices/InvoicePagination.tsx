import { buildPageNumbers } from '../../helpers/pagination';

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

    return (
        <div className="pagination">
            <button
                className="pagination-nav"
                disabled={page <= 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
            >
                ‹ <span>Poprzednia</span>
            </button>

            {pageNumbers.map((p, i) =>
                p === 'dots' ? (
                    <span key={`dots-${i}`} className="pagination-dots">…</span>
                ) : (
                    <button
                        key={p}
                        className={`pagination-page ${p === page ? 'active' : ''}`}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                className="pagination-nav"
                disabled={page >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            >
                <span>Następna</span> ›
            </button>

            <span className="pagination-info">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} z {total}
            </span>
        </div>
    );
}