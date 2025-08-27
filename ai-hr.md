# HR-Аватар для скрининга и интервью

Полный проектный файл: стек, архитектура, флоу, API, схемы данных, MLOps, безопасность, план работ, сценарий демо и артефакты под загрузку на хакатон.

---

## 1) Цели и KPI

**Цель:** автоматизировать первичный отбор кандидатов (скрининг + интервью) и выдать прозрачное решение с объяснимым скорингом.

**KPI продукта:**

- Сокращение времени скрининга на ≥40%.
- Точность «попадания» в нужный профиль (Precision\@TopN) ≥0.8.
- Средняя длительность интервью ≤15 мин при сохранении полноты оценивания.
- Доля решений с прозрачным объяснением 100% (каждое решение сопровождается аргументами).
- Удовлетворённость HR (CSAT) ≥4.5/5.

**KPI системного качества:**

- WER (ошибки распознавания речи) ≤10% на рус/англ.
- Время ответа диалогового агента ≤1.5 сек.
- SLA аптайм ≥99% (демо/стенд).

---

## 2) Пользовательские персоны и сценарии

**HR:** создаёт профиль вакансии, настраивает веса, смотрит отчёты, принимает решения.
**Кандидат:** загружает резюме, проходит интервью (голос/чат), получает персональную обратную связь.
**Админ/DevRel:** управляет конфигами, моделями, правами, демо-данными.

**Сценарии (end-to-end):**

1. HR создаёт вакансию → система строит профиль → приглашение кандидатов.
2. Кандидат загружает резюме → автоскрининг → приглашение на интервью.
3. Голосовое интервью с динамическими вопросами → расшифровка → аналитика.
4. Автоскоринг + отчёт для HR → фидбек кандидату.

---

## 3) Архитектура (высокий уровень)

Микросервисный/модульный подход, все сервисы за **API Gateway**, события в **Event Bus**. Медиа и файлы — в объектном хранилище.

**Диаграмма (словесно):**

- **Frontend** (web) ←→ **API Gateway** ←→ Backend-сервисы.
- **Auth** (JWT, OAuth2) с RBAC.
- **Resume Parser (NLP)**, **Vacancy Profiler**, **Scoring Engine**.
- **Interview Orchestrator** (диалог), **ASR** (speech-to-text), **Affect & Prosody** (эмоции/паузы), **NLG** (ответы/вопросы).
- **Reports** (HR & Candidate), **Notifications** (email/телега/смс).
- **DB (PostgreSQL)** + **Search (OpenSearch/Elastic)** + **Cache (Redis)**.
- **Object Storage (S3-совместимое, Яндекс Облако)**.
- **MLOps**: модели, версии, инференс на GPU (FastAPI Triton/ONNXRuntime), отслеживание метрик (MLflow).
- **Observability**: Prometheus, Grafana, Loki, OpenTelemetry.

---

## 4) Технологический стек

**Frontend:**

- React + TypeScript, Vite/Next.js.
- UI: shadcn/ui, Tailwind CSS, Zustand/Redux Toolkit.
- WebRTC для звонков, WaveSurfer.js для визуализации аудио, socket.io для стрима.

**Backend (Core):**

- Python 3.11, FastAPI.
- Celery/RQ для фоновых задач.
- gRPC/HTTP для межсервисного взаимодействия.
- Pydantic для схем, SQLAlchemy для ORM.

**Data & Storage:**

- PostgreSQL (основные данные), Redis (кэш/сессии), OpenSearch/Elastic (поиск навыков/резюме), MinIO или Яндекс Облако S3 (файлы и медиа).

**ML/AI:**

- ASR: Vosk/Silero/Whisper (многоязычие). Для онлайна — streaming ASR (WhisperX/faster-whisper).
- NLP: spaCy/RuBERT/m-BERT, sentence-transformers для эмбеддингов; keyphrase extraction (YAKE/KeyBERT); NER для навыков/компаний.
- Диалог: LLM через локальный сервер или облачный провайдер; RAG (FAISS/HNSW/OpenSearch kNN) для подтягивания контекста вакансии.
- Эмоции/просодика: Opensmile/pyAudioAnalysis, кремниевая модель классификации эмоций; паузы и темп речи (VAD + фичи MFCC).
- Оценивание: rule-based + ML-классификатор/регрессия (LightGBM/XGBoost) поверх фич.

**DevOps & Infra:**

