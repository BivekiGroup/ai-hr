import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from .db import engine

from .routers.auth import router as auth_router
from .routers.vacancies import router as vacancies_router
from .routers.profiles import router as profiles_router
from .routers.applications import router as applications_router
from .db import init_db


app = FastAPI(title="HR Avatar Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    # Ensure base tables exist for a clean start
    init_db()

    # Then apply Alembic migrations (idempotent)
    try:
        from alembic import command
        from alembic.config import Config

        # Resolve path to alembic.ini copied to image root (/app)
        # __file__ is /app/app/main.py → parent(1) is /app
        root = Path(__file__).resolve().parents[1]
        ini_path = os.getenv("ALEMBIC_INI", str(root / "alembic.ini"))
        cfg = Config(ini_path)
        command.upgrade(cfg, "head")
    except Exception as e:
        # If alembic not installed or migrations fail, continue; logs will show errors.
        # In dev, you can run: docker compose run --rm api alembic -c /app/alembic.ini upgrade head
        print(f"[alembic] upgrade failed or skipped: {e}")

    # Safety net: ensure required columns exist (for cases when Alembic couldn't run)
    try:
        insp = inspect(engine)
        cols = {c['name'] for c in insp.get_columns('vacancies')}
        if 'status' not in cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'draft' NOT NULL"))
                # Drop server default to align with ORM model
                conn.execute(text("ALTER TABLE vacancies ALTER COLUMN status DROP DEFAULT"))
        if 'details' not in cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS details JSON NOT NULL DEFAULT '{}'"))
                conn.execute(text("ALTER TABLE vacancies ALTER COLUMN details DROP DEFAULT"))
    except Exception as e:
        print(f"[db] ensure columns failed: {e}")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(vacancies_router, prefix="/vacancies", tags=["vacancies"])
app.include_router(profiles_router, prefix="/profiles", tags=["profiles"])
app.include_router(applications_router, prefix="/applications", tags=["applications"])
