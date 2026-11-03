from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Time
from sqlalchemy.orm import relationship
from database import Base

class RoadCard(Base):
    __tablename__ = "road_cards"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    car_id = Column(Integer, ForeignKey("cars.id"))
    driver_id = Column(Integer, ForeignKey("users.id"))

    car = relationship("Car", back_populates="documents")
    driver = relationship("User", back_populates="documents")
    trips = relationship("Trip", back_populates="road_card", cascade="all, delete-orphan", passive_deletes=True)

    departure_location = Column(String)
    arrival_location = Column(String)
    departure_date = Column(Date)
    departure_time = Column(Time)
    arrival_date = Column(Date)
    arrival_time = Column(Time)

    initial_odometer = Column(Float)
    final_odometer = Column(Float)
    trip_departure_odometer = Column(Float)
    trip_arrival_odometer = Column(Float)

    route_start_date = Column(Date)
    route_end_date = Column(Date)
    route_settlement_time = Column(String)
