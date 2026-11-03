"""Dodaje bezpieczny, powtarzalny zestaw danych demonstracyjnych.

Uruchomienie:
    cd BE
    py seed_demo_data.py

Skrypt korzysta z DATABASE_URL tak samo jak backend. Nie usuwa istniejących
rekordów i nie resetuje bazy.
"""

from datetime import date, datetime, time, timedelta, timezone

from main import ensure_schema_compatibility
from database import SessionLocal
from models import Car, RoadCard, RouteTemplate, RouteTemplatePoint, Trip, User
from security import hash_password


DEMO_PASSWORD = "Demo1234!"
TARGET_CARD_COUNT = 400

DRIVERS = [
    ("Adam", "Kowalski"),
    ("Barbara", "Nowak"),
    ("Cezary", "Wiśniewski"),
    ("Daniel", "Wójcik"),
    ("Ewa", "Kamińska"),
    ("Filip", "Lewandowski"),
    ("Grażyna", "Zielińska"),
    ("Hubert", "Szymański"),
    ("Iwona", "Woźniak"),
    ("Jan", "Dąbrowski"),
]

LOGISTICS = [("Katarzyna", "Mazur"), ("Michał", "Krawczyk")]
ADMINISTRATOR = ("Dawid", "Nowak-Jeżora")

CAR_SPECS = [
    ("DEMO 1001", "Ford Transit", "ON", 2.0),
    ("DEMO 1002", "Ford K", "LPG", 1.6),
    ("DEMO 1003", "Volkswagen Caddy", "ON", 2.0),
    ("DEMO 1004", "Toyota Corolla", "PB", 1.8),
    ("DEMO 1005", "Renault Master", "ON", 2.3),
    ("DEMO 1006", "Opel Vivaro", "ON", 2.0),
    ("DEMO 1007", "Skoda Octavia", "PB", 1.5),
    ("DEMO 1008", "Kia Ceed", "PB", 1.6),
]

ROUTE_SPECS = [
    ("Baza – Gdańsk", "Baza", "Gdańsk", ["Pruszcz Gdański"]),
    ("Baza – Starogard Gdański", "Baza", "Starogard Gdański", ["Tczew"]),
    ("Baza – Malbork", "Baza", "Malbork", ["Tczew", "Nowy Staw"]),
    ("Baza – Elbląg", "Baza", "Elbląg", ["Malbork"]),
    ("Gdańsk – Gdynia", "Gdańsk", "Gdynia", ["Sopot"]),
    ("Baza – Bydgoszcz", "Baza", "Bydgoszcz", ["Grudziądz", "Świecie"]),
    ("Baza – Olsztyn", "Baza", "Olsztyn", ["Iława"]),
    ("Baza – Toruń", "Baza", "Toruń", ["Grudziądz"]),
]


def demo_email(first_name: str, last_name: str) -> str:
    normalized = f"{first_name}.{last_name}".lower().replace("ą", "a").replace("ć", "c")
    normalized = normalized.replace("ę", "e").replace("ł", "l").replace("ń", "n")
    normalized = normalized.replace("ó", "o").replace("ś", "s").replace("ź", "z").replace("ż", "z")
    return f"{normalized}@demo.ekd.local"


def get_or_create_user(db, first_name: str, last_name: str, role: str) -> User:
    email = demo_email(first_name, last_name)
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(email=email, password=hash_password(DEMO_PASSWORD))
        db.add(user)
    user.first_name = first_name
    user.last_name = last_name
    user.role = role
    return user


def get_or_create_car(db, registration: str, car_type: str, fuel: str, capacity: float) -> Car:
    car = db.query(Car).filter(Car.registration_number == registration).first()
    if car is None:
        car = Car(registration_number=registration)
        db.add(car)
    car.car_type = car_type
    car.fuel = fuel
    car.car_engine_capacity = capacity
    car.when_date = car.when_date or date.today()
    return car


