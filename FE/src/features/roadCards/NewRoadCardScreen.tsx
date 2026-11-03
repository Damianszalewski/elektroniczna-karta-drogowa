import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AppIcon, Field, Loading } from '../../components/ui';
import type { Car, RoadCard, RouteTemplate, TripDraft, User } from '../../types';
import { createEmptyTrip, formatDate } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/errors';
import './RoadCard.css'

type ScreenProps = {
    user: User | null;
    existingCard?: RoadCard;
    setError: (value: string) => void;
    setNotice: (value: string) => void;
    onFinished?: () => void;
};

export function NewRoadCardScreen({ user, existingCard, setError, setNotice, onFinished }: ScreenProps) {
    const [step, setStep] = useState(existingCard ? 2 : 1);
    const [cars, setCars] = useState<Car[]>([]);
    const [templates, setTemplates] = useState<RouteTemplate[]>([]);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [trips, setTrips] = useState<TripDraft[]>([]);
    const [editing, setEditing] = useState<TripDraft | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [latestOdometer, setLatestOdometer] = useState<number | null>(null);
    const [hasPreviousRecords, setHasPreviousRecords] = useState(false);
    const [odometerLoading, setOdometerLoading] = useState(false);

    useEffect(() => {
        Promise.all([api.cars(true), api.templates()])
            .then(([carData, templateData]) => {
                const availableCars = carData.filter(
                    (car) => car.status === 'aktywny' || car.id === existingCard?.car_id,
                );
                setCars(availableCars);
                setTemplates(templateData);
                setSelectedCar(availableCars.find((car) => car.id === existingCard?.car_id) ?? availableCars[0] ?? null);
                if (existingCard) setTrips(existingCard.trips.map(toDraft));
            })
            .catch((cause) =>
                setError(getErrorMessage(cause, 'Nie udało się pobrać danych formularza.')),
            )
            .finally(() => setLoading(false));
    }, [existingCard, setError]);

    useEffect(() => {
        if (!selectedCar || existingCard) return;
        setOdometerLoading(true);
        api.latestOdometer(selectedCar.id)
            .then((result) => {
                setLatestOdometer(result.odometer);
                setHasPreviousRecords(result.has_records);
            })
            .catch((cause) =>
                setError(getErrorMessage(cause, 'Nie udało się pobrać ostatniego licznika.')),
            )
            .finally(() => setOdometerLoading(false));
    }, [selectedCar?.id, existingCard, setError]);

    const addTrip = () => {
        const previous = trips[trips.length - 1];
        setEditing({
            ...createEmptyTrip(),
            initialOdometer: previous?.finalOdometer || (latestOdometer !== null ? String(latestOdometer) : ''),
        });
    };

    const saveTrip = (trip: TripDraft) => {
        if (!trip.initialOdometer || !trip.finalOdometer) return setError('Uzupełnij licznik start i licznik koniec.');
        if (Number(trip.finalOdometer) < Number(trip.initialOdometer))
            return setError('Licznik końcowy nie może być niższy od licznika start.');
        const index = trips.findIndex((item) => item.id === trip.id);
        const previous = index >= 0 ? trips[index - 1] : trips[trips.length - 1];
        const normalized = {
            ...trip,
            initialOdometer: previous
                ? previous.finalOdometer
                : !existingCard && latestOdometer !== null
                  ? String(latestOdometer)
                  : trip.initialOdometer,
        };
        setTrips((current) => [...current.filter((item) => item.id !== trip.id), normalized]);
        setEditing(null);
    };

    const editingIndex = editing ? trips.findIndex((item) => item.id === editing.id) : -1;
    const startLocked = Boolean(
        editing &&
        (existingCard ||
            editingIndex > 0 ||
            (editingIndex === 0 && hasPreviousRecords) ||
            (editingIndex === -1 && trips.length > 0)),
    );

    const persist = async () => {
        if (!user?.id || !selectedCar || !trips.length)
            return setError('Wybierz pojazd i dodaj co najmniej jeden kurs.');
        if (trips.some((trip) => !trip.arrivalLocation || !trip.initialOdometer || !trip.finalOdometer))
            return setError('Uzupełnij dane wszystkich kursów.');
        if (trips.some((trip) => Number(trip.finalOdometer) < Number(trip.initialOdometer)))
            return setError('Licznik końcowy nie może być niższy od licznika start.');
        setSaving(true);
        setError('');
        const payload = { car_id: selectedCar.id, driver_id: user.id, trips: trips.map(toPayload) };
        try {
            if (existingCard) await api.updateCard(existingCard.id, payload);
            else await api.createCard(payload);
            setNotice(existingCard ? 'Karta drogowa została zaktualizowana.' : 'Karta drogowa została zapisana.');
            if (onFinished) onFinished();
            else {
                setStep(1);
                setTrips([]);
                setEditing(null);
            }
        } catch (cause) {
            setError(getErrorMessage(cause, 'Nie udało się zapisać karty drogowej.'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading />;
    return (
        <section className="page-section">
            <div className="page-heading compact">
                <div>
                    <p className="eyebrow">{existingCard ? 'EDYCJA KARTY DROGOWEJ' : 'NOWA KARTA DROGOWA'}</p>
                    <h1>
                        {existingCard ? 'Edytuj kartę' : 'Karta drogowa'}{' '}
                        <span>SM / {existingCard?.id ?? new Date().getFullYear()}</span>
                    </h1>
                </div>
                <div className="step-label">KROK {step} Z 2</div>
            </div>
            <div className="steps">
                <div className={step >= 1 ? 'step active' : 'step'}>
                    <span>01</span> Pojazd
                </div>
                <div className={step >= 2 ? 'step active' : 'step'}>
                    <span>02</span> Kursy i liczniki
                </div>
            </div>
            {step === 1 ? (
                <VehicleStep
                    cars={cars}
                    selected={selectedCar}
                    onSelect={setSelectedCar}
                    onNext={() => (selectedCar ? setStep(2) : setError('Wybierz pojazd, aby przejść dalej.'))}
                />
            ) : (
                <TripsStep
                    trips={trips}
                    editing={editing}
                    templates={templates}
                    startOdometerLocked={startLocked || odometerLoading}
                    odometerLoading={odometerLoading}
                    onEdit={setEditing}
                    onAdd={addTrip}
                    onSaveTrip={saveTrip}
                    onBack={() => setStep(1)}
                    onSave={persist}
                    saving={saving}
                />
            )}
        </section>
    );
}

function toDraft(trip: RoadCard['trips'][number]): TripDraft {
    return {
        id: String(trip.id),
        departureLocation: trip.departure_location,
        intermediatePoints: trip.intermediate_points || '',
        arrivalLocation: trip.arrival_location,
        departureDate: trip.departure_date,
        departureTime: trip.departure_time,
        arrivalDate: trip.arrival_date,
        arrivalTime: trip.arrival_time,
        initialOdometer: String(trip.initial_odometer),
        finalOdometer: String(trip.final_odometer),
    };
}

function toPayload(trip: TripDraft) {
    return {
        departure_location: trip.departureLocation,
        intermediate_points: trip.intermediatePoints,
        arrival_location: trip.arrivalLocation,
        departure_date: trip.departureDate,
        departure_time: trip.departureTime,
        arrival_date: trip.arrivalDate,
        arrival_time: trip.arrivalTime,
        initial_odometer: Number(trip.initialOdometer),
        final_odometer: Number(trip.finalOdometer),
        trip_departure_odometer: Number(trip.initialOdometer),
        trip_arrival_odometer: Number(trip.finalOdometer),
        route_start_date: trip.departureDate,
        route_end_date: trip.arrivalDate,
        route_settlement_time: `${trip.arrivalDate} ${trip.arrivalTime}`,
    };
}

function VehicleStep({
    cars,
    selected,
    onSelect,
    onNext,
}: {
    cars: Car[];
    selected: Car | null;
    onSelect: (car: Car) => void;
    onNext: () => void;
}) {
    return (
        <div className="form-layout">
            <div className="form-card">
                <div className="card-title">
                    <span>01</span>
                    <div>
                        <b>Wybór pojazdu</b>
                        <small>Wskaż pojazd przypisany do karty</small>
                    </div>
                </div>
                {cars.length ? (
                    <div className="vehicle-list">
                        {cars.map((car) => (
                            <button
                                type="button"
                                key={car.id}
                                className={selected?.id === car.id ? 'vehicle-option selected' : 'vehicle-option'}
                                onClick={() => onSelect(car)}
                            >
                                <span className="vehicle-icon"><AppIcon name="car" /></span>
                                <span>
                                    <b>{car.registration_number}</b>
                                    <small>
                                        {car.car_type} · {car.fuel} · {car.car_engine_capacity} l
                                    </small>
                                </span>
                                <span className="radio">{selected?.id === car.id ? '●' : '○'}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div>▱</div>
                        <b>Brak pojazdów w bazie</b>
                        <p>Dodaj pojazd w module „Pojazdy”.</p>
                    </div>
                )}
            </div>
            <div className="form-side">
                <div className="tip-card">
                    <span>Wskazówka</span>
                    <p>Wybrany pojazd zostanie przypisany do wszystkich kursów tej karty.</p>
                </div>
                <button className="button primary wide" disabled={!selected} onClick={onNext}>
                    PRZEJDŹ DALEJ <span>→</span>
                </button>
            </div>
        </div>
    );
}

function TripsStep({
    trips,
    editing,
    templates,
    startOdometerLocked,
    odometerLoading,
    onEdit,
    onAdd,
    onSaveTrip,
    onBack,
    onSave,
    saving,
}: {
    trips: TripDraft[];
    editing: TripDraft | null;
    templates: RouteTemplate[];
    startOdometerLocked: boolean;
    odometerLoading: boolean;
    onEdit: (trip: TripDraft | null) => void;
    onAdd: () => void;
    onSaveTrip: (trip: TripDraft) => void;
    onBack: () => void;
    onSave: () => void;
    saving: boolean;
}) {
    return (
        <div className="trips-layout">
            <div className="trips-main">
                <div className="section-toolbar">
                    <div>
                        <h2>Trasa i liczniki</h2>
                        <p className="muted">Dodaj jeden lub więcej kursów do karty.</p>
                    </div>
                    <button className="button secondary" disabled={odometerLoading} onClick={onAdd}>
                        {odometerLoading ? 'POBIERANIE LICZNIKA…' : '＋ DODAJ KURS'}
                    </button>
                </div>
                {trips.length === 0 && !editing && (
                    <div className="empty-state large">
                        <div>↗</div>
                        <b>Nie dodano jeszcze żadnego kursu</b>
                        <p>Dodaj pierwszy kurs, aby uzupełnić trasę i odczyty licznika.</p>
                        <button className="button outline" disabled={odometerLoading} onClick={onAdd}>
                            DODAJ PIERWSZY KURS
                        </button>
                    </div>
                )}
                {trips.map((trip, index) => (
                    <div className="trip-row" key={trip.id}>
                        <div className="trip-index">{String(index + 1).padStart(2, '0')}</div>
                        <div>
                            <b>
                                {trip.departureLocation} <span>→</span> {trip.arrivalLocation || 'Nieuzupełniony cel'}
                            </b>
                            <small>
                                {formatDate(trip.departureDate)} {trip.departureTime} · licznik{' '}
                                {trip.initialOdometer || '—'} → {trip.finalOdometer || '—'}
                            </small>
                        </div>
                        <button className="icon-button mint" onClick={() => onEdit(trip)}>
                            ✎
                        </button>
                    </div>
                ))}
                {editing && (
                    <TripEditor
                        initial={editing}
                        templates={templates}
                        startOdometerLocked={startOdometerLocked}
                        onCancel={() => onEdit(null)}
                        onSave={onSaveTrip}
                    />
                )}
            </div>
            <div className="trips-actions">
                <button className="button outline" onClick={onBack}>
                    ← WSTECZ
                </button>
                <button className="button primary" disabled={saving || !trips.length} onClick={onSave}>
                    {saving ? 'ZAPISYWANIE…' : 'ZAPISZ KARTĘ'}
                </button>
            </div>
        </div>
    );
}

function TripEditor({
    initial,
    templates,
    startOdometerLocked,
    onCancel,
    onSave,
}: {
    initial: TripDraft;
    templates: RouteTemplate[];
    startOdometerLocked: boolean;
    onCancel: () => void;
    onSave: (trip: TripDraft) => void;
}) {
    const [trip, setTrip] = useState(initial);
    const [templateId, setTemplateId] = useState('');
    const set = (key: keyof TripDraft, value: string) => setTrip((current) => ({ ...current, [key]: value }));
    const selectTemplate = (id: string) => {
        setTemplateId(id);
        const template = templates.find((item) => String(item.id) === id);
        if (template)
            setTrip((current) => ({
                ...current,
                departureLocation: template.departure_location,
                intermediatePoints: template.points.join(', '),
                arrivalLocation: template.arrival_location,
            }));
    };
    const invalid = Boolean(
        trip.initialOdometer && trip.finalOdometer && Number(trip.finalOdometer) < Number(trip.initialOdometer),
    );
    return (
        <form
            className="editor-card"
            onSubmit={(event) => {
                event.preventDefault();
                if (!invalid) onSave(trip);
            }}
        >
            <div className="editor-title">
                <div>
                    <span className="card-kicker">EDYCJA KURSU</span>
                    <h3>Dodawanie nowego kursu</h3>
                </div>
                <button type="button" className="icon-button" onClick={onCancel}>
                    ×
                </button>
            </div>
            <div className="route-preset">
                <Field label="Gotowa trasa (opcjonalnie)">
                    <select value={templateId} onChange={(event) => selectTemplate(event.target.value)}>
                        <option value="">Wpisz trasę ręcznie</option>
                        {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                </Field>
                <small>Wybór uzupełni odjazd, punkty i przyjazd. Wszystkie pola pozostają edytowalne.</small>
            </div>
            <div className="field-grid">
                <Field label="Odjazd z">
                    <input
                        value={trip.departureLocation}
                        onChange={(event) => set('departureLocation', event.target.value)}
                        placeholder="Wprowadź miejsce odjazdu"
                        required
                    />
                </Field>
                <Field label="Przyjazd do">
                    <input
                        value={trip.arrivalLocation}
                        onChange={(event) => set('arrivalLocation', event.target.value)}
                        placeholder="Wprowadź miejsce przyjazdu"
                        required
                    />
                </Field>
                <Field label="Punkty pośrednie">
                    <input
                        value={trip.intermediatePoints}
                        onChange={(event) => set('intermediatePoints', event.target.value)}
                        placeholder="Wprowadź punkty pośrednie"
                    />
                </Field>
                <div className="field-spacer" />
                <Field label="Data wyjazdu">
                    <input
                        type="date"
                        value={trip.departureDate}
                        onChange={(event) => set('departureDate', event.target.value)}
                        required
                    />
                </Field>
                <Field label="Godz. wyjazdu">
                    <input
                        type="time"
                        value={trip.departureTime}
                        onChange={(event) => set('departureTime', event.target.value)}
                        required
                    />
                </Field>
                <Field label="Data przyjazdu">
                    <input
                        type="date"
                        value={trip.arrivalDate}
                        onChange={(event) => set('arrivalDate', event.target.value)}
                        required
                    />
                </Field>
                <Field label="Godz. przyjazdu">
                    <input
                        type="time"
                        value={trip.arrivalTime}
                        onChange={(event) => set('arrivalTime', event.target.value)}
                        required
                    />
                </Field>
                <Field label="Licznik start">
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={trip.initialOdometer}
                        onChange={(event) => set('initialOdometer', event.target.value)}
                        placeholder="Wprowadź stan licznika początkowego"
                        required
                        disabled={startOdometerLocked}
                    />
                    {startOdometerLocked && (
                        <small className="field-hint">Ustalany automatycznie z ostatniego odczytu pojazdu.</small>
                    )}
                </Field>
                <Field label="Licznik koniec">
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={trip.finalOdometer}
                        onChange={(event) => set('finalOdometer', event.target.value)}
                        placeholder="Wprowadź stan licznika końcowego"
                        required
                    />
                    {invalid && (
                        <small className="field-hint error-hint">Musi być większy lub równy licznikowi start.</small>
                    )}
                </Field>
            </div>
            <div className="editor-footer">
                <span className={invalid ? 'distance invalid' : 'distance'}>
                    PRZEBIEG:{' '}
                    <b>
                        {trip.initialOdometer && trip.finalOdometer
                            ? `${Number(trip.finalOdometer) - Number(trip.initialOdometer)} km`
                            : '—'}
                    </b>
                </span>
                <button type="submit" className="button secondary" disabled={invalid}>
                    ZAPISZ KURS
                </button>
            </div>
        </form>
    );
}
