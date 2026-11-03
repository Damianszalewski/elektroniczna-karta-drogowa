export type UserRole = 'kierowca' | 'logistyka' | 'administrator';

export type User = {
    id: number;
    created_at?: string | null;
    email: string;
    password?: string;
    name: string;
    last_name: string;
    role: UserRole;
};

export type Car = {
    id: number;
    created_at?: string | null;
    registration_number: string;
    car_type: string;
    fuel: string;
    when_date?: string | null;
    car_engine_capacity: number;
    status: 'aktywny' | 'wycofany';
};

export type RouteTemplate = {
    id: number;
    created_at?: string | null;
    name: string;
    departure_location: string;
    arrival_location: string;
    points: string[];
    description: string;
};

export type Trip = {
    id: number;
    departure_location: string;
    intermediate_points: string;
    arrival_location: string;
    departure_date: string;
    departure_time: string;
    arrival_date: string;
    arrival_time: string;
    initial_odometer: number;
    final_odometer: number;
    trip_departure_odometer: number;
    trip_arrival_odometer: number;
    route_start_date: string;
    route_end_date: string;
    route_settlement_time: string;
};

export type RoadCard = {
    id: number;
    created_at?: string | null;
    car_id: number | null;
    driver_id: number | null;
    trips: Trip[];
};

export type TripDraft = {
    id: string;
    departureLocation: string;
    intermediatePoints: string;
    arrivalLocation: string;
    departureDate: string;
    departureTime: string;
    arrivalDate: string;
    arrivalTime: string;
    initialOdometer: string;
    finalOdometer: string;
};

export type Screen =
    | 'login'
    | 'menu'
    | 'new-card'
    | 'edit-card'
    | 'archive'
    | 'print-card'
    | 'password'
    | 'vehicles'
    | 'routes'
    | 'users';
