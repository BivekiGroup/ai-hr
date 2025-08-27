export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

function getAccessToken(): string | null {
  return localStorage.getItem('access_token')
}

let refreshPromise: Promise<void> | null = null

async function tryRefresh(): Promise<void> {
  if (refreshPromise) return refreshPromise
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) throw new Error('No refresh token')
  refreshPromise = (async () => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) throw new Error('Refresh failed')
    const data = (await res.json()) as Tokens
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
  })()
  try {
    await refreshPromise
  } finally {
    refreshPromise = null
  }
}

export async function api<T>(path: string, options: { method?: HttpMethod; body?: any; headers?: Record<string, string> } = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getAccessToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

  let res = await doFetch()
  if (res.status === 401) {
    try {
      await tryRefresh()
      // retry once with new access token
      const newAccess = getAccessToken()
      if (newAccess) headers['Authorization'] = `Bearer ${newAccess}`
      res = await doFetch()
    } catch {
      // fallthrough to error
    }
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || res.statusText)
  }
  return res.json() as Promise<T>
}

export type Tokens = { access_token: string; refresh_token: string; token_type: string }

export type UserPublic = { id: number; email: string; name: string; role: string; created_at: string }
