from datetime import datetime
from typing import List

from pydantic import BaseModel, Field

class RouteTemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    departure_location: str = Field(default="", max_length=150)
    arrival_location: str = Field(default="", max_length=150)
    points: List[str] = Field(default_factory=list, max_length=20)
    # Stary klient może nadal przesłać jeden opis trasy.
    description: str = Field(default="", max_length=2000)

class RouteTemplateResponse(BaseModel):
    id: int
    created_at: datetime | None = None
    name: str
    departure_location: str
    arrival_location: str
    points: List[str]
    description: str = ""

    class Config:
        from_attributes = True
