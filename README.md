# HR-Аватар для скрининга и интервью

Этот репозиторий содержит каркас проекта согласно спецификации из `ai-hr.md`.

- Структура каталогов соответствует разделу "Структура репозитория".
- Быстрый старт: скопируйте `.env.example` в `.env` и запустите `make run`.

Подробнее о целях, архитектуре, API и планах — см. `ai-hr.md` и файлы в `docs/`.

Полезное
- Документация API: `docs/api.md`
- Архитектура и стек: `docs/architecture.md`
- Авторизация и роли: раздел Auth в `docs/api.md` (есть пример bootstrap первого админа)

## Импорт вакансии из файла (Polza.ai)

HR может загрузить файл с описанием вакансии в кабинете HR. Бэкенд извлекает текст и вызывает LLM через Polza.ai (OpenAI‑совместимый Chat Completions API), чтобы получить нормализованную вакансию. Созданная запись сохраняется в статусе `draft` и отображается в списке, где её можно отредактировать и утвердить.

Переменные окружения:
- `POLZA_API_BASE` — базовый URL Polza API (по умолчанию `https://api.polza.ai/api/v1`)
- `POLZA_API_KEY` — ключ доступа Polza (обязателен)
- `POLZA_MODEL` — ID модели (например, `openai/gpt-4o` или Grok‑модель из списка Polza)

Эндпоинты:
- `POST /vacancies/upload` — multipart загрузка файла (`file`) → создаёт вакансию в статусе `draft`.
- `POST /vacancies/{id}/approve` — переводит вакансию в статус `approved`.

Примечание: cейчас извлечение текста из бинарных форматов (PDF/DOCX) — best‑effort (попытка декодирования). Для production стоит подключить pdfminer/python-docx и пр.
 
### PDF/DOCX парсинг

Подключены парсеры:
- PDF: `pdfminer.six`
- DOCX: `python-docx`

Файл определяется по расширению и `content-type`. Неподдерживаемые форматы падают с 400.

### Миграции (Alembic)

Добавлен Alembic для управления схемой БД. Миграция на добавление поля `status` в `vacancies` лежит в `apps/gateway/alembic/versions/`.

Запуск миграций (в контейнере API):

1. Соберите образ API, чтобы внутрь попали alembic-файлы.
2. Выполните:
   - `docker compose run --rm api alembic -c /app/alembic.ini upgrade head`

Локально (без Docker), из `apps/gateway`:
- `alembic upgrade head` (переменная `DB_URL` берётся из окружения)