- Docker + docker-compose (демо), Kubernetes (опционально), Nginx (ingress), Caddy (TLS автоматизация).
- CI/CD: GitHub Actions (линт, тесты, сборка, деплой на стенд).
- Мониторинг: Prometheus + Grafana, Loki, Alertmanager.

**Безопасность и комплаенс:**

- JWT + RBAC, audit log, шифрование в покое (S3 SSE/KMS) и в транзите (TLS),
- Маскирование PII, политика ретенции данных, журнал доступа.

---

## 5) Сервисы (детально)

### 5.1 API Gateway

- Rate limiting, auth, маршрутизация.
- Swagger/OpenAPI агрегатор.

### 5.2 Auth Service

- Регистрация HR/Админ/Кандидат.
- OAuth2 Password/Code, JWT, refresh-токены.
- RBAC: роли, политики (OPA/декораторы).

### 5.3 Vacancy Profiler

- Ввод требований вакансии → нормализация → профиль компетенций.
- Онтология навыков (граф родственных скиллов, синонимы).
- Веса критериев (например: tech=50%, comm=30%, cases=20%).

### 5.4 Resume Parser (NLP)

- Импорт PDF/DOC/TXT/LinkedIn.
- Извлечение: опыт (компания, период, роль), навыки, образование, достижения.
- Нормализация дат и стажа; дедупликация навыков; confidence scores.

### 5.5 Interview Orchestrator

- Сценарии → «сцены»: приветствие, мотивация, hard, soft, кейс, завершение.
- Динамика: разветвления по подтверждённым/неподтверждённым навыкам.
- Поддержка голос/чат, паузы, переспрашивание.

### 5.6 Realtime ASR

- VAD, шумоподавление, стриминг, частичные гипотезы.
- Языковые модели ru/en; посткоррекция (LM rescoring).

### 5.7 NLP Scoring

- Сопоставление ответов с требованиями: intent → skill mapping.
- Проверка противоречий (стаж по резюме vs в ответах).
- Выявление шаблонных/уклончивых ответов (поведенческие правила + семантика).

### 5.8 Soft Skills Analyzer

- Просодика: темп, паузы, колебания тона.
- Эмоции (valence/arousal/категории).
- Логичность и структура ответа (coherence, coverage ключей).

### 5.9 Scoring Engine

- Итоговый скоринг: `score = Σ(weight_i * normalized_metric_i)`.
- Нормализация метрик по перцентилям/мин-макс.
- Правила отсечения (red flags) и пороги рекомендаций.

### 5.10 Reports & Explanations

- Для HR: % соответствия, объяснение (SHAP/feature importances/правила), сильные/слабые стороны, флаги.
- Для кандидата: персональная обратная связь (тон ненавязчивый).
- Экспорт: PDF, CSV/XLSX, JSON.

### 5.11 Notifications

- Email + Webhooks + Telegram бот (опц.)
- Шаблоны для разных исходов.

### 5.12 Admin/Config

- Версии моделей, фичфлаги, пороги.
- Управление онтологией навыков.

---

## 6) Модель данных (основные таблицы)

**users**: id, role, email, name, password_hash, created_at.

**vacancies**: id, title, description, seniority, weights(jsonb), skills(jsonb), owner_id.

**candidates**: id, name, email, phone, consent(bool), source, created_at.

**resumes**: id, candidate_id, raw_file_url, parsed(jsonb), skills(jsonb), total_experience_months.

**interviews**: id, candidate_id, vacancy_id, status, start_at, end_at, transcript_url, features(jsonb).

**answers**: id, interview_id, question_id, text, timestamps(jsonb), prosody(jsonb), emotions(jsonb), coverage_score.

**scores**: id, interview_id, overall, tech, communication, cases, red_flags(jsonb), explanation(jsonb).

**events**: id, type, payload(jsonb), actor_id, created_at (аудит).

Индексы по `skills`, `vacancy_id`, полнотекстовый поиск по резюме (OpenSearch/Elastic).

---

## 7) API (черновой контракт)

**Auth**

- `POST /auth/signup` (HR/Админ)
- `POST /auth/login`
- `POST /auth/refresh`

**Vacancies**

- `POST /vacancies` — создать.
- `GET /vacancies/{id}` — профиль.
- `PATCH /vacancies/{id}` — обновить веса/навыки.
- `GET /vacancies/{id}/candidates?min_score=...` — список.

**Candidates**

