import type { Car, RoadCard, User } from '../../types';
import { displayName, formatDate } from '../../utils/formatters';
import './PrintRoadCardScreen.css'

type Props = { card: RoadCard; car: Car | null; user: User | null; onBack: () => void };
const text = (value: string | number | undefined | null) =>
    value === undefined || value === null || value === '' ? '—' : String(value);

export function PrintRoadCardScreen({ card, car, user, onBack }: Props) {
    return (
        <section className="print-view source-print-view">
            <div className="print-toolbar">
                <div>
                    <p className="eyebrow">DOKUMENT KARTY DROGOWEJ</p>
                    <h1>Drukowanie karty SM / {card.id}</h1>
                    <p className="muted">Podgląd karty drogowej przed wydrukiem lub zapisaniem do PDF.</p>
                </div>
                <div className="print-toolbar-actions">
                    <button className="button outline" onClick={onBack}>
                        ← WRÓĆ DO ARCHIWUM
                    </button>
                    <button className="button primary" onClick={() => window.print()}>
                        DRUKUJ / ZAPISZ PDF
                    </button>
                </div>
            </div>
            <div className="print-document source-document">
                <SourceCardPage card={card} car={car} user={user} />
                <RouteListPage card={card} car={car} user={user} />
            </div>
        </section>
    );
}

function SourceCardPage({ card, car, user }: { card: RoadCard; car: Car | null; user: User | null }) {
    const first = card.trips[0];
    const last = card.trips[card.trips.length - 1];
    const distance = card.trips.reduce(
        (sum, trip) => sum + Math.max(0, trip.final_odometer - trip.initial_odometer),
        0,
    );
    return (
        <article className="source-card source-first-page">
            <div className="source-top">
                <div className="source-seal">
                    <span>Pieczęć jednostki organizacyjnej</span>
                </div>
                <div className="source-card-id">
                    <h2>KARTA DROGOWA</h2>
                    <div>
                        <label>Nr</label>
                        <b>SM / {card.id}</b>
                    </div>
                    <div>
                        <label>Data</label>
                        <b>{formatDate(first?.departure_date || '')}</b>
                    </div>
                </div>
                <VehicleBlock car={car} />
            </div>
            <div className="source-main">
                <div className="source-main-left">
                    <WorkBlock first={first} last={last} user={user} />
                    <div className="source-check">
                        <span>Pojazd sprawny do wyjazdu</span>
                        <b>☐ TAK &nbsp;&nbsp; ☐ NIE</b>
                        <small>Podpis Kierowcy ____________________</small>
                    </div>
                    <div className="source-orders">
                        <div>
                            <span>Zleca wyjazd</span>
                            <b>________________</b>
                            <small>Podpis</small>
                        </div>
                        <div>
                            <span>Stwierdza przyjazd</span>
                            <b>________________</b>
                            <small>Podpis</small>
                        </div>
                    </div>
                    <table className="source-trip-table">
                        <thead>
                            <tr>
                                <th>Etap</th>
                                <th>Data</th>
                                <th>Godzina</th>
                                <th>Stan Licznika</th>
                                <th>Trasa</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th>Wyjazd</th>
                                <td>{formatDate(first?.departure_date || '')}</td>
                                <td>{text(first?.departure_time)}</td>
                                <td>{text(first?.initial_odometer)}</td>
                                <td>
                                    {text(first?.departure_location)} → {text(first?.arrival_location)}
                                </td>
                            </tr>
                            <tr>
                                <th>Powrót</th>
                                <td>{formatDate(last?.arrival_date || '')}</td>
                                <td>{text(last?.arrival_time)}</td>
                                <td>{text(last?.final_odometer)}</td>
                                <td>{text(last?.arrival_location)}</td>
                            </tr>
                            <tr>
                                <th>Wynik</th>
                                <td colSpan={2}>czas pracy godz-min ________</td>
                                <td>{distance} km</td>
                                <td>{card.trips.length} kursów</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="source-main-right">
                    <div className="source-control">
                        <h3>Kontrola drogowa</h3>
                        <span />
                        <span />
                        <span />
                    </div>
                    <div className="source-issued">
                        <h3>Podpis wystawiającego kartę</h3>
                        <span />
                    </div>
                    <div className="source-standard">
                        <h3>Norma zużycia paliwa na 100km przebiegu</h3>
                    </div>
                </div>
            </div>
            <FuelBlock />
            <div className="source-signatures">
                <div>Podpis Kierowcy</div>
                <div>Wynik obliczył</div>
                <div>Podpis kontr. wynik</div>
            </div>
            <p className="source-footnote">
                Karta drogowa została wygenerowana elektronicznie. Szczegółowa ewidencja wszystkich kursów znajduje się
                na stronie 2.
            </p>
        </article>
    );
}

function VehicleBlock({ car }: { car: Car | null }) {
    return (
        <div className="source-car">
            <div>
                <span>Samochód osobowy</span>
                <b>{text(car?.registration_number)}</b>
            </div>
            <div>
                <span>Marka i typ</span>
                <b>{text(car?.car_type)}</b>
                <span>Pojemność cylindrów</span>
                <b>{text(car?.car_engine_capacity)}</b>
            </div>
            <div>
                <span>Rodzaj paliwa</span>
                <b>{text(car?.fuel)}</b>
                <span>Rodzaj nadwozia</span>
                <b>—</b>
            </div>
            <div>
                <span>Grupa</span>
                <b>—</b>
                <span>Numer inwen.</span>
                <b>—</b>
            </div>
            <div>
                <span>Miejsce garażowania</span>
                <b>—</b>
            </div>
        </div>
    );
}

