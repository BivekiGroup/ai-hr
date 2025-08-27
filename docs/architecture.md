# Архитектура

Основывается на `ai-hr.md` (разделы 3–5, 16–18).

Ключевые компоненты
- Frontend (React+Vite+shadcn/ui): лендинг, кабинеты HR/Админ/Кандидат, WebRTC-клиент.
- API Gateway (FastAPI): аутентификация, маршрутизация, агрегация Swagger, rate limiting (позже), RBAC.
- Сервисы: auth (в составе gateway), vacancies, candidates, screening, interviews (WS), scoring, reports, notifications.
- ML-сервисы: asr (streaming), nlp_parser (резюме), dialog_orchestrator, softskills, model_server.
- Хранилища: PostgreSQL (основные данные), Redis (кэш/сессии), OpenSearch (поиск по навыкам/резюме), MinIO/S3 (файлы/медиа).
- Observability: Prometheus, Grafana, Loki (папка `infra/grafana_prometheus`).

Данные и модели
- Основные таблицы — см. `ai-hr.md` (раздел 6). Индексы по skills, vacancy_id; полнотекст в OpenSearch.
- Версионирование моделей и метрик — DVC/MLflow (планируется).

Инфра
- Docker Compose для локального стенда (Postgres, Redis, MinIO, OpenSearch, API, Frontend).
- Переменные окружения — `.env` (см. пример в `ai-hr.md` и `.env.example`).
- K8s манифесты — `infra/k8s` (заготовка).

Безопасность
- JWT + RBAC, шифрование (TLS/SSE-KMS), audit log (сервис `events` планируется).
- Bootstrap первого администратора по секрету `ADMIN_BOOTSTRAP_TOKEN`.

Флоу (E2E)
1) HR создает вакансию → профиль компетенций → приглашение кандидатов.
2) Кандидат загружает резюме → автоскрининг → интервью (голос/чат).
3) Аналитика/скоринг → отчеты для HR и фидбек кандидату → нотификации.

План раскатки
- Шаг 1: Auth + Vacancies + Candidates (готова Auth в составе gateway).
- Шаг 2: Interviews (WS) + ASR streaming + Orchestrator (MVP).
- Шаг 3: Scoring + Reports + PDF/JSON.
- Шаг 4: Observability, нотификации, CI/CD артефакты.
