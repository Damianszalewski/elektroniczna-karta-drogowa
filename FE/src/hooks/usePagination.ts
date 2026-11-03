import { useEffect, useState } from 'react';
import { getPageCount, getPageItems, PAGE_SIZE } from '../utils/pagination';

type PaginationOptions = {
    pageSize?: number;
    resetKey?: string | number;
};

/**
 * Keeps page state and the visible slice of a list in one place.
 * The parent component remains responsible for filtering and sorting.
 */
export function usePagination<T>(items: T[], options: PaginationOptions = {}) {
    const { pageSize = PAGE_SIZE, resetKey } = options;
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [resetKey]);

    const pageCount = getPageCount(items.length, pageSize);
    const currentPage = Math.min(page, pageCount);

    return {
        currentPage,
        pageCount,
        visibleItems: getPageItems(items, currentPage, pageSize),
        setPage,
    };
}
