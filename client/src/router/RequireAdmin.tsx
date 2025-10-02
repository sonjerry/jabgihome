// client/src/router/RequireAdmin.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth'

interface RequireAdminProps {
  children: React.ReactNode
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  const { role, loading } = useAuth()
  const location = useLocation()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-white/70 text-sm">권한 확인 중...</div>
      </div>
    )
  }
  
  if (role !== 'admin') {
    return (
      <Navigate 
        to="/blog" 
        state={{ from: location }} 
        replace 
      />
    )
  }
  
  return <>{children}</>
}