- `POST /candidates` — создать карточку.
- `POST /candidates/{id}/resume` — загрузить резюме.
- `GET /candidates/{id}` — карточка + скоринги.

**Screening**

- `POST /screening/{candidate_id}/{vacancy_id}` — запустить.
- `GET /screening/{id}/result` — результат.

**Interview**

- `POST /interviews` — создать сессию (webrtc token, rtc config).
- `WS /interviews/{id}/stream` — аудио/текст стрим (ASR partials).
- `GET /interviews/{id}/transcript` — расшифровка.

**Scoring & Reports**

- `POST /interviews/{id}/score` — запустить скоринг.
- `GET /interviews/{id}/report/hr` — отчёт HR (PDF/JSON).
- `GET /interviews/{id}/report/candidate` — фидбек.

**Notifications**

- `POST /notifications/send` — отправить сообщение кандидату.

---

## 8) Алгоритмы и формулы

**Веса критериев (пример):**

```json
{
  "technical": 0.5,
  "communication": 0.3,
  "cases": 0.2
}
```

**Итоговый балл:**

```
score_overall = 100 * (0.5 * tech_norm + 0.3 * comm_norm + 0.2 * cases_norm) - penalties
```

Где `penalties` включают красные флаги: уклонение (−5…−15), противоречия (−5…−20).

**Tech score (пример):**

- Coverage ключевых навыков (0–1), глубина ответов (BM25/RAG-покрытие), конкретика (наличие метрик/кейсов), точность терминов.
- Модель регрессии (LightGBM) по фичам: tf-idf/эмбеддинги, длина, density терминов, корректность.

**Communication score:**

- Просодика: темп (слов/мин), паузы (частота/длина), стабильность тона.
- Лингвистика: связность (entity grid), структура (введение→суть→пример→вывод).

**Cases score:**

- Четкость постановки задачи, решение, альтернативы, результаты (метрики/ROI).

**Explainability:**

- Feature importances/SHAP + правила (например, «SQL покрыт на 80%, нет примеров оптимизации JOIN»).

---

## 9) Диалоговые сценарии (примерный флоу)

**Stage 0. Приветствие:** цель, длительность, согласие на запись.

**Stage 1. Мотивация/контекст:** «Почему наша компания? Какой продукт интересен?»

**Stage 2. Tech:** адаптивные ветки по ключевым скиллам из резюме и вакансии.

**Stage 3. Cases:** STAR-подход (Situation, Task, Action, Result), вопросы по результатам.

**Stage 4. Soft skills:** конфликт, приоритизация, работа с неопределённостью.

**Stage 5. Финал:** зарплатные ожидания, срок выхода, вопросы кандидата.

**Обработка пауз/эмоций:** уточнения, переформулировка, пауза до 2–3 сек.

---

## 10) UX/UI (ключевые экраны)

**Кабинет HR:**

- Список вакансий (фильтры, сорт по % соответствия).
- Деталка кандидата: резюме, стенограмма, графики просодики, объяснимость скоринга, флаги.
- Настройки весов/порогов, экспорт отчётов.

**Кандидат:**

- Загрузка резюме, проверка микрофона, пробный тест аудио.
- Окошко интервью: индикатор записи, подсказки, таймлайн вопросов.
- После — персональная обратная связь.

---

## 11) Безопасность и приватность

- Получаем явное согласие (checkbox + журнал).
- Шифрование: TLS в транзите; S3 SSE-KMS в хранилище; пароли — bcrypt/argon2.
- PII-маскирование в логах; доступ строго по ролям.
- Политика хранения: удаление сырого аудио через N дней, хранение только фич/метрик.
- Верификация запросов на удаление данных (DSR).

---

## 12) Data & MLOps

- **Версионирование данных/моделей:** DVC + MLflow.
- **Тренинг:** офлайн на корпусе резюме и стенограмм (анонимизация).
- **Оценка:** holdout + кросс-валидация; метрики WER/MAE/F1.
- **Онлайн-мониторинг:** drift эмбеддингов, качество распознавания.
- **Каталог фич:** feature store (Feast) — опц.

---

## 13) Нагрузочное и качество

- Латентность: ASR partial < 500 мс, полнота ответа < 2 сек.
- Concurrency: ≥100 одновременных интервью (демо — 10–20).
- Тесты: unit (pytest), интеграционные (Testcontainers), e2e (Playwright/Cypress).

---

## 14) План работ (до дедлайна)

**Неделя 1 (до 02.09):**

