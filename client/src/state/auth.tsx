import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AuthAPI } from '../lib/api'

export type Role = 'admin' | 'guest'

export type AuthCtx = {
  role: Role
  loading: boolean
  login: (password: string) => Promise<void>
  logout: () => Promise<void>
}

type MeResponse = { role?: string }

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('guest')
  const [loading, setLoading] = useState(true)

  const normalizeRole = (r?: string): Role => (r === 'admin' ? 'admin' : 'guest')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = (await AuthAPI.me()) as MeResponse
        if (mounted) setRole(normalizeRole(res?.role))
      } catch {
        if (mounted) setRole('guest')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const login = async (password: string) => {
    await AuthAPI.login(password) // 실패 시 throw
    setRole('admin') // 성공하면 즉시 전환
  }

  const logout = async () => {
    try {
      await AuthAPI.logout()
    } finally {
      setRole('guest')
    }
  }

  const value = useMemo<AuthCtx>(() => ({ role, loading, login, logout }), [role, loading])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
