from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from .. import schemas
from ..models import User, RoleEnum
from ..security import (
    get_db,
    hash_password,
    verify_password,
    create_access_refresh,
    decode_token,
    get_current_user,
)
from ..config import ADMIN_BOOTSTRAP_TOKEN


router = APIRouter()


@router.post("/signup", response_model=schemas.UserPublic)
def signup(payload: schemas.SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        email=payload.email,
        name=payload.name,
        role=RoleEnum.candidate.value,  # публичная регистрация — только кандидат
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.TokenPair)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    access, refresh = create_access_refresh(user)
    return schemas.TokenPair(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=schemas.TokenPair)
def refresh(payload: schemas.RefreshRequest, db: Session = Depends(get_db)):
    data = decode_token(payload.refresh_token)
    if data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not a refresh token")
    email = data.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    access, refresh = create_access_refresh(user)
    return schemas.TokenPair(access_token=access, refresh_token=refresh)


@router.post("/bootstrap-admin", response_model=schemas.UserPublic)
def bootstrap_admin(payload: schemas.BootstrapAdminRequest, db: Session = Depends(get_db)):
    # Only allowed if there are no users at all and token matches env
    count = db.query(User).count()
    if count > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already initialized")
    if not ADMIN_BOOTSTRAP_TOKEN or payload.token != ADMIN_BOOTSTRAP_TOKEN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid bootstrap token")

    user = User(
        email=payload.email,
        name=payload.name,
        role=RoleEnum.admin.value,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=schemas.UserPublic)
def me(current: User = Depends(get_current_user)):
    return current


@router.post("/create-hr", response_model=schemas.UserPublic)
def create_hr(payload: schemas.CreateHRRequest, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    # only admin can create HR accounts
    if current.role != RoleEnum.admin.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        email=payload.email,
        name=payload.name,
        role=RoleEnum.hr.value,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users", response_model=list[schemas.UserPublic])
def list_users(role: str | None = Query(None), db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    # only admin can list users
    if current.role != RoleEnum.admin.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return q.order_by(User.created_at.asc()).all()