- Базовый бэкенд (Auth, Vacancies, Candidates), загрузка резюме.
- Resume Parser MVP, профиль вакансии, первичный скоринг.
- UI: формы вакансий, листинг кандидатов, карточка кандидата (MVP).

**Неделя 2 (до 09.09):**

- Голосовой интервьюер: стрим ASR + оркестратор, 3–4 ветки вопросов.
- Scoring Engine v1 + отчёты PDF/JSON, объяснения.
- Нотификации и демо-скрипт. Мониторинг. Подготовка артефактов.

---

## 15) Артефакты для хакатона

1. **Репозиторий (GitHub/GitLab)** — публичная ссылка.
2. **Архив исходников** — экспорт из VCS.
3. **Видео-демо ≤5 мин** — сценарий ниже.
4. **Презентация .pdf** — шаблон ниже.
5. **Развёрнутый стенд** — docker-compose up в облаке; данные в Яндекс Диск.

**Инструкция выгрузки в Яндекс Диск:** сборка артефактов в `/dist` и загрузка через CLI/веб, ссылки в README.

---

## 16) Структура репозитория

```
hr-avatar/
├─ apps/
│  ├─ gateway/ (FastAPI, reverse proxy configs)
│  ├─ auth/
│  ├─ vacancies/
│  ├─ candidates/
│  ├─ screening/
│  ├─ interviews/ (WS, WebRTC tokens)
│  ├─ scoring/
│  ├─ reports/
│  └─ notifications/
├─ services/
│  ├─ asr/
│  ├─ nlp_parser/
│  ├─ dialog_orchestrator/
│  ├─ softskills/
│  └─ model_server/
├─ web/
│  └─ frontend/ (React+TS)
├─ infra/
│  ├─ db/ (migrations, alembic)
│  ├─ docker/
│  ├─ k8s/ (опц.)
│  └─ grafana_prometheus/
├─ data/
│  ├─ ontology/
│  └─ samples/
├─ notebooks/
├─ docs/
│  ├─ api.md
│  ├─ architecture.md
│  └─ presentation.pdf (генерация скриптом)
├─ scripts/
│  ├─ prepare_demo.sh
│  ├─ export_reports.py
│  └─ upload_to_yadisk.py (опц.)
├─ docker-compose.yml
├─ Makefile
├─ .github/workflows/ci.yml
└─ README.md
```

---

## 17) docker-compose (MVP, пример)

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: hr
      POSTGRES_PASSWORD: hrpass
      POSTGRES_DB: hriq
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
  redis:
    image: redis:7
    ports: ["6379:6379"]
  minio:
    image: bitnami/minio:latest
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: admin12345
    ports: ["9000:9000", "9001:9001"]
    volumes:
      - minio:/data
  opensearch:
    image: opensearchproject/opensearch:2
    environment:
      - discovery.type=single-node
      - plugins.security.disabled=true
    ports: ["9200:9200"]
  api:
    build: ./apps/gateway
    env_file: .env
    depends_on: [postgres, redis, minio, opensearch]
    ports: ["8080:8080"]
  frontend:
    build: ./web/frontend
    ports: ["3000:3000"]
volumes:
  pgdata:
  minio:
