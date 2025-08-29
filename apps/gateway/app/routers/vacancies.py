from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from sqlalchemy.orm import Session

from .. import schemas
from ..models import Vacancy
from ..security import get_db, require_role, get_current_user
from ..models import User, RoleEnum
from ..integrations.polza import PolzaClient
from ..utils.text_extract import extract_text_smart


router = APIRouter()


@router.post("/", response_model=schemas.VacancyPublic, status_code=201, dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def create_vacancy(payload: schemas.VacancyCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    v = Vacancy(
        title=payload.title,
        description=payload.description,
        seniority=payload.seniority,
        skills=payload.skills,
        weights=payload.weights,
        status=payload.status or "draft",
        details=payload.details or {},
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


@router.get("/public", response_model=list[schemas.VacancyPublic])
def list_public_vacancies(db: Session = Depends(get_db)):
    q = db.query(Vacancy).filter(Vacancy.status == "approved")
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
    for field in ["title", "description", "seniority", "skills", "weights", "status", "details"]:
        val = getattr(payload, field)
        if val is not None:
            setattr(v, field, val)
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.post("/upload", response_model=schemas.VacancyPublic, status_code=201, dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
async def upload_vacancy(file: UploadFile = File(...), db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    # Read content and extract text using smart parser (PDF/DOCX/text)
    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    text = extract_text_smart(raw_bytes, file.filename, file.content_type)
    fname = (file.filename or "").lower()
    ctype = (file.content_type or "").lower()
    is_structured = fname.endswith((".pdf", ".docx")) or ("pdf" in ctype or "officedocument.wordprocessingml.document" in ctype)
    # For structured docs (pdf/docx), allow short text; for raw/binary, require minimal length
    if len((text or "").strip()) < (1 if is_structured else 5):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Файл распознан, но текста не найдено. Проверьте содержимое или загрузите DOCX/PDF с текстом")

    data = None
    err: Exception | None = None
    try:
        client = PolzaClient()
        data = client.extract_vacancy(text)
    except Exception as e:
        # As an extra guard, try fallback parser directly
        try:
            data = PolzaClient.extract_vacancy_fallback(text)
        except Exception:
            err = e
    if not data:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"LLM parsing failed: {err}")

    v = Vacancy(
        title=data["title"],
        description=data["description"],
        seniority=data.get("seniority") or "Middle",
        skills=data.get("skills") or [],
        weights=data.get("weights") or {},
        status="draft",
        details=data.get("details") or {},
        owner_id=current.id,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.post("/{vacancy_id}/approve", response_model=schemas.VacancyPublic, dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def approve_vacancy(vacancy_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id).first()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if current.role == RoleEnum.hr.value and v.owner_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    v.status = "approved"
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.post("/generate", response_model=schemas.VacancyPublic, status_code=201, dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def generate_vacancy(payload: schemas.VacancyBrief, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    from ..integrations.polza import PolzaClient

    title = payload.title or "Вакансия"
    seniority = payload.seniority or "Middle"
    highlights = payload.highlights or []
    details = payload.details or {}

    data = None
    try:
        client = PolzaClient()
        # Reuse LLM with dedicated prompt
        brief_text = f"title: {title}\nseniority: {seniority}\nhighlights:\n- " + "\n- ".join(highlights)
        data = client.generate_vacancy(brief_text)
    except Exception:
        data = None

    if not data:
        # Fallback: synthesize description and skills
        desc_parts = []
        if highlights:
            desc_parts.append(". ".join([h.strip().rstrip('.') for h in highlights if h.strip()]) + ".")
        description = " ".join(desc_parts) or "Описание будет дополнено."
        skills = []
        for h in highlights:
            for token in h.replace(',', ' ').split():
                t = token.strip().lower()
                if 2 <= len(t) <= 20 and any(c.isalpha() for c in t):
                    skills.append(t)
        # dedupe
        seen = set(); uniq = []
        for s in skills:
            if s not in seen:
                seen.add(s); uniq.append(s)
        data = {"title": title, "description": description, "seniority": seniority, "skills": uniq[:10], "weights": {"technical": 0.5, "communication": 0.3, "cases": 0.2}}
    # Merge details if present
    details_out = data.get("details") or {}
    if details:
        details_out.update(details)

    v = Vacancy(
        title=data["title"],
        description=data["description"],
        seniority=data.get("seniority") or seniority,
        skills=data.get("skills") or [],
        weights=data.get("weights") or {},
        status="draft",
        details=details_out,
        owner_id=current.id,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.delete("/{vacancy_id}", status_code=204, dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def delete_vacancy(vacancy_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id).first()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    # HR can delete only own drafts; Admin can delete any
    if current.role == RoleEnum.hr.value:
        if v.owner_id != current.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        if v.status != "draft":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Удалять можно только черновики")
    db.delete(v)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{vacancy_id}/archive", response_model=schemas.VacancyPublic, dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def archive_vacancy(vacancy_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id).first()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    # HR can archive only own vacancies; Admin can archive any
    if current.role == RoleEnum.hr.value and v.owner_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    v.status = "archived"
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.post("/{vacancy_id}/unarchive", response_model=schemas.VacancyPublic, dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def unarchive_vacancy(vacancy_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id).first()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if current.role == RoleEnum.hr.value and v.owner_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if v.status != "archived":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Можно вернуть только из архива")
    v.status = "draft"
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.post("/{vacancy_id}/revoke", response_model=schemas.VacancyPublic, dependencies=[Depends(require_role(RoleEnum.hr.value, RoleEnum.admin.value))])
def revoke_approval(vacancy_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    v = db.query(Vacancy).filter(Vacancy.id == vacancy_id).first()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if current.role == RoleEnum.hr.value and v.owner_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if v.status != "approved":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Отзывать можно только утверждённые")
    v.status = "draft"
    db.add(v)
    db.commit()
    db.refresh(v)
    return v
