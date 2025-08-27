export type Vacancy = {
  id: number
  title: string
  description: string
  seniority: 'Junior' | 'Middle' | 'Senior'
  skills: string[]
  score?: number
}

export const vacancies: Vacancy[] = [
  {
    id: 1,
    title: 'Data Analyst',
    description: 'SQL, Tableau/PowerBI, A/B, продуктовые метрики',
    seniority: 'Middle',
    skills: ['SQL', 'Tableau', 'Python', 'A/B'],
    score: 86,
  },
  {
    id: 2,
    title: 'Backend Engineer',
    description: 'FastAPI, Postgres, Redis, Docker, CI/CD',
    seniority: 'Middle',
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
    score: 82,
  },
  {
    id: 3,
    title: 'Product Manager',
    description: 'JTBD, CJM, аналитика, коммуникация',
    seniority: 'Senior',
    skills: ['JTBD', 'CJM', 'Analytics', 'Communication'],
    score: 78,
  },
]

export const kpis = [
  { label: '−40% время скрининга', value: 40 },
  { label: 'Precision@TopN ≥ 0.8', value: 80 },
  { label: 'Интервью ≤ 15 мин', value: 100 },
  { label: 'Ответ ≤ 1.5 сек', value: 100 },
]

export const features = [
  {
    title: 'Автоскрининг резюме',
    desc: 'Парсинг PDF/DOC, извлечение навыков, стажа и опыта.',
    tag: 'Resume Parser',
  },
  {
    title: 'Голосовое интервью',
    desc: 'Streaming ASR, адаптивные вопросы, анализ просодики.',
    tag: 'Realtime ASR',
  },
  {
    title: 'Скоринг и объяснимость',
    desc: 'Сводный балл, красные флаги, SHAP/feature importances.',
    tag: 'Scoring Engine',
  },
  {
    title: 'Отчёты и нотификации',
    desc: 'PDF/JSON отчёты для HR, персональный фидбек кандидату.',
    tag: 'Reports',
  },
]

