import { ApiError } from '../services/api';

export function getErrorMessage(cause: unknown, fallback: string) {
    return cause instanceof ApiError ? cause.message : fallback;
}
