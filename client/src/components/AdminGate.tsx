// components/AdminGate.tsx
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../state/auth'

export default function AdminGate() {
  const { role, loading, login, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // 관리자 전환되면 모달 자동 닫힘
  useEffect(() => {
    if (role === 'admin') setOpen(false)
  }, [role])

  // ESC 닫힘 + 바디 스크롤 잠금
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = prevOverflow
    }
  }, [open])

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (busy || pw.length === 0) return
      setErr(null)
      setBusy(true)
      try {
        await login(pw)
      } catch {
        setErr('로그인 실패: 비밀번호를 확인해 주세요.')
      } finally {
        setBusy(false)
      }
    },
    [busy, pw, login]
  )

  if (loading) {
    return <button className="glass px-3 py-1.5 rounded-xl text-sm opacity-70" disabled>관리자 확인중…</button>
  }

  if (role === 'admin') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-emerald-300 text-sm">관리자</span>
        <button onClick={logout} className="glass px-3 py-1.5 rounded-xl text-sm hover:bg-white/20">로그아웃</button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => { setErr(null); setPw(''); setOpen(true) }}
        className="glass px-3 py-1.5 rounded-xl text-sm hover:bg-white/20"
      >관리자</button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)} // 바깥 클릭 닫힘
        >
          <div
            className="glass w-full max-w-sm rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()} // 내용 클릭 전파 막기
          >
            <h3 className="text-lg font-semibold mb-3">관리자 로그인</h3>
            <form onSubmit={onSubmit} className="space-y-3">
              <label className="block text-sm">비밀번호</label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 outline-none"
                autoFocus
                disabled={busy}
              />
              {err && <p className="text-red-300 text-sm">{err}</p>}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20"
                >취소</button>
                <button
                  type="submit"
                  disabled={busy || pw.length === 0}
                  className="px-3 py-2 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 disabled:opacity-50"
                >{busy ? '확인 중…' : '로그인'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
