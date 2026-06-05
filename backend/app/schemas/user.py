from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    experience_level: str
    skills: list[str] = []
    interests: list[str] = []


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    role: Optional[str] = None
    experience_level: Optional[str] = None
    skills: Optional[list[str]] = None
    interests: Optional[list[str]] = None
    is_discoverable: Optional[bool] = None


class UserProfileResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    experience_level: str
    bio: str
    location: str
    skills: list[str]
    interests: list[str]
    emoji: str
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
