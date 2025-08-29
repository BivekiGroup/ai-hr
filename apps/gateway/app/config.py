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

# Polza.ai (OpenAI-compatible) settings
POLZA_API_BASE = os.getenv("POLZA_API_BASE", "https://api.polza.ai/api/v1")
POLZA_API_KEY = os.getenv("POLZA_API_KEY", "")
# Model is configurable; e.g. 'openai/gpt-4o' or Grok variant from Polza's model list
POLZA_MODEL = os.getenv("POLZA_MODEL", "openai/gpt-4o")

# Threshold for auto-invite to AI call (0..100)
INVITE_THRESHOLD = float(os.getenv("INVITE_THRESHOLD", "65"))