def get_or_create_route(db, name: str, departure: str, arrival: str, points: list[str]) -> RouteTemplate:
    route = db.query(RouteTemplate).filter(RouteTemplate.name == name).first()
    if route is None:
        route = RouteTemplate(name=name)
        db.add(route)
    route.departure_location = departure
    route.arrival_location = arrival
    route.description = " → ".join([departure, *points, arrival])
    route.points.clear()
    route.points.extend(RouteTemplatePoint(name=point, position=index) for index, point in enumerate(points))
    return route


def build_trip(route: RouteTemplate, trip_index: int, card_index: int, odometer_start: float) -> Trip:
    departure_day = date.today() - timedelta(days=(card_index % 300))
    departure_hour = 6 + ((card_index + trip_index) % 4)
    departure_time = time(hour=departure_hour, minute=trip_index * 10)
    arrival_time = time(hour=departure_hour + 1, minute=trip_index * 10)
    distance = 15 + ((card_index * 13 + trip_index * 17) % 110)
    odometer_end = odometer_start + distance
    return Trip(
        departure_location=route.departure_location or "Baza",
        intermediate_points=" → ".join(point.name for point in route.points),
        arrival_location=route.arrival_location or "Baza",
        departure_date=departure_day,
        departure_time=departure_time,
        arrival_date=departure_day,
        arrival_time=arrival_time,
        initial_odometer=odometer_start,
        final_odometer=odometer_end,
        trip_departure_odometer=odometer_start,
        trip_arrival_odometer=odometer_end,
        route_start_date=departure_day,
        route_end_date=departure_day,
        route_settlement_time=f"{departure_day.isoformat()} {arrival_time.isoformat(timespec='minutes')}",
    )


def seed() -> None:
    # Import main uruchamia również kompatybilną migrację created_at.
    ensure_schema_compatibility()
    db = SessionLocal()
    try:
        drivers = [get_or_create_user(db, first, last, "kierowca") for first, last in DRIVERS]
        logistics = [get_or_create_user(db, first, last, "logistyka") for first, last in LOGISTICS]
        administrator = get_or_create_user(db, *ADMINISTRATOR, "administrator")

        cars = [get_or_create_car(db, *spec) for spec in CAR_SPECS]
        routes = [get_or_create_route(db, *spec) for spec in ROUTE_SPECS]
        db.flush()

        demo_driver_ids = [driver.id for driver in drivers]
        existing_cards = (
            db.query(RoadCard)
            .filter(RoadCard.driver_id.in_(demo_driver_ids))
            .count()
        )
        cards_to_create = max(0, TARGET_CARD_COUNT - existing_cards)

        for index in range(existing_cards, existing_cards + cards_to_create):
            car = cars[index % len(cars)]
            driver = drivers[index % len(drivers)]
            route = routes[index % len(routes)]
            created_at = datetime.now(timezone.utc) - timedelta(days=TARGET_CARD_COUNT - index)
            trip_count = 1 + (index % 3)
            odometer = 10000 + ((index * 73) % 18000)
            trips = []
            for trip_index in range(trip_count):
                trip = build_trip(route, trip_index, index, odometer)
                trips.append(trip)
                odometer = trip.final_odometer
            db.add(
                RoadCard(
                    car_id=car.id,
                    driver_id=driver.id,
                    created_at=created_at,
                    trips=trips,
                )
            )

        db.commit()
        print("Dane demonstracyjne zostały zapisane.")
        print(f"Kierowcy: {len(drivers)} | Logistyka: {len(logistics)} | Administrator: 1")
        print(f"Pojazdy: {len(cars)} | Trasy: {len(routes)} | Dodane karty: {cards_to_create}")
        print(f"Docelowa liczba kart demonstracyjnych: {TARGET_CARD_COUNT}")
        print(f"Hasło kont demonstracyjnych: {DEMO_PASSWORD}")
        print(f"Administrator: {demo_email(*ADMINISTRATOR)}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
