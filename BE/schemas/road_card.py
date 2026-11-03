from typing import List

from pydantic import BaseModel, Field
from datetime import date, datetime, time

class TripCreate(BaseModel):
    departure_location: str = Field(min_length=1, max_length=150)
    intermediate_points: str = Field(default="", max_length=1000)
    arrival_location: str = Field(min_length=1, max_length=150)
    departure_date: date
    departure_time: time
    arrival_date: date
    arrival_time: time
    initial_odometer: float = Field(ge=0, le=10_000_000)
    final_odometer: float = Field(ge=0, le=10_000_000)
    trip_departure_odometer: float = Field(ge=0, le=10_000_000)
    trip_arrival_odometer: float = Field(ge=0, le=10_000_000)
    route_start_date: date
    route_end_date: date
    route_settlement_time: str = Field(max_length=100)

class TripResponse(TripCreate):
    id: int

    class Config:
        from_attributes = True


class RoadCardCreate(BaseModel):
    car_id: int
    driver_id: int
    trips: List[TripCreate] = Field(min_length=1)


class RoadCardResponse(BaseModel):
    id: int
    created_at: datetime | None = None
    # Rekordy utworzone przed powiązaniem kart z pojazdami/kierowcami mogą mieć NULL.
    car_id: int | None = None
    driver_id: int | None = None
    trips: List[TripResponse]

    class Config:
        from_attributes = True
