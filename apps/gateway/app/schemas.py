from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str
    created_at: datetime


class UserPublic(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class SignupRequest(BaseModel):
    email: EmailStr
    name: str
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class BootstrapAdminRequest(BaseModel):
    token: str
    email: EmailStr
    name: str
    password: str = Field(min_length=8)


class CreateHRRequest(BaseModel):
    email: EmailStr
    name: str
    password: str = Field(min_length=6)


# Vacancies
class VacancyBase(BaseModel):
    title: str
    description: str
    seniority: str  # Junior/Middle/Senior
    skills: list[str] = []
    weights: dict = {}


class VacancyCreate(VacancyBase):
    pass


class VacancyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    seniority: str | None = None
    skills: list[str] | None = None
    weights: dict | None = None


class VacancyPublic(BaseModel):
    id: int
    title: str
    description: str
    seniority: str
    skills: list[str]
    weights: dict
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True
