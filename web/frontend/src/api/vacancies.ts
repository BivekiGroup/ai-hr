import { api } from '@/api/client'

export type Vacancy = {
  id: number
  title: string
  description: string
  seniority: string
  skills: string[]
  weights: Record<string, number>
  owner_id: number
  created_at: string
}

export type VacancyCreate = {
  title: string
  description: string
  seniority: string
  skills: string[]
  weights: Record<string, number>
}

export type VacancyUpdate = Partial<VacancyCreate>

export const listVacancies = () => api<Vacancy[]>('/vacancies')
export const createVacancy = (payload: VacancyCreate) => api<Vacancy>('/vacancies', { method: 'POST', body: payload })
export const updateVacancy = (id: number, payload: VacancyUpdate) => api<Vacancy>(`/vacancies/${id}`, { method: 'PATCH', body: payload })

