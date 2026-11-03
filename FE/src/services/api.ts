import type { Car, RoadCard, RouteTemplate, Trip, User, UserRole } from '../types';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status = 0,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = sessionStorage.getItem('road-card-token');
    const headers = new Headers(options.headers);
    if (options.body && !(options.body instanceof URLSearchParams)) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let response: Response;
    try {
        response = await fetch(`${API_URL}${path}`, { ...options, headers });
    } catch {
        throw new ApiError('Nie można połączyć się z API. Sprawdź, czy backend działa.');
    }

    if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const detail = typeof payload?.detail === 'string' ? payload.detail : `Błąd API (${response.status})`;
        throw new ApiError(detail, response.status);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
}

type RouteTemplatePayload = {
    name: string;
    departure_location?: string;
    arrival_location?: string;
    points?: string[];
    description?: string;
};
type UserUpdatePayload = Pick<User, 'email' | 'name' | 'last_name'> & { password?: string; role?: UserRole };
type CardPayload = { car_id: number; driver_id: number; trips: Omit<Trip, 'id'>[] };

export const api = {
    login: (email: string, password: string) =>
        request<{ access_token: string; token_type: string }>('/token', {
            method: 'POST',
            body: new URLSearchParams({ username: email, password }),
        }),
    me: () => request<User>('/users/me'),
    users: () => request<User[]>('/users/'),
    createUser: (user: { email: string; name: string; last_name: string; password: string; role: UserRole }) =>
        request<User>('/users/', { method: 'POST', body: JSON.stringify(user) }),
    changeMyPassword: (password: string) =>
        request<{ message: string }>('/users/me/password', { method: 'PUT', body: JSON.stringify({ password }) }),
    updateUser: (id: number, user: UserUpdatePayload) =>
        request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
    deleteUser: (id: number) => request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
    cars: (includeRetired = false) =>
        request<Car[]>(includeRetired ? '/cars/?include_retired=true' : '/cars/'),
    createCar: (car: Omit<Car, 'id'>) => request<Car>('/cars/', { method: 'POST', body: JSON.stringify(car) }),
    updateCar: (id: number, car: Omit<Car, 'id'>) =>
        request<Car>(`/cars/${id}`, { method: 'PUT', body: JSON.stringify(car) }),
    deleteCar: (id: number) => request<Car>(`/cars/${id}`, { method: 'DELETE' }),
    templates: () => request<RouteTemplate[]>('/route-templates/'),
    createTemplate: (template: RouteTemplatePayload) =>
        request<RouteTemplate>('/route-templates/', { method: 'POST', body: JSON.stringify(template) }),
    updateTemplate: (id: number, template: RouteTemplatePayload) =>
        request<RouteTemplate>(`/route-templates/${id}`, { method: 'PUT', body: JSON.stringify(template) }),
    deleteTemplate: (id: number) => request<{ message: string }>(`/route-templates/${id}`, { method: 'DELETE' }),
    cards: (driverId?: number) =>
        request<RoadCard[]>(driverId === undefined ? '/road-cards/' : `/road-cards/?driver_id=${driverId}`),
    latestOdometer: (carId: number) =>
        request<{ has_records: boolean; odometer: number | null }>(`/road-cards/latest-odometer/?car_id=${carId}`),
    createCard: (card: CardPayload) =>
        request<RoadCard>('/road-cards/', { method: 'POST', body: JSON.stringify(card) }),
    updateCard: (id: number, card: CardPayload) =>
        request<RoadCard>(`/road-cards/${id}`, { method: 'PUT', body: JSON.stringify(card) }),
    deleteCard: (id: number) => request<{ message: string }>(`/road-cards/${id}`, { method: 'DELETE' }),
};
