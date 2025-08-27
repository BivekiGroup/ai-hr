import os


# По умолчанию используем Postgres из docker-compose, как в ai-hr.md
DB_URL = os.getenv(
    "DB_URL",
    "postgresql+psycopg://hr:hrpass@postgres:5432/hriq",
)
JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
JWT_ALG = "HS256"
ACCESS_TOKEN_MIN = int(os.getenv("ACCESS_TOKEN_MIN", "30"))
REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS", "7"))
ADMIN_BOOTSTRAP_TOKEN = os.getenv("ADMIN_BOOTSTRAP_TOKEN", "")