function WorkBlock({
    first,
    last,
    user,
}: {
    first: RoadCard['trips'][number] | undefined;
    last: RoadCard['trips'][number] | undefined;
    user: User | null;
}) {
    return (
        <div className="source-work-row">
            <div className="source-driver">
                <span>Imię i Nazwisko Kierowcy</span>
                <b>{displayName(user)}</b>
            </div>
            <div className="source-hours">
                <span>Godzina</span>
                <div>
                    <small>roz. pracy</small>
                    <small>zak. pracy</small>
                </div>
                <b>{text(first?.departure_time)}</b>
                <b>{text(last?.arrival_time)}</b>
            </div>
            <div className="source-work-count">
                <span>Ilość godzin pracy kierowcy</span>
                <b>—</b>
            </div>
            <div className="source-radius">
                <span>Promień wyjazdu</span>
                <b>—</b>
            </div>
        </div>
    );
}

function FuelBlock() {
    return (
        <div className="source-fuel">
            <div className="source-fuel-main">
                <h3>Paliwo</h3>
                <div className="source-fuel-head">
                    <span>Stan paliwa przy otrzymaniu karty</span>
                    <span>Gdzie</span>
                    <span>Nr kwitu</span>
                    <span>Ilość</span>
                    <span>Podpis wydającego</span>
                    <span>Stan paliwa przy zwrocie karty</span>
                </div>
                <div className="source-fuel-values">
                    <span>—</span>
                    <span>—</span>
                    <span>—</span>
                    <span>—</span>
                    <span>________________</span>
                    <span>—</span>
                </div>
                <div className="source-fuel-sign">
                    <span>Podpis ____________________________</span>
                    <span>Podpis __________</span>
                </div>
            </div>
            <div className="source-fuel-consumption">
                <h3>Zużycie Paliwa</h3>
                <div className="source-consumption-labels">
                    <span>
                        1<br />
                        <small>wg norm po uwzględnieniu poprawek</small>
                    </span>
                    <span>
                        2<br />
                        <small>rzeczywiste</small>
                    </span>
                    <span>
                        3<br />
                        <small>oszczędności</small>
                    </span>
                    <span>
                        4<br />
                        <small>przekroczenie</small>
                    </span>
                </div>
                <div className="source-consumption-empty" />
            </div>
        </div>
    );
}

function RouteListPage({ card, car, user }: { card: RoadCard; car: Car | null; user: User | null }) {
    return (
        <article className="source-card source-second-page">
            <div className="source-routes-title">
                <div>
                    <span>ELEKTRONICZNA KARTA DROGOWA</span>
                    <h2>EWIDENCJA TRAS I KURSÓW</h2>
                </div>
                <b>SM / {card.id}</b>
            </div>
            <div className="source-routes-meta">
                <span>
                    Kierowca <b>{displayName(user)}</b>
                </span>
                <span>
                    Pojazd <b>{text(car?.registration_number)}</b>
                </span>
                <span>
                    Kursów <b>{card.trips.length}</b>
                </span>
            </div>
            <table className="source-routes-table">
                <thead>
                    <tr>
                        <th>Numer</th>
                        <th>Nazwisko jadącego</th>
                        <th>Skąd - dokąd</th>
                        <th>Odjazd</th>
                        <th>Stan licznika przy wyjeździe</th>
                        <th>Przyjazd</th>
                        <th>Stan licznika przy powrocie</th>
                        <th>Przebieg</th>
                        <th>Podpis jadącego</th>
                        <th>Uwagi</th>
                    </tr>
                </thead>
                <tbody>
                    {card.trips.map((trip, index) => (
                        <tr key={trip.id}>
                            <td>{index + 1}</td>
                            <td>{displayName(user)}</td>
                            <td>
                                {trip.departure_location}
                                <br />
                                {trip.intermediate_points || '—'}
                                <br />→ {trip.arrival_location}
                            </td>
                            <td>
                                {formatDate(trip.departure_date)}
                                <br />
                                {trip.departure_time}
                            </td>
                            <td>{trip.initial_odometer}</td>
                            <td>
                                {formatDate(trip.arrival_date)}
                                <br />
                                {trip.arrival_time}
                            </td>
                            <td>{trip.final_odometer}</td>
                            <td>{Math.max(0, trip.final_odometer - trip.initial_odometer)} km</td>
                            <td />
                            <td />
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="source-route-notes">
                <h3>Uwagi / potwierdzenia</h3>
                <span />
                <span />
                <span />
            </div>
            <div className="source-signatures">
                <div>Podpis Kierowcy</div>
                <div>Podpis logistyki</div>
                <div>Data zamknięcia karty</div>
            </div>
            <p className="source-footnote">Strona 2 · Elektroniczna Karta Drogowa · SM / {card.id}</p>
        </article>
    );
}
