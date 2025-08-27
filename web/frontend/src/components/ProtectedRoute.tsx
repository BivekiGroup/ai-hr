import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

type Role = 'admin' | 'hr' | 'candidate'

export function ProtectedRoute({ allow }: { allow: Role[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!allow.includes(user.role as Role)) return <Navigate to="/" replace />
  return <Outlet />
}
