from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, Float, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class Car(Base):
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    registration_number = Column(String, unique=True, index=True)
    car_type = Column(String)
    fuel = Column(String)
    when_date = Column(Date, nullable=True)
    car_engine_capacity = Column(Float)
    status = Column(String, nullable=False, default="aktywny", server_default="aktywny")

    documents = relationship("RoadCard", back_populates="car")
