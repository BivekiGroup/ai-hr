import { api } from '@/api/client'

export type Vacancy = {
  id: number
  title: string
  description: string
  seniority: string
  skills: string[]
  weights: Record<string, number>
  status: 'draft' | 'approved' | string
  details: Record<string, any>
  owner_id: number
  created_at: string
}

export type VacancyCreate = {
  title: string
  description: string
  seniority: string
  skills: string[]
  weights: Record<string, number>
  status?: 'draft' | 'approved' | string
  details?: Record<string, any>
}

export type VacancyUpdate = Partial<VacancyCreate>

export const listVacancies = () => api<Vacancy[]>('/vacancies')
export const listPublicVacancies = () => api<Vacancy[]>('/vacancies/public')
export const createVacancy = (payload: VacancyCreate) => api<Vacancy>('/vacancies', { method: 'POST', body: payload })
export const updateVacancy = (id: number, payload: VacancyUpdate) => api<Vacancy>(`/vacancies/${id}`, { method: 'PATCH', body: payload })

export async function uploadVacancyFile(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8080'}/vacancies/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  })
  if (!res.ok) {
    let msg = 'Upload failed'
    try {
      const data = await res.json()
      msg = data?.detail || JSON.stringify(data)
    } catch {
      msg = await res.text()
    }
    throw new Error(msg)
  }
  return res.json() as Promise<Vacancy>
}

export const approveVacancy = (id: number) => api<Vacancy>(`/vacancies/${id}/approve`, { method: 'POST' })
export const deleteVacancy = (id: number) => api<void>(`/vacancies/${id}`, { method: 'DELETE' })
export const archiveVacancy = (id: number) => api<Vacancy>(`/vacancies/${id}/archive`, { method: 'POST' })
export const unarchiveVacancy = (id: number) => api<Vacancy>(`/vacancies/${id}/unarchive`, { method: 'POST' })
export const revokeVacancy = (id: number) => api<Vacancy>(`/vacancies/${id}/revoke`, { method: 'POST' })
export type User = { id: number; email: string; name: string; role: string; created_at: string }
export const listUsers = (role?: string) => api<User[]>(`/auth/users${role ? `?role=${encodeURIComponent(role)}` : ''}`)
export const generateVacancy = (payload: { title?: string; seniority?: string; highlights?: string[]; details?: Record<string, any> }) => api<Vacancy>('/vacancies/generate', { method: 'POST', body: payload })

// Profiles (candidate)
export type Profile = { id: number; owner_id: number; summary: string; skills: string[]; details: Record<string, any>; created_at: string; updated_at: string }
export const getMyProfile = () => api<Profile>('/profiles/me')
export async function uploadProfileFile(file: File) {
  const fd = new FormData(); fd.append('file', file)
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8080'}/profiles/upload`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: fd })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<Profile>
}
export const generateProfile = (payload: { summary?: string; highlights?: string[]; details?: Record<string, any> }) => api<Profile>('/profiles/generate', { method: 'POST', body: payload })

// Applications
export type Application = {
  id: number
  vacancy_id: number
  candidate_id: number
  status: string
  match_score?: number | null
  verdict?: string | null
  notes?: string | null
  profile_snapshot: Record<string, any>
  created_at: string
}
export const applyToVacancy = (vacancy_id: number) => api<Application>('/applications', { method: 'POST', body: { vacancy_id } })
export const listMyApplications = () => api<Application[]>('/applications/me')
export const listHrApplications = () => api<Application[]>('/applications/hr')
export const updateApplication = (id: number, body: Partial<Pick<Application,'status'|'match_score'|'verdict'|'notes'>>) => api<Application>(`/applications/${id}`, { method: 'PATCH', body })
export const reassessApplication = (id: number) => api<Application>(`/applications/${id}/assess`, { method: 'POST' })
