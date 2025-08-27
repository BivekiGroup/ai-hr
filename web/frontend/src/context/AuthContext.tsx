import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { api } from '@/api/client'
import type { Tokens, UserPublic } from '@/api/client'

type JWTPayload = { sub: string; role: 'admin' | 'hr' | string; exp: number }

type User = { email: string; role: 'admin' | 'hr' | string }

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const setTokens = (tokens: Tokens) => {
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
  }

  const decodeUser = (access: string): User | null => {
    try {
      const payload = jwtDecode<JWTPayload>(access)
      return { email: payload.sub, role: payload.role }
    } catch {
      return null
    }
  }

  useEffect(() => {
    const access = localStorage.getItem('access_token')
    if (!access) return
    // Prefer getting user from API to avoid trusting client-side decode
    api<UserPublic>('/auth/me')
      .then((u) => setUser({ email: u.email, role: u.role }))
      .catch(() => setUser(decodeUser(access)))
  }, [])

  const login = async (email: string, password: string) => {
    const tokens = await api<Tokens>('/auth/login', { method: 'POST', body: { email, password } })
    setTokens(tokens)
    try {
      const me = await api<UserPublic>('/auth/me')
      setUser({ email: me.email, role: me.role })
    } catch {
      setUser(decodeUser(tokens.access_token))
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    await api('/auth/signup', { method: 'POST', body: { name, email, password } })
    // auto-login after signup
    await login(email, password)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, signup, logout }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
