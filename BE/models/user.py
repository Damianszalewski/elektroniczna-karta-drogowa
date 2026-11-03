from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    first_name = Column("first_name", String)
    last_name = Column(String)
    role = Column(String, nullable=False, default="kierowca", server_default="kierowca")

    documents = relationship("RoadCard", back_populates="driver")

    @property
    def name(self):
        return self.first_name

    @name.setter
    def name(self, value):
        self.first_name = value
