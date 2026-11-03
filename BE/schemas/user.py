from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

UserRole = Literal["kierowca", "logistyka", "administrator"]

class UserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=6, max_length=72)
    name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    role: UserRole = "kierowca"

class UserUpdate(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    role: UserRole | None = None
    password: str | None = Field(default=None, min_length=6, max_length=72)


class PasswordChange(BaseModel):
    password: str = Field(min_length=6, max_length=72)

class UserResponse(BaseModel):
    id: int
    created_at: datetime | None = None
    email: str
    name: str
    last_name: str
    role: UserRole

    class Config:
        from_attributes = True
