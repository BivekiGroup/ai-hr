FROM python:3.11-slim
WORKDIR /app

# System deps for psycopg
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Install python deps
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    pydantic \
    email-validator \
    sqlalchemy \
    psycopg[binary] \
    passlib \
    bcrypt==3.2.2 \
    pyjwt \
    python-multipart \
    openai \
    pdfminer.six \
    python-docx \
    alembic

COPY app ./app
# Alembic migrations
COPY alembic.ini ./alembic.ini
COPY alembic ./alembic
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
