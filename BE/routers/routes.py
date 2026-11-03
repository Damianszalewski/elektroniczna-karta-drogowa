from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import RouteTemplate, RouteTemplatePoint
from schemas import RouteTemplateCreate, RouteTemplateResponse
from auth import get_current_user, require_admin

router = APIRouter(prefix="/route-templates", tags=["Route Templates"])


def _split_legacy_description(description: str):
    parts = [part.strip() for part in description.replace("->", "→").split("→") if part.strip()]
    return (parts[0] if parts else "", parts[-1] if len(parts) > 1 else (parts[0] if parts else ""), parts[1:-1] if len(parts) > 2 else [])


def _normalize(template: RouteTemplateCreate):
    departure = template.departure_location.strip()
    arrival = template.arrival_location.strip()
    points = [point.strip() for point in template.points if point.strip()]
    if (not departure or not arrival) and template.description:
        legacy_departure, legacy_arrival, legacy_points = _split_legacy_description(template.description)
        departure = departure or legacy_departure
        arrival = arrival or legacy_arrival
        if not points:
            points = legacy_points
    description = " → ".join([value for value in [departure, *points, arrival] if value])
    return departure, arrival, points, description


def _serialize(template: RouteTemplate) -> RouteTemplateResponse:
    departure = template.departure_location or ""
    arrival = template.arrival_location or ""
    points = [point.name for point in template.points]
    if (not departure or not arrival) and template.description:
        departure, arrival, legacy_points = _split_legacy_description(template.description)
        if not points:
            points = legacy_points
    description = " → ".join([value for value in [departure, *points, arrival] if value])
    return RouteTemplateResponse(
        id=template.id,
        created_at=template.created_at,
        name=template.name,
        departure_location=departure,
        arrival_location=arrival,
        points=points,
        description=description,
    )


def _apply_template(db_template: RouteTemplate, template: RouteTemplateCreate):
    departure, arrival, points, description = _normalize(template)
    db_template.name = template.name.strip()
    db_template.departure_location = departure
    db_template.arrival_location = arrival
    db_template.description = description
    db_template.points.clear()
    db_template.points.extend(RouteTemplatePoint(name=point, position=index) for index, point in enumerate(points))


@router.post("/", response_model=RouteTemplateResponse)
def create_route_template(template: RouteTemplateCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    db_template = RouteTemplate()
    _apply_template(db_template, template)
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return _serialize(db_template)


@router.get("/", response_model=List[RouteTemplateResponse])
def get_route_templates(db: Session = Depends(get_db), _: object = Depends(get_current_user)):
    templates = (
        db.query(RouteTemplate)
        .options(joinedload(RouteTemplate.points))
        .order_by(RouteTemplate.created_at.desc(), RouteTemplate.id.desc())
        .all()
    )
    return [_serialize(template) for template in templates]


@router.put("/{template_id}", response_model=RouteTemplateResponse)
def update_route_template(template_id: int, template: RouteTemplateCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    db_template = db.query(RouteTemplate).options(joinedload(RouteTemplate.points)).filter(RouteTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Wzorzec trasy nie został znaleziony")
    _apply_template(db_template, template)
    db.commit()
    db.refresh(db_template)
    return _serialize(db_template)


@router.delete("/{template_id}")
def delete_route_template(template_id: int, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    db_template = db.query(RouteTemplate).filter(RouteTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Wzorzec trasy nie został znaleziony")
    db.delete(db_template)
    db.commit()
    return {"message": "Wzorzec trasy został usunięty"}