```

---

## 18) Переменные окружения (.env, пример)

```
DB_URL=postgresql+psycopg://hr:hrpass@postgres:5432/hriq
REDIS_URL=redis://redis:6379/0
S3_ENDPOINT=http://minio:9000
S3_BUCKET=hr-avatar
S3_ACCESS_KEY=admin
S3_SECRET_KEY=admin12345
JWT_SECRET=change_me
ASR_MODEL=whisper-small
EMBEDDINGS_MODEL=all-mpnet-base-v2
SEARCH_ENDPOINT=http://opensearch:9200
```

---

## 19) Примеры сущностей (JSON)

**Vacancy (input):**

```json
{
  "title": "Data Engineer",
  "description": "ETL, DWH, Airflow, SQL, Python",
  "seniority": "Middle",
  "skills": ["Python", "SQL", "Airflow", "Spark"],
  "weights": { "technical": 0.55, "communication": 0.25, "cases": 0.2 }
}
```

**Resume (parsed):**

```json
{
  "candidate_id": 101,
  "skills": { "Python": 0.9, "SQL": 0.8, "Airflow": 0.6 },
  "experience_months": 48,
  "positions": [
    {
      "company": "Acme",
      "role": "Data Engineer",
      "from": "2021-01",
      "to": "2024-08"
    }
  ]
}
```

**Score (output):**

```json
{
  "overall": 82,
  "technical": 84,
  "communication": 78,
  "cases": 80,
  "red_flags": ["нет конкретных примеров оптимизации запросов"],
  "explanation": {
    "top_positive": ["Покрытие Python 90%", "Spark/ETL кейсы"],
    "top_negative": ["SQL тюнинг не подтвержден"]
  },
  "recommendation": "next_step"
}
```

---

## 20) Отчёты

**HR-отчёт (PDF):**

- Краткая карточка: ФИО, общий балл, статус.
- Разбивка по компетенциям (радиальная диаграмма).
- Сильные/слабые стороны.
- Флаги (противоречия, уклонения).
- Рекомендация + объяснение.

**Фидбек кандидату (email/page):**

- Благодарность, общий результат, 2–3 пункта на развитие.

---

## 21) Этические аспекты и анти-бias

- Исключаем запрещённые признаки (пол, возраст и т.п.) из фич.
- Проводим A/B на разных группах, сравниваем распределения баллов.
- Прозрачные правила и право на апелляцию.

---

## 22) Тестовый набор для демо (минимум)

- 3 вакансии (Data Analyst, Backend Eng, PM).
- 10 резюме (реалистичные, анонимизированные).
- 3 записи коротких интервью (ру/ен) + «живое» интервью.

---

## 23) Сценарий видео-демо (≤5 мин)

1. Вводная: проблема и цель (20 сек).
2. Создание вакансии + настройка весов (40 сек).
3. Загрузка резюме → автоскоринг (40 сек).
4. Голосовое интервью: 2–3 вопроса с адаптацией (90 сек).
5. Отчёт HR + фидбек кандидату (60 сек).
6. Выгрузка артефактов и ссылки (30 сек).

---

## 24) Презентация (.pdf) — структура

- Слайд 1: Проблема и рынок.
- Слайд 2: Решение (архитектура).
- Слайд 3: Флоу и дифференциация.
- Слайд 4: Демонстрация (скриншоты).
- Слайд 5: Технологии и модели.
- Слайд 6: Результаты/метрики.
- Слайд 7: План развития.
- Слайд 8: Команда и роли.

---

## 25) Роли и ответственность

- **ML х2:** ASR, NLP, скоринг, объяснимость, MLOps.
- **Backend:** API, БД, интеграции, стриминг, отчёты.
- **DevRel:** демо, презентация, документация, стенд/видео.
- **(Опц.) Frontend-усиление:** графики, UX интервью.

---

## 26) Риски и план B

- ASR даёт высокий WER → fallback на текстовый чат, доп. шумоподавление.
- Недостаточно данных для оценки soft skills → упор на структурность ответа и кейсы.
- Ограниченные ресурсы GPU → сжатые/квантизованные модели, батчинг.

---

## 27) Быстрые заготовки (Makefile)

```
setup: ## create venv & install
	python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
run: ## run api & web
	docker-compose up --build
lint:
	ruff check . || true
format:
	ruff check --fix .
```

---

## 28) Чек-лист готовности к сдаче

- [ ] Репозиторий оформлен, README с инструкциями.
- [ ] docker-compose запускает стенд локально.
- [ ] Заготовленные вакансии/резюме/интервью доступны.
- [ ] Работает автоскрининг и базовый скоринг.
- [ ] Интервью с ИИ (стрим ASR) на 2 языках.
- [ ] Формируется HR-отчёт и фидбек кандидату.
- [ ] Видео-демо записано, PDF-презентация загружена в Я.Диск.

---

## 29) Лицензии и третьи стороны (пример)

- Whisper (MIT), Vosk (Apache-2.0), spaCy (MIT), sentence-transformers (Apache-2.0).
- Tailwind (MIT), FastAPI (MIT), Redis (BSD), Postgres (PostgreSQL License).

---

## 30) Roadmap (после хакатона)

- Голосовой TTS-аватар (реалистичный), видео-аватар (lip-sync).
- Более тонкая оценка soft skills (дискурсивные метрики, turn-taking).
- Конструктор сценариев интервью для HR.
- Интеграции с ATS (Greenhouse, Lever), календари.

---

**Готово.** Этот файл можно положить в `README.md` репозитория и разворачивать MVP по разделу 17. При желании — добавлю шаблоны Swagger и пример Alembic-миграций.
