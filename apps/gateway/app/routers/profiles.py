from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from ..security import get_db, get_current_user, require_role
from ..models import User, RoleEnum, Profile
from .. import schemas
from ..utils.text_extract import extract_text_smart
from ..integrations.polza import PolzaClient


router = APIRouter()


@router.get("/me", response_model=schemas.ProfilePublic, dependencies=[Depends(require_role(RoleEnum.candidate.value, RoleEnum.admin.value))])
def get_my_profile(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    prof = db.query(Profile).filter(Profile.owner_id == current.id).first()
    if not prof:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return prof


@router.post("/upload", response_model=schemas.ProfilePublic, status_code=201, dependencies=[Depends(require_role(RoleEnum.candidate.value, RoleEnum.admin.value))])
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")
    text = extract_text_smart(raw, file.filename, file.content_type)
    if not (text or '').strip():
        raise HTTPException(status_code=400, detail="Резюме распознано, но текста не найдено")
    # Parse via LLM or fallback
    data = None
    try:
        client = PolzaClient()
        data = client.extract_profile(text)
    except Exception:
        data = PolzaClient.extract_profile_fallback(text)
    if not data:
        raise HTTPException(status_code=502, detail="Parsing failed")

    prof = db.query(Profile).filter(Profile.owner_id == current.id).first()
    if not prof:
        prof = Profile(owner_id=current.id, summary=data.get('summary') or '', skills=data.get('skills') or [], details=data.get('details') or {})
        db.add(prof)
    else:
        prof.summary = data.get('summary') or prof.summary
        prof.skills = data.get('skills') or prof.skills
        prof.details = data.get('details') or prof.details
    db.commit()
    db.refresh(prof)
    return prof


@router.post("/generate", response_model=schemas.ProfilePublic, status_code=201, dependencies=[Depends(require_role(RoleEnum.candidate.value, RoleEnum.admin.value))])
def generate_profile(payload: schemas.ProfileBrief, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    summary = payload.summary or ''
    highlights = payload.highlights or []
    details = payload.details or {}
    data = None
    try:
        client = PolzaClient()
        brief_text = summary + ("\n- " + "\n- ".join(highlights) if highlights else "")
        data = client.generate_profile(brief_text)
    except Exception:
        data = None
    if not data:
        # Fallback: join into a readable summary and pick simple skills tokens
        from re import split
        if not summary and highlights:
            summary = ". ".join([h.strip().rstrip('.') for h in highlights if h.strip()]) + "."
        tokens = [t.strip().lower() for t in split(r"[\n,;\-\u2022]", summary) if t.strip()]
        skills = []
        for t in tokens:
            if 2 <= len(t) <= 24 and any(c.isalpha() for c in t):
                skills.append(t)
        seen = set(); uniq = []
        for s in skills:
            if s not in seen: seen.add(s); uniq.append(s)
        data = {"summary": summary, "skills": uniq[:12], "details": details}

    prof = db.query(Profile).filter(Profile.owner_id == current.id).first()
    if not prof:
        prof = Profile(owner_id=current.id, summary=data.get('summary') or '', skills=data.get('skills') or [], details=data.get('details') or {})
        db.add(prof)
    else:
        prof.summary = data.get('summary') or prof.summary
        prof.skills = data.get('skills') or prof.skills
        # merge details
        det = dict(prof.details or {})
        det.update(data.get('details') or {})
        prof.details = det
    db.commit(); db.refresh(prof)
    return prof

