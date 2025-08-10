import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth'

export default function RequireAdmin({ children }: { children: JSX.Element }) {
  const { role, loading } = useAuth()
  const loc = useLocation()
  if (loading) return null
  if (role !== 'admin') return <Navigate to="/blog" state={{ from: loc }} replace />
  return children
}