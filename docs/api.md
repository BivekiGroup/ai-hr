# API

Сводный контракт и примеры запросов. Подробные сценарии — см. `ai-hr.md` (разделы 6–7).

Базовый URL для стенда: `http://localhost:8080`

Аутентификация: JWT Bearer (`Authorization: Bearer <access_token>`) для защищенных эндпоинтов.

## Auth

- POST `/auth/signup` — регистрация HR.
  - Request:
    {
      "email": "hr@company.com",
      "name": "HR User",
      "password": "Secret123!"
    }
  - Response 200:
    {
      "id": 1, "email": "hr@company.com", "name": "HR User", "role": "hr", "created_at": "..."
    }

- POST `/auth/login` — вход, выдает пару токенов.
  - Request:
    { "email": "hr@company.com", "password": "Secret123!" }
  - Response 200:
    { "access_token": "...", "refresh_token": "...", "token_type": "bearer" }

- POST `/auth/refresh` — обновление пары по `refresh_token`.
  - Request: { "refresh_token": "..." }

- POST `/auth/bootstrap-admin` — одноразовая инициализация первого администратора.
  - Только если в БД нет пользователей. Требуется секрет из `.env` (`ADMIN_BOOTSTRAP_TOKEN`).
  - Request:
    {
      "token": "<ADMIN_BOOTSTRAP_TOKEN>",
      "email": "admin@company.com",
      "name": "Admin",
      "password": "StrongPass123!"
    }

Роли:
- `admin`: полный доступ (модели, конфиги, онтология, пользователи).
- `hr`: управление вакансиями, просмотр кандидатов, запуск скрининга/интервью.
- `candidate` (зарезервировано): доступ к интервью/обратной связи.

Пример защиты эндпоинта (псевдо): `require_role("admin")`.

## Vacancies

- POST `/vacancies` — создать вакансию (role: hr|admin)
- GET `/vacancies/{id}` — получить профиль
- PATCH `/vacancies/{id}` — обновить
- GET `/vacancies/{id}/candidates?min_score=...` — список

Схема (пример ввода):
{
  "title": "Data Engineer",
  "description": "ETL, DWH, Airflow, SQL, Python",
  "seniority": "Middle",
  "skills": ["Python", "SQL", "Airflow", "Spark"],
  "weights": { "technical": 0.55, "communication": 0.25, "cases": 0.2 }
}

## Candidates

- POST `/candidates` — создать карточку
- POST `/candidates/{id}/resume` — загрузить резюме (multipart/form-data)
- GET `/candidates/{id}` — карточка + скоринги

## Screening

- POST `/screening/{candidate_id}/{vacancy_id}` — запустить скрининг
- GET `/screening/{id}/result` — результат

## Interview

- POST `/interviews` — создать сессию (WebRTC token, RTC config)
- WS `/interviews/{id}/stream` — аудио/текст стрим (ASR partials)
- GET `/interviews/{id}/transcript` — расшифровка

## Scoring & Reports

- POST `/interviews/{id}/score` — запустить скоринг
- GET `/interviews/{id}/report/hr` — отчёт HR (PDF/JSON)
- GET `/interviews/{id}/report/candidate` — фидбек

## Notifications

- POST `/notifications/send` — отправить сообщение кандидату

## Статусы и ошибки

- 401 — неавторизован/просроченный токен
- 403 — недостаточно прав
- 409 — конфликт (email занят и т.д.)
- 422 — валидация

## OpenAPI

Когда сервисы будут добавлены — соберём агрегированный OpenAPI для Gateway. Пока используйте этот файл как контракт и Postman/Bruno коллекцию (будет добавлена).
