import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { AppIcon, ConfirmModal, Field, Loading, Pagination, TrashIcon } from '../../components/ui';
import type { Car } from '../../types';
import { sortCars } from '../../utils/formatters';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';
import { usePagination } from '../../hooks/usePagination';
import { getErrorMessage } from '../../utils/errors';
import './VehiclesScreen.css'

type CarForm = {
    registration_number: string;
    car_type: string;
    fuel: string;
    when_date: string;
    car_engine_capacity: string;
};
const emptyForm = (): CarForm => ({
    registration_number: '',
    car_type: '',
    fuel: 'ON',
    when_date: '',
    car_engine_capacity: '',
});
type Props = { setError: (value: string) => void; setNotice: (value: string) => void };

export function VehiclesScreen({ setError, setNotice }: Props) {
    const [cars, setCars] = useState<Car[]>([]);
    const [form, setForm] = useState(emptyForm());
    const [editingId, setEditingId] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const load = () =>
        api
            .cars(true)
            .then(setCars)
            .catch((cause) => setError(getErrorMessage(cause, 'Nie udało się pobrać pojazdów.')));
    useEffect(() => {
        load().finally(() => setLoading(false));
    }, []);
    const filtered = useMemo(
        () =>
            sortCars(
                cars.filter((car) =>
                    `${car.registration_number} ${car.car_type} ${car.fuel}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                ),
            ),
        [cars, query],
    );
    const { currentPage, pageCount, visibleItems: visibleCars, setPage } = usePagination(filtered, {
        resetKey: query,
    });
    const set = (key: keyof CarForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
    const reset = () => {
        setForm(emptyForm());
        setEditingId(null);
    };
    const edit = (car: Car) => {
        setEditingId(car.id);
        setForm({
            registration_number: car.registration_number,
            car_type: car.car_type,
            fuel: car.fuel,
            when_date: car.when_date || '',
            car_engine_capacity: String(car.car_engine_capacity),
        });
    };
    const submit = async (event: FormEvent) => {
        event.preventDefault();
        const capacity = Number(form.car_engine_capacity);
        if (!form.registration_number || !form.car_type || !Number.isFinite(capacity) || capacity < 0)
            return setError('Uzupełnij wymagane pola pojazdu.');
        setSaving(true);
        const payload = {
            registration_number: form.registration_number.trim().toUpperCase(),
            car_type: form.car_type.trim(),
            fuel: form.fuel.trim(),
            when_date: form.when_date || null,
            car_engine_capacity: capacity,
            status: editingId ? cars.find((car) => car.id === editingId)?.status ?? 'aktywny' : 'aktywny',
        };
        try {
            if (editingId) await api.updateCar(editingId, payload);
            else await api.createCar(payload);
            await load();
            const wasEditing = Boolean(editingId);
            reset();
            setNotice(wasEditing ? 'Pojazd został zaktualizowany.' : 'Pojazd został dodany.');
        } catch (cause) {
            setError(getErrorMessage(cause, 'Nie udało się zapisać pojazdu.'));
        } finally {
            setSaving(false);
        }
    };
    const { deleteTarget, deleting, requestDelete, confirmDelete, cancelDelete } = useDeleteConfirmation(
        async (car: Car) => {
            await api.deleteCar(car.id);
            setCars((items) => items.map((item) => item.id === car.id ? { ...item, status: 'wycofany' } : item));
            setNotice('Pojazd został wycofany z użytkowania.');
        },
        (cause) => setError(getErrorMessage(cause, 'Nie udało się usunąć pojazdu.')),
    );
    return (
        <section className="page-section">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">FLOTA</p>
                    <h1>Pojazdy</h1>
                    <p className="muted">Zarządzaj pojazdami dostępnymi przy tworzeniu kart drogowych.</p>
                </div>
                <div className="count-chip">
                    {cars.length} <span>pojazdów</span>
                </div>
            </div>
            <div className="vehicles-layout">
                <form className="vehicle-form form-card" onSubmit={submit}>
                    <div className="editor-title">
                        <div>
                            <span className="card-kicker">{editingId ? 'EDYCJA POJAZDU' : 'NOWY POJAZD'}</span>
                            <h3>{editingId ? 'Aktualizuj dane' : 'Dodaj pojazd'}</h3>
                        </div>
                        {editingId && (
                            <button type="button" className="icon-button" onClick={reset}>
                                ×
                            </button>
                        )}
                    </div>
                    <Field label="Numer rejestracyjny">
                        <input
                            value={form.registration_number}
                            onChange={(event) => set('registration_number', event.target.value)}
                            placeholder="Wprowadź numer rejestracyjny"
                            required
                        />
                    </Field>
                    <Field label="Marka i typ">
                        <input
                            value={form.car_type}
                            onChange={(event) => set('car_type', event.target.value)}
                            placeholder="Wprowadź markę i typ pojazdu"
                            required
                        />
                    </Field>
                    <div className="field-grid">
                        <Field label="Rodzaj paliwa">
                            <select value={form.fuel} onChange={(event) => set('fuel', event.target.value)}>
                                <option>ON</option>
                                <option>PB</option>
                                <option>LPG</option>
                                <option>ELEKTRYCZNY</option>
                                <option>HYBRYDA</option>
                            </select>
                        </Field>
                        <Field label="Pojemność silnika (l)">
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={form.car_engine_capacity}
                                onChange={(event) => set('car_engine_capacity', event.target.value)}
                                placeholder="Wprowadź pojemność silnika"
                                required
                            />
                        </Field>
                    </div>
                    <Field label="Data wpisania do ewidencji">
                        <input
                            type="date"
                            value={form.when_date}
                            onChange={(event) => set('when_date', event.target.value)}
                        />
                    </Field>
                    <div className="form-actions vehicle-form-actions">
                        <button type="button" className="button outline" onClick={reset}>
                            WYCZYŚĆ
                        </button>
                        <button className="button primary" disabled={saving}>
                            {saving ? 'ZAPISYWANIE…' : editingId ? 'ZAPISZ ZMIANY' : 'DODAJ POJAZD'}
                        </button>
                    </div>
                </form>
                <div className="vehicles-list">
                    <div className="section-toolbar">
                        <div>
                            <h2>Lista pojazdów</h2>
                            <p className="muted">Pojazdy są pobierane bezpośrednio z `/cars/`.</p>
                        </div>
                    </div>
                    <div className="search-field vehicle-search">
                        <span>⌕</span>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Szukaj po rejestracji, marce lub paliwie…"
                        />
                    </div>
                    {loading ? (
                        <Loading />
                    ) : filtered.length === 0 ? (
                        <div className="empty-state large">
                            <div>▣</div>
                            <b>{query ? 'Brak wyników wyszukiwania' : 'Brak pojazdów'}</b>
                            <p>Dodaj pierwszy pojazd za pomocą formularza.</p>
                        </div>
                    ) : (
                        <>
                            <div className="vehicle-table">
                            {visibleCars.map((car) => (
                                <div className={`vehicle-table-row ${car.status === 'wycofany' ? 'retired' : ''}`} key={car.id}>
                                    <div className="vehicle-table-icon">
                                        <AppIcon name="car" />
                                    </div>
                                    <div>
                                        <b>{car.registration_number}</b>
                                        <small>{car.car_type} · {car.status === 'wycofany' ? 'Wycofany' : 'Aktywny'}</small>
                                    </div>
                                    <div>
                                        <b>{car.fuel}</b>
                                        <small>Paliwo</small>
                                    </div>
                                    <div>
                                        <b>{car.car_engine_capacity} l</b>
                                        <small>Pojemność</small>
                                    </div>
                                    <div className="row-actions">
                                        <button className="icon-button mint" onClick={() => edit(car)}>
                                            ✎
                                        </button>
                                        <button
                                            className="icon-button danger"
                                            onClick={() => requestDelete(car)}
                                            disabled={car.status === 'wycofany'}
                                            title={car.status === 'wycofany' ? 'Pojazd jest już wycofany' : 'Wycofaj pojazd'}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            </div>
                            <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
                        </>
                    )}
                </div>
            </div>
            {deleteTarget && (
                <ConfirmModal
                    message={`Czy na pewno chcesz wycofać pojazd ${deleteTarget.registration_number}? Zostanie zachowany w historii kart.`}
                    busy={deleting}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </section>
    );
}
