from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..security import get_db, get_current_user, require_role
from ..models import Application, Vacancy, User, RoleEnum, Profile
from .. import schemas
from ..integrations.polza import PolzaClient
from ..config import INVITE_THRESHOLD


router = APIRouter()


@router.post("/", response_model=schemas.ApplicationPublic, status_code=201, dependencies=[Depends(require_role(RoleEnum.candidate.value, RoleEnum.admin.value))])
def apply(payload: schemas.ApplicationCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    vac = db.query(Vacancy).filter(Vacancy.id == payload.vacancy_id).first()
    if not vac:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vacancy not found")
    if vac.status != "approved":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Отклик возможен только на утверждённые вакансии")
    # prevent duplicates
    existing = db.query(Application).filter(Application.vacancy_id == vac.id, Application.candidate_id == current.id).first()
    if existing:
        return existing
    # snapshot candidate profile if exists
    snap = {}
    prof = db.query(Profile).filter(Profile.owner_id == current.id).first()
    if prof:
        snap = {"summary": prof.summary, "skills": prof.skills, "details": prof.details}
    app = Application(vacancy_id=vac.id, candidate_id=current.id, status="applied", profile_snapshot=snap)
    db.add(app)
    db.commit(); db.refresh(app)
    # Auto-assess via AI
    try:
        client = PolzaClient()
        vac_payload = {"title": vac.title, "description": vac.description, "seniority": vac.seniority, "skills": vac.skills, "weights": vac.weights, "details": getattr(vac, 'details', {})}
        prof_payload = snap or {}
        result = client.assess_application(vac_payload, prof_payload)
        app.match_score = result.get("match_score")
        app.verdict = result.get("verdict")
        app.notes = result.get("notes")
        # decide on invite
        try:
            score = float(app.match_score or 0)
        except Exception:
            score = 0.0
        app.status = "invited" if (app.verdict == "accept" and score >= INVITE_THRESHOLD) else "assessed"
        db.add(app); db.commit(); db.refresh(app)
    except Exception:
        pass
    return app


@router.get("/me", response_model=list[schemas.ApplicationPublic], dependencies=[Depends(require_role(RoleEnum.candidate.value, RoleEnum.admin.value))])
def my_applications(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    q = db.query(Application).filter(Application.candidate_id == current.id)
    return q.order_by(Application.created_at.desc()).all()


@router.get("/hr", response_model=list[schemas.ApplicationPublic], dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def hr_applications(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    # list applications for vacancies owned by this HR (or all for admin)
    q = db.query(Application)
    if current.role == RoleEnum.hr.value:
        # join-like filter: applications on vacancies owned by current HR
        vac_ids = [v.id for v in db.query(Vacancy).filter(Vacancy.owner_id == current.id).all()]
        if not vac_ids:
            return []
        q = q.filter(Application.vacancy_id.in_(vac_ids))
    return q.order_by(Application.created_at.desc()).all()


@router.patch("/{app_id}", response_model=schemas.ApplicationPublic, dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def update_application(app_id: int, payload: schemas.ApplicationUpdate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    # Restrict HR to own vacancies
    if current.role == RoleEnum.hr.value:
        vac = db.query(Vacancy).filter(Vacancy.id == app.vacancy_id).first()
        if not vac or vac.owner_id != current.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    # Apply updates
    for field in ["status", "match_score", "verdict", "notes"]:
        val = getattr(payload, field)
        if val is not None:
            setattr(app, field, val)
    # If HR sets match_score and verdict but didn't set status, move to assessed
    if payload.match_score is not None and (payload.verdict or app.verdict) and not payload.status:
        app.status = "assessed"
    db.add(app); db.commit(); db.refresh(app)
    return app


@router.post("/{app_id}/assess", response_model=schemas.ApplicationPublic, dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def reassess_application(app_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    vac = db.query(Vacancy).filter(Vacancy.id == app.vacancy_id).first()
    if not vac:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vacancy not found")
    if current.role == RoleEnum.hr.value and vac.owner_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    try:
        client = PolzaClient()
        vac_payload = {"title": vac.title, "description": vac.description, "seniority": vac.seniority, "skills": vac.skills, "weights": vac.weights, "details": getattr(vac, 'details', {})}
        prof_payload = app.profile_snapshot or {}
        result = client.assess_application(vac_payload, prof_payload)
        app.match_score = result.get("match_score")
        app.verdict = result.get("verdict")
        app.notes = result.get("notes")
        try:
            score = float(app.match_score or 0)
        except Exception:
            score = 0.0
        app.status = "invited" if (app.verdict == "accept" and score >= INVITE_THRESHOLD) else "assessed"
        db.add(app); db.commit(); db.refresh(app)
    except Exception:
        pass
    return app
