from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User
from schemas import PasswordChange, UserCreate, UserUpdate, UserResponse
from security import hash_password
from auth import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    hashed_pwd = hash_password(user.password)
    db_user = User(
        email=user.email,
        password=hashed_pwd,
        first_name=user.name,
        last_name=user.last_name,
        role=user.role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(User).order_by(User.created_at.desc(), User.id.desc()).all()

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Użytkownik nie został znaleziony")
    
    db_user.email = user.email
    db_user.first_name = user.name
    db_user.last_name = user.last_name
    if user.role is not None:
        db_user.role = user.role
    if user.password:
        db_user.password = hash_password(user.password)
        
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Użytkownik nie został znaleziony")
    db.delete(db_user)
    db.commit()
    return {"message": "Użytkownik został usunięty"}


@router.put("/me/password")
def change_my_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.password = hash_password(payload.password)
    db.commit()
    return {"message": "Hasło zostało zmienione"}
