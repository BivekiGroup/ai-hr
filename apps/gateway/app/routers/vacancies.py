from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas
from ..models import Vacancy
from ..security import get_db, require_role, get_current_user
from ..models import User, RoleEnum


router = APIRouter()


@router.post("/", response_model=schemas.VacancyPublic, status_code=201, dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def create_vacancy(payload: schemas.VacancyCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    v = Vacancy(
        title=payload.title,
        description=payload.description,
        seniority=payload.seniority,
        skills=payload.skills,
        weights=payload.weights,
        owner_id=current.id,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.get("/", response_model=list[schemas.VacancyPublic], dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def list_vacancies(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    q = db.query(Vacancy)
    if current.role == RoleEnum.hr.value:
        q = q.filter(Vacancy.owner_id == current.id)
    return q.order_by(Vacancy.created_at.desc()).all()


@router.get("/{vacancy_id}", response_model=schemas.VacancyPublic, dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def get_vacancy(vacancy_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id).first()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if current.role == RoleEnum.hr.value and v.owner_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return v


@router.patch("/{vacancy_id}", response_model=schemas.VacancyPublic, dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def update_vacancy(vacancy_id: int, payload: schemas.VacancyUpdate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id).first()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if current.role == RoleEnum.hr.value and v.owner_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    for field in ["title", "description", "seniority", "skills", "weights"]:
        val = getattr(payload, field)
        if val is not None:
            setattr(v, field, val)
    db.add(v)
    db.commit()
    db.refresh(v)
    return v

