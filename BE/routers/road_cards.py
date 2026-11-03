from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Car, RoadCard, Trip, User
from schemas import RoadCardCreate, RoadCardResponse, TripResponse
from auth import get_current_user

router = APIRouter(prefix="/road-cards", tags=["Road Cards"])


def _assert_card_access(card: RoadCard, current_user: User) -> None:
    if current_user.role == "kierowca" and card.driver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Kierowca może obsługiwać wyłącznie własne karty.")


def _validate_trip(trip) -> None:
    if trip.final_odometer < trip.initial_odometer:
        raise HTTPException(status_code=400, detail="Stan licznika końcowego nie może być mniejszy niż początkowy.")
    if trip.trip_arrival_odometer < trip.trip_departure_odometer:
        raise HTTPException(status_code=400, detail="Stan licznika końcowego kursu nie może być mniejszy niż początkowego.")


def _last_odometer_for_car(db: Session, car_id: int, exclude_card_id: Optional[int] = None) -> Optional[float]:
    query = db.query(RoadCard).options(joinedload(RoadCard.trips)).filter(RoadCard.car_id == car_id)
    if exclude_card_id is not None:
        query = query.filter(RoadCard.id != exclude_card_id)
    cards = query.order_by(RoadCard.id.desc()).all()
    for card in cards:
        if card.trips:
            return max(card.trips, key=lambda trip: trip.id).final_odometer
        if card.final_odometer is not None:
            return card.final_odometer
    return None


def _validate_odometer_sequence(db: Session, car_id: int, trips, exclude_card_id: Optional[int] = None) -> None:
    expected_start = _last_odometer_for_car(db, car_id, exclude_card_id)
    for trip in trips:
        _validate_trip(trip)
        if expected_start is not None and trip.initial_odometer != expected_start:
            raise HTTPException(
                status_code=400,
                detail=f"Licznik start musi zaczynać się od {expected_start:g} km dla wybranego pojazdu.",
            )
        expected_start = trip.final_odometer


def _legacy_trip(card: RoadCard) -> Optional[TripResponse]:
    """Mapuje stary rekord RoadCard, który przed migracją był pojedynczym kursem."""
    if not card.departure_location:
        return None
    return TripResponse(
        id=card.id,
        departure_location=card.departure_location,
        intermediate_points="",
        arrival_location=card.arrival_location or "",
        departure_date=card.departure_date,
        departure_time=card.departure_time,
        arrival_date=card.arrival_date,
        arrival_time=card.arrival_time,
        initial_odometer=card.initial_odometer or 0,
        final_odometer=card.final_odometer or 0,
        trip_departure_odometer=card.trip_departure_odometer or 0,
        trip_arrival_odometer=card.trip_arrival_odometer or 0,
        route_start_date=card.route_start_date,
        route_end_date=card.route_end_date,
        route_settlement_time=card.route_settlement_time or "",
    )


def _serialize_card(card: RoadCard) -> RoadCardResponse:
    trips = [TripResponse.model_validate({**trip.__dict__, "intermediate_points": trip.intermediate_points or ""}) for trip in card.trips]
    if not trips:
        legacy = _legacy_trip(card)
        if legacy:
            trips = [legacy]
    return RoadCardResponse(
        id=card.id,
        created_at=card.created_at,
        car_id=card.car_id,
        driver_id=card.driver_id,
        trips=trips,
    )


@router.post("/", response_model=RoadCardResponse)
def create_road_card(
    card: RoadCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "kierowca" and card.driver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Kierowca może tworzyć wyłącznie własne karty.")
    car = db.query(Car).filter(Car.id == card.car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Podany samochód nie istnieje.")

    driver = db.query(User).filter(User.id == card.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Podany kierowca nie istnieje.")

    _validate_odometer_sequence(db, card.car_id, card.trips)

    db_card = RoadCard(car_id=card.car_id, driver_id=card.driver_id)
    db_card.trips = [Trip(**trip.model_dump()) for trip in card.trips]
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return _serialize_card(db_card)


@router.get("/", response_model=List[RoadCardResponse])
def get_road_cards(
    car_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(RoadCard).options(joinedload(RoadCard.trips))
    if car_id:
        query = query.filter(RoadCard.car_id == car_id)
    if current_user.role == "kierowca":
        if driver_id is not None and driver_id != current_user.id:
            raise HTTPException(status_code=403, detail="Kierowca może przeglądać wyłącznie własne karty.")
        query = query.filter(RoadCard.driver_id == current_user.id)
    elif driver_id is not None:
        query = query.filter(RoadCard.driver_id == driver_id)
    return [_serialize_card(card) for card in query.order_by(RoadCard.created_at.desc(), RoadCard.id.desc()).all()]


@router.get("/latest-odometer/", response_model=dict)
def get_latest_odometer(car_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    latest = _last_odometer_for_car(db, car_id)
    return {"has_records": latest is not None, "odometer": latest}


@router.put("/{card_id}", response_model=RoadCardResponse)
def update_road_card(
    card_id: int,
    card: RoadCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_card = db.query(RoadCard).options(joinedload(RoadCard.trips)).filter(RoadCard.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Karta drogowa nie została znaleziona")
    _assert_card_access(db_card, current_user)
    if current_user.role == "kierowca" and card.driver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Kierowca może przypisać kartę wyłącznie do własnego konta.")

    if not db.query(Car).filter(Car.id == card.car_id).first():
        raise HTTPException(status_code=404, detail="Podany samochód nie istnieje.")
    if not db.query(User).filter(User.id == card.driver_id).first():
        raise HTTPException(status_code=404, detail="Podany kierowca nie istnieje.")

    _validate_odometer_sequence(db, card.car_id, card.trips, exclude_card_id=card_id)

    db_card.car_id = card.car_id
    db_card.driver_id = card.driver_id
    db_card.trips.clear()
    db_card.trips.extend(Trip(**trip.model_dump()) for trip in card.trips)
    db.commit()
    db.refresh(db_card)
    return _serialize_card(db_card)


@router.delete("/{card_id}")
def delete_road_card(card_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_card = db.query(RoadCard).filter(RoadCard.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Karta drogowa nie została znaleziona")
    _assert_card_access(db_card, current_user)
    db.delete(db_card)
    db.commit()
    return {"message": "Karta drogowa została usunięta"}
