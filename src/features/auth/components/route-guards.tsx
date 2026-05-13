import { useAuth } from '@/features/auth/context/auth-context'
import { Navigate, Outlet } from 'react-router-dom'
import { LoadingState } from '@/components/shared/loading-state'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingState />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingState />
  if (user) return <Navigate to="/" replace />

  return <Outlet />
}
