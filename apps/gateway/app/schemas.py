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
    status: str = "draft"
    details: dict = {}


class VacancyCreate(VacancyBase):
    pass


class VacancyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    seniority: str | None = None
    skills: list[str] | None = None
    weights: dict | None = None
    status: str | None = None
    details: dict | None = None


class VacancyPublic(BaseModel):
    id: int
    title: str
    description: str
    seniority: str
    skills: list[str]
    weights: dict
    status: str
    details: dict
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Generation brief
class VacancyBrief(BaseModel):
    title: str | None = None
    seniority: str | None = None
    highlights: list[str] = []  # ключевые пункты: обязанности/требования/условия
    details: dict = {}


# Profiles
class ProfileBase(BaseModel):
    summary: str
    skills: list[str] = []
    details: dict = {}


class ProfilePublic(ProfileBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProfileBrief(BaseModel):
    summary: str | None = None
    highlights: list[str] = []
    details: dict = {}


# Applications
class ApplicationBase(BaseModel):
    vacancy_id: int


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    status: str | None = None
    match_score: float | None = None
    verdict: str | None = None
    notes: str | None = None


class ApplicationPublic(BaseModel):
    id: int
    vacancy_id: int
    candidate_id: int
    status: str
    match_score: float | None = None
    verdict: str | None = None
    notes: str | None = None
    profile_snapshot: dict
    created_at: datetime

    class Config:
        from_attributes = True
