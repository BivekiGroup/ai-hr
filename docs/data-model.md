# Модель данных (основное)

Основа из `ai-hr.md` раздел 6.

- users: id, role, email, name, password_hash, created_at
- vacancies: id, title, description, seniority, weights(jsonb), skills(jsonb), owner_id
- candidates: id, name, email, phone, consent(bool), source, created_at
- resumes: id, candidate_id, raw_file_url, parsed(jsonb), skills(jsonb), total_experience_months
- interviews: id, candidate_id, vacancy_id, status, start_at, end_at, transcript_url, features(jsonb)
- answers: id, interview_id, question_id, text, timestamps(jsonb), prosody(jsonb), emotions(jsonb), coverage_score
- scores: id, interview_id, overall, tech, communication, cases, red_flags(jsonb), explanation(jsonb)
- events: id, type, payload(jsonb), actor_id, created_at

Индексы
- По `vacancy_id`, `skills` (GIN), полнотекст/семантический поиск в OpenSearch.

Примечания
- Для MVP реализована таблица `users` в Gateway; остальные — в соответствующих сервисах.
