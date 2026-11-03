from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, Time
from sqlalchemy.orm import relationship

from database import Base


class Trip(Base):
    __tablename__ = "road_card_trips"

    id = Column(Integer, primary_key=True, index=True)
    road_card_id = Column(Integer, ForeignKey("road_cards.id", ondelete="CASCADE"), nullable=False, index=True)

    departure_location = Column(String, nullable=False)
    intermediate_points = Column(String, nullable=True)
    arrival_location = Column(String, nullable=False)
    departure_date = Column(Date, nullable=False)
    departure_time = Column(Time, nullable=False)
    arrival_date = Column(Date, nullable=False)
    arrival_time = Column(Time, nullable=False)

    initial_odometer = Column(Float, nullable=False)
    final_odometer = Column(Float, nullable=False)
    trip_departure_odometer = Column(Float, nullable=False)
    trip_arrival_odometer = Column(Float, nullable=False)

    route_start_date = Column(Date, nullable=False)
    route_end_date = Column(Date, nullable=False)
    route_settlement_time = Column(String, nullable=False)

    road_card = relationship("RoadCard", back_populates="trips")
