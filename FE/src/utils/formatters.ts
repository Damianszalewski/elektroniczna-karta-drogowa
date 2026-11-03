import type { Car, RoadCard, RouteTemplate, TripDraft, User } from '../types';

type CreatedRecord = { id: number; created_at?: string | null };

export function compareByCreatedAtDesc(left: CreatedRecord, right: CreatedRecord) {
    const leftTime = left.created_at ? Date.parse(left.created_at) : 0;
    const rightTime = right.created_at ? Date.parse(right.created_at) : 0;
    return rightTime - leftTime || right.id - left.id;
}

export function sortUsers<T extends User>(items: T[]) {
    return [...items].sort(compareByCreatedAtDesc);
}

export function sortCars<T extends Car>(items: T[]) {
    return [...items].sort(compareByCreatedAtDesc);
}

export function sortCards<T extends RoadCard>(items: T[]) {
    return [...items].sort(compareByCreatedAtDesc);
}

export function sortRoutes<T extends RouteTemplate>(items: T[]) {
    return [...items].sort(compareByCreatedAtDesc);
}

export function displayName(user: User | null) {
    return user ? `${user.name} ${user.last_name}`.trim() || user.email : 'Użytkownik';
}

export function formatDate(value: string) {
    if (!value) return '—';
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}.${month}.${year}` : value;
}

export function carName(cars: Car[], id: number | null | undefined) {
    if (id === null || id === undefined) return 'Pojazd nieprzypisany';
    return cars.find((car) => car.id === id)?.registration_number || `Pojazd #${id}`;
}

export function isAdministrator(user: User | null) {
    return user?.role === 'administrator';
}

export function getSessionUserEmail() {
    const stored = sessionStorage.getItem('road-card-email');
    if (stored) return stored.toLowerCase();

    const token = sessionStorage.getItem('road-card-token');
    if (!token) return '';

    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return typeof payload.sub === 'string' ? payload.sub.toLowerCase() : '';
    } catch {
        return '';
    }
}

export function createEmptyTrip(): TripDraft {
    const today = new Date().toISOString().slice(0, 10);
    return {
        id: crypto.randomUUID(),
        departureLocation: 'BAZA',
        intermediatePoints: '',
        arrivalLocation: '',
        departureDate: today,
        departureTime: '07:00',
        arrivalDate: today,
        arrivalTime: '08:00',
        initialOdometer: '',
        finalOdometer: '',
    };
}
