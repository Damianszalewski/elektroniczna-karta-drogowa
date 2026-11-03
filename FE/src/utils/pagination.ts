export const PAGE_SIZE = 10;
export const USERS_PAGE_SIZE = 6;

export function getPageCount(totalItems: number, pageSize = PAGE_SIZE) {
    return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function getPageItems<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
    const pageCount = getPageCount(items.length, pageSize);
    const safePage = Math.min(Math.max(page, 1), pageCount);
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
}
