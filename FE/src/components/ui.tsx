import type { ReactNode } from 'react';
import './ui.css'

export type AppIconName = 'home' | 'file-plus' | 'archive' | 'car' | 'route' | 'users' | 'key' | 'eye';

export function AppIcon({ name }: { name: AppIconName }) {
    const common = {
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    };

    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {name === 'home' && (
                <>
                    <path {...common} d="m3 10 9-7 9 7" />
                    <path {...common} d="M5 9v11h14V9M9 20v-6h6v6" />
                </>
            )}
            {name === 'file-plus' && (
                <>
                    <path {...common} d="M6 3h8l4 4v14H6zM14 3v5h4" />
                    <path {...common} d="M12 12v6M9 15h6" />
                </>
            )}
            {name === 'archive' && (
                <>
                    <path {...common} d="M4 5h16v4H4zM6 9v10h12V9" />
                    <path {...common} d="M9 13h6" />
                </>
            )}
            {name === 'car' && (
                <>
                    <path {...common} d="m5 11 2-5h10l2 5" />
                    <path {...common} d="M4 11h16v6H4zM7 17v2M17 17v2" />
                    <circle cx="8" cy="14" r="1" fill="currentColor" />
                    <circle cx="16" cy="14" r="1" fill="currentColor" />
                </>
            )}
            {name === 'route' && (
                <>
                    <circle cx="6" cy="18" r="2" {...common} />
                    <circle cx="18" cy="6" r="2" {...common} />
                    <path {...common} d="M7.5 16.5c2-2 1-4.5 3.5-5.5s4 1 5.5-3.5" />
                </>
            )}
            {name === 'users' && (
                <>
                    <circle cx="9" cy="8" r="3" {...common} />
                    <path {...common} d="M3.5 20c.5-3.2 2.3-5 5.5-5s5 1.8 5.5 5" />
                    <circle cx="17" cy="9" r="2.2" {...common} />
                    <path {...common} d="M16 15c2.5 0 4 1.5 4.5 4" />
                </>
            )}
            {name === 'key' && (
                <>
                    <circle cx="8" cy="15" r="3" {...common} />
                    <path {...common} d="m10.5 12.5 7-7M15 8l2 2M17 6l2 2" />
                </>
            )}
            {name === 'eye' && (
                <>
                    <path {...common} d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="2.5" {...common} />
                </>
            )}
        </svg>
    );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="field">
            {label}
            {children}
        </label>
    );
}

export function Alert({
    children,
    tone,
    onClose,
}: {
    children: ReactNode;
    tone: 'error' | 'success';
    onClose: () => void;
}) {
    return (
        <div className={`alert ${tone}`}>
            <span>{tone === 'error' ? '!' : '✓'}</span>
            {children}
            <button onClick={onClose}>×</button>
        </div>
    );
}

export function Loading() {
    return (
        <div className="loading">
            <span className="spinner" /> Ładowanie danych…
        </div>
    );
}

export function Pagination({
    page,
    pageCount,
    onPageChange,
}: {
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
}) {
    if (pageCount <= 1) return null;

    const pageNumbers =
        pageCount <= 7
            ? Array.from({ length: pageCount }, (_, index) => index + 1)
            : Array.from(new Set([1, page - 1, page, page + 1, pageCount]))
                  .filter((pageNumber) => pageNumber >= 1 && pageNumber <= pageCount)
                  .sort((left, right) => left - right);
    const pageItems: Array<number | string> = [];
    pageNumbers.forEach((pageNumber, index) => {
        const previousPage = pageNumbers[index - 1];
        if (previousPage && pageNumber - previousPage > 1) pageItems.push(`ellipsis-${pageNumber}`);
        pageItems.push(pageNumber);
    });

    return (
        <nav className="pagination" aria-label="Paginacja listy">
            <button
                className="pagination-button"
                type="button"
                aria-label="Poprzednia strona"
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
            >
                ←
            </button>
            {pageItems.map((item) =>
                typeof item === 'string' ? (
                    <span className="pagination-ellipsis" key={item} aria-hidden="true">
                        …
                    </span>
                ) : (
                    <button
                        className={item === page ? 'pagination-button active' : 'pagination-button'}
                        type="button"
                        key={item}
                        aria-current={item === page ? 'page' : undefined}
                        onClick={() => onPageChange(item)}
                    >
                        {item}
                    </button>
                ),
            )}
            <button
                className="pagination-button"
                type="button"
                aria-label="Następna strona"
                disabled={page === pageCount}
                onClick={() => onPageChange(page + 1)}
            >
                →
            </button>
        </nav>
    );
}

export function TrashIcon() {
    return (
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false">
            <path d="M5 7h14M10 4h4l1 3H9l1-3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 7.5 8 20h8l1-12.5M10 11v5M14 11v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function ConfirmModal({
    message,
    busy = false,
    onConfirm,
    onCancel,
}: {
    message: string;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
            <section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title">
                <div className="confirm-modal-header">
                    <div className="confirm-modal-icon">
                        <TrashIcon />
                    </div>
                    <button className="confirm-modal-close" type="button" aria-label="Zamknij" onClick={onCancel}>
                        ×
                    </button>
                </div>
                <div className="confirm-modal-content">
                    <span className="card-kicker">OSTRZEŻENIE</span>
                    <h2 id="confirm-modal-title">Potwierdź usunięcie</h2>
                    <p>{message}</p>
                    <small>Tej operacji nie można cofnąć.</small>
                </div>
                <div className="confirm-modal-actions">
                    <button className="button outline" type="button" onClick={onCancel} disabled={busy}>
                        ANULUJ
                    </button>
                    <button className="button destructive" type="button" onClick={onConfirm} disabled={busy}>
                        {busy ? 'USUWANIE…' : 'USUŃ'}
                    </button>
                </div>
            </section>
        </div>
    );
}
