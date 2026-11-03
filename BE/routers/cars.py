from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Car
from schemas import CarCreate, CarResponse
from auth import get_current_user, require_admin

router = APIRouter(prefix="/cars", tags=["Cars"])

@router.post("/", response_model=CarResponse)
def create_car(car: CarCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    db_car = Car(**car.dict())
    db.add(db_car)
    db.commit()
    db.refresh(db_car)
    return db_car

@router.get("/", response_model=List[CarResponse])
def get_cars(
    include_retired: bool = False,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    query = db.query(Car)
    if not include_retired:
        query = query.filter(Car.status == "aktywny")
    return query.order_by(Car.created_at.desc(), Car.id.desc()).all()

@router.put("/{car_id}", response_model=CarResponse)
def update_car(car_id: int, car: CarCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    db_car = db.query(Car).filter(Car.id == car_id).first()
    if not db_car:
        raise HTTPException(status_code=404, detail="Samochód nie został znaleziony")
    for key, value in car.dict().items():
        setattr(db_car, key, value)
    db.commit()
    db.refresh(db_car)
    return db_car

@router.delete("/{car_id}", response_model=CarResponse)
def delete_car(car_id: int, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    db_car = db.query(Car).filter(Car.id == car_id).first()
    if not db_car:
        raise HTTPException(status_code=404, detail="Samochód nie został znaleziony")
    db_car.status = "wycofany"
    db.commit()
    db.refresh(db_car)
    return db_car
