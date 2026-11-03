from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import date, datetime

CarStatus = Literal["aktywny", "wycofany"]

class CarCreate(BaseModel):
    registration_number: str = Field(min_length=1, max_length=32)
    car_type: str = Field(min_length=1, max_length=100)
    fuel: str = Field(min_length=1, max_length=32)
    when_date: Optional[date] = None
    # Starsze rekordy przechowują pojemność w cm³, np. 2000.0.
    car_engine_capacity: float = Field(ge=0, le=10_000)
    status: CarStatus = "aktywny"

class CarResponse(CarCreate):
    id: int
    created_at: datetime | None = None
    class Config:
        from_attributes = True
