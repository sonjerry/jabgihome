// client/src/components/ContactDock.tsx
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import GlassCard from './GlassCard'

export default function ContactDock() {
  const { pathname } = useLocation()

  // 홈에서만 Home이 주입하는 CSS 변수('--home-reveal')를 읽어 슬라이드/페이드 처리
  const [reveal, setReveal] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    const root = getComputedStyle(document.documentElement).getPropertyValue('--home-reveal')
    const body = getComputedStyle(document.body).getPropertyValue('--home-reveal')
    return Number(root || body || 0) || 0
  })

  useEffect(() => {
    const onReveal = (e: Event) => {
      try {
        const detail = (e as CustomEvent<number>).detail
        if (typeof detail === 'number') setReveal(detail)
      } catch {}
    }
    window.addEventListener('home:reveal', onReveal as any)
    return () => window.removeEventListener('home:reveal', onReveal as any)
  }, [])

  // 홈이 아닌 경로에서는 표시하지 않음
  if (pathname !== '/') return null

  return createPortal(
    <aside
      className="hidden md:block fixed right-0 bottom-0 z-[11] w-full p-4 md:p-8 pointer-events-none"
      aria-label="Contact dock"
      style={{
        opacity: reveal,
        transform: `translateY(${(48 * (1 - reveal || 0)).toFixed(2)}px)`,
        transition: 'transform 360ms ease, opacity 300ms ease'
      }}
    >
      <div className="w-full flex justify-end pointer-events-auto">
        <div className="w-[min(92%,360px)]">
          <GlassCard className="p-6 md:p-6 flex flex-col justify-end pointer-events-auto">
            <div className="mt-auto">
              <h2 className="text-lg md:text-xl font-semibold text-white/80 mb-3">Contact Me</h2>
              <div className="flex flex-col gap-2">
                <a
                  href="https://github.com/sonjerry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl border border-white/15 bg-white/10 hover:bg-white/20 backdrop-blur px-3 py-2 transition pointer-events-auto"
                >
                  <div className="text-[10px] md:text-xs text-white/70">GitHub</div>
                  <div className="text-sm md:text-base font-semibold">sonjerry</div>
                </a>
                <a
                  href="mailto:qh.e.720@icloud.com"
                  className="block rounded-2xl border border-white/15 bg-white/10 hover:bg-white/20 backdrop-blur px-3 py-2 transition pointer-events-auto"
                >
                  <div className="text-[10px] md:text-xs text-white/70">Email</div>
                  <div className="text-sm md:text-base font-semibold">qh.e.720@icloud.com</div>
                </a>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </aside>,
    document.body
  )
}


