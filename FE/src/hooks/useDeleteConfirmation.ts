import { useState } from 'react';

type DeleteHandler<T> = (item: T) => Promise<void>;
type ErrorHandler = (cause: unknown) => void;

/**
 * Shared confirmation flow for destructive list actions.
 * API calls and state updates stay in the screen, while modal state is reused.
 */
export function useDeleteConfirmation<T>(onDelete: DeleteHandler<T>, onError?: ErrorHandler) {
    const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
    const [deleting, setDeleting] = useState(false);

    const requestDelete = (item: T) => setDeleteTarget(item);
    const cancelDelete = () => {
        if (!deleting) setDeleteTarget(null);
    };
    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);
        try {
            await onDelete(deleteTarget);
        } catch (cause) {
            onError?.(cause);
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    return { deleteTarget, deleting, requestDelete, cancelDelete, confirmDelete };
}
