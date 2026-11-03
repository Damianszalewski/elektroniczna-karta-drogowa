from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class RouteTemplate(Base):
    __tablename__ = "route_templates"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    name = Column(String)
    # description pozostaje dla kompatybilności ze starymi rekordami.
    description = Column(String, nullable=True)
    departure_location = Column(String, nullable=True)
    arrival_location = Column(String, nullable=True)

    points = relationship("RouteTemplatePoint", back_populates="template", cascade="all, delete-orphan", order_by="RouteTemplatePoint.position")


class RouteTemplatePoint(Base):
    __tablename__ = "route_template_points"

    id = Column(Integer, primary_key=True, index=True)
    route_template_id = Column(Integer, ForeignKey("route_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)

    template = relationship("RouteTemplate", back_populates="points")
