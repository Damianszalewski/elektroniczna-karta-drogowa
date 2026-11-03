import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { AppIcon, ConfirmModal, Loading, Pagination, TrashIcon } from '../../components/ui';
import type { Car, RoadCard, User } from '../../types';
import { carName, formatDate, sortCards } from '../../utils/formatters';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';
import { usePagination } from '../../hooks/usePagination';
import { getErrorMessage } from '../../utils/errors';
import './ArchiveScreen.css'

type Props = {
    user: User | null;
    setError: (value: string) => void;
    onEdit: (card: RoadCard) => void;
    onPrint: (card: RoadCard, car: Car | null) => void;
};

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1).padStart(2, '0'),
    label: new Intl.DateTimeFormat('pl-PL', { month: 'long' }).format(new Date(2024, index, 1)),
}));

export function ArchiveScreen({ user, setError, onEdit, onPrint }: Props) {
    const [cards, setCards] = useState<RoadCard[]>([]);
    const [cars, setCars] = useState<Car[]>([]);
    const [query, setQuery] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const driverId = user?.role === 'kierowca' ? user.id : undefined;

    useEffect(() => {
        Promise.all([api.cards(driverId), api.cars(true)])
            .then(([cardData, carData]) => {
                setCards(cardData);
                setCars(carData);
            })
            .catch((cause) => setError(getErrorMessage(cause, 'Nie udało się pobrać archiwum.')))
            .finally(() => setLoading(false));
    }, [driverId, setError]);

    const availableYears = useMemo(
        () =>
            Array.from(
                new Set(
                    cards
                        .map((card) => card.trips[0]?.departure_date?.slice(0, 4))
                        .filter((year): year is string => Boolean(year)),
                ),
            ).sort((left, right) => Number(right) - Number(left)),
        [cards],
    );

    const filtered = useMemo(
        () =>
            sortCards(
                cards.filter((card) => {
                    const firstTripDate = card.trips[0]?.departure_date || '';
                    const matchesYear = !yearFilter || firstTripDate.startsWith(`${yearFilter}-`);
                    const matchesMonth = !monthFilter || firstTripDate.slice(5, 7) === monthFilter;
                    const matchesQuery = `${card.id} ${card.trips.map((trip) => `${trip.departure_location} ${trip.arrival_location} ${trip.departure_date}`).join(' ')} ${carName(cars, card.car_id)}`
                        .toLowerCase()
                        .includes(query.toLowerCase());
                    return matchesYear && matchesMonth && matchesQuery;
                }),
            ),
        [cards, cars, query, yearFilter, monthFilter],
    );
    const { currentPage, pageCount, visibleItems: visibleCards, setPage } = usePagination(filtered, {
        resetKey: `${query}|${yearFilter}|${monthFilter}`,
    });
    const distance = (card: RoadCard) =>
        card.trips.reduce((sum, trip) => sum + Math.max(0, trip.final_odometer - trip.initial_odometer), 0);

    const { deleteTarget, deleting, requestDelete, confirmDelete, cancelDelete } = useDeleteConfirmation(
        async (card: RoadCard) => {
            await api.deleteCard(card.id);
            setCards((items) => items.filter((item) => item.id !== card.id));
        },
        (cause) => setError(getErrorMessage(cause, 'Nie udało się usunąć karty.')),
    );

    return (
        <section className="page-section">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">DOKUMENTACJA</p>
                    <h1>Archiwum kart drogowych</h1>
                    <p className="muted">Jedna karta może zawierać wiele kursów.</p>
                </div>
                <div className="count-chip">
                    {cards.length} <span>kart</span>
                </div>
            </div>
            <div className="archive-toolbar">
                <div className="archive-control">
                    <span className="archive-control-label">WYSZUKIWANIE</span>
                    <div className="search-field">
                        <span>⌕</span>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Numer karty, data, trasa lub pojazd…"
                        />
                    </div>
                </div>
                <label className="archive-control">
                    <span className="archive-control-label">ROK</span>
                    <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                        <option value="">Wszystkie lata</option>
                        {availableYears.map((year) => (
                            <option value={year} key={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="archive-control">
                    <span className="archive-control-label">MIESIĄC</span>
                    <select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
                        <option value="">Wszystkie miesiące</option>
                        {MONTHS.map((month) => (
                            <option value={month.value} key={month.value}>
                                {month.label}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    className="archive-filter-clear"
                    type="button"
                    disabled={!yearFilter && !monthFilter}
                    onClick={() => {
                        setYearFilter('');
                        setMonthFilter('');
                    }}
                >
                    WYCZYŚĆ
                </button>
            </div>
            {loading ? (
                <Loading />
            ) : filtered.length === 0 ? (
                <div className="empty-state large">
                    <div>▤</div>
                    <b>{query || yearFilter || monthFilter ? 'Brak wyników dla wybranych filtrów' : 'Archiwum jest puste'}</b>
                    <p>
                        {query || yearFilter || monthFilter
                            ? 'Zmień rok, miesiąc lub frazę wyszukiwania.'
                            : 'Zapisane karty pojawią się tutaj po ukończeniu formularza.'}
                    </p>
                </div>
            ) : (
                <div className="archive-table">
                    <div className="table-head">
                        <span>KARTA / DATA</span>
                        <span>POJAZD</span>
                        <span>KURSY / TRASA</span>
                        <span>PRZEBIEG</span>
                        <span>AKCJE</span>
                    </div>
                    {visibleCards.map((card) => {
                        const first = card.trips[0];
                        const last = card.trips[card.trips.length - 1];
                        return (
                            <div className="table-row" key={card.id}>
                                <div>
                                    <b>SM / {card.id}</b>
                                    <small>{formatDate(first?.departure_date || '')}</small>
                                </div>
                                <div>
                                    <b>{carName(cars, card.car_id)}</b>
                                    <small>pojazd z bazy</small>
                                </div>
                                <div>
                                    <b>
                                        {card.trips.length} {card.trips.length === 1 ? 'kurs' : 'kursy'}
                                    </b>
                                    <small>
                                        {first?.departure_location || '—'} → {last?.arrival_location || '—'}
                                    </small>
                                </div>
                                <div>
                                    <b>{distance(card)} km</b>
                                    <small>
                                        {first?.initial_odometer ?? '—'} → {last?.final_odometer ?? '—'}
                                    </small>
                                </div>
                                <div className="row-actions">
                                    <button
                                        className="icon-button mint"
                                        title="Edytuj kartę"
                                        onClick={() => onEdit(card)}
                                    >
                                        ✎
                                    </button>
                                    <button
                                        className="icon-button print-action"
                                        title="Otwórz podgląd karty"
                                        onClick={() =>
                                            onPrint(card, cars.find((car) => car.id === card.car_id) ?? null)
                                        }
                                    >
                                        <AppIcon name="eye" />
                                    </button>
                                    <button
                                        className="icon-button danger"
                                        title="Usuń kartę"
                                        onClick={() => requestDelete(card)}
                                    >
                                            <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {!loading && filtered.length > 0 && (
                <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
            )}
            {deleteTarget && (
                <ConfirmModal
                    message="Czy na pewno chcesz usunąć całą kartę wraz ze wszystkimi kursami?"
                    busy={deleting}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </section>
    );
}
