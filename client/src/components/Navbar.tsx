// client/src/components/Navbar.tsx
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import AdminGate from './AdminGate'
import AudioDock from './AudioDock'

type Leaf = { path: string; label: string }
type Group = { label: string; children: Leaf[] }
type Item = Leaf | Group
const isGroup = (i: Item): i is Group => (i as Group).children !== undefined

const navItems: Item[] = [
  { path: '/', label: '홈' },
  { path: '/blog', label: '블로그' },
  { path: '/projects', label: '프로젝트' },
  { label: '갤러리', children: [
    { path: '/gallery', label: 'AI 그림 갤러리' },
    { path: '/modelgallery', label: '3D 모델 갤러리' },
    
  ]},
  
] as const

export default function Navbar() {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => setMobileOpen(false), [pathname])

  const defaultOpen = useMemo(() => {
    const m: Record<string, boolean> = {}
    for (const it of navItems) if (isGroup(it)) m[it.label] = it.children.some(c => pathname.startsWith(c.path))
    return m
  }, [pathname])
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>(defaultOpen)
  useEffect(() => setGroupOpen(defaultOpen), [defaultOpen])

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
        if (typeof detail === 'number') {
          setReveal(detail)
          // 홈에서 reveal이 0이 되면 모바일 드로어도 닫기
          if (pathname === '/' && detail === 0) {
            setMobileOpen(false)
          }
        }
      } catch {}
    }
    window.addEventListener('home:reveal', onReveal as any)
    return () => window.removeEventListener('home:reveal', onReveal as any)
  }, [pathname])

  return (
    <>
      {/* 상단/좌측 고정 사이드바 - 홈 모바일에서는 기본 숨김, reveal 기반 */}
      {(() => {
        const showMobile = pathname === '/' && (reveal || 0) > 0.02
        return (
      <aside
        className={`fixed left-0 top-0 h-screen w-64 z-[100] isolate glass border-r border-white/10 ${pathname === '/' ? (showMobile ? 'block' : 'hidden md:block') : 'hidden md:block'}`}
        style={pathname === '/' ? {
          opacity: reveal,
          transform: `translateX(${(-20 * (1 - reveal || 0)).toFixed(2)}px)`,
          transition: 'transform 300ms ease, opacity 300ms ease'
        } : undefined}
        role="navigation" aria-label="사이드바"
      >
        <SidebarContent navItems={navItems} groupOpen={groupOpen} setGroupOpen={setGroupOpen} />
      </aside>
        )
      })()}

      {/* 모바일 버튼 - 홈에서는 reveal > 0일 때만 표시 */}
      {(pathname !== '/' || (pathname === '/' && reveal > 0)) && (
        <button
          type="button" aria-label="Open sidebar" onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-[101] md:hidden rounded-full border border-white/15 bg-white/10 backdrop-blur px-2.5 py-2 transform transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-white/15 hover:border-white/25"
          style={pathname === '/' ? {
            opacity: reveal,
            transform: `translateX(${(-20 * (1 - reveal || 0)).toFixed(2)}px) scale(1)`,
            transition: 'transform 300ms ease, opacity 300ms ease'
          } : undefined}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <>
          <div 
            className="fixed inset-0 z-[101] bg-black/40 md:hidden" 
            style={{
              animation: 'fadeInBackdrop 0.3s ease-out'
            }}
            onClick={() => {
              setMobileOpen(false)
              // 홈에서는 reveal도 0으로 설정
              if (pathname === '/') {
                try {
                  document.documentElement.style.setProperty('--home-reveal', '0')
                  window.dispatchEvent(new CustomEvent('home:reveal', { detail: 0 }))
                } catch {}
              }
            }} 
          />
          <aside
            className="fixed left-0 top-0 h-screen z-[102] md:hidden glass border-r border-white/10 w-[33vw] min-w-[260px] max-w-[360px] animate-slide-in-left"
            role="dialog" aria-modal="true"
            style={{
              animation: 'slideInFromLeft 0.3s ease-out'
            }}
          >
            <button
              type="button" aria-label="Close sidebar" onClick={() => {
                setMobileOpen(false)
                // 홈에서는 reveal도 0으로 설정
                if (pathname === '/') {
                  try {
                    document.documentElement.style.setProperty('--home-reveal', '0')
                    window.dispatchEvent(new CustomEvent('home:reveal', { detail: 0 }))
                  } catch {}
                }
              }}
              className="absolute right-[-14px] top-1/2 -translate-y-1/2 z-[103] rounded-full border border-white/25 bg-white/20 px-2.5 py-2 transform transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-white/30 hover:border-white/40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <SidebarContent navItems={navItems} groupOpen={groupOpen} setGroupOpen={setGroupOpen} />
          </aside>
        </>
      )}
    </>
  )
}

function SidebarContent({
  navItems,
  groupOpen,
  setGroupOpen,
}: {
  navItems: Item[]
  groupOpen: Record<string, boolean>
  setGroupOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="px-3 md:px-5 py-4 border-b border-white/10 flex items-center">
        <span className="font-bold text-amber-400 text-lg md:text-xl">
          잡기홈
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {navItems.map(item => {
          if (!isGroup(item)) {
            return (
              <NavLink key={item.path} to={item.path} end={item.path === '/'} className="block">
                {({ isActive }) => (
                  <div className={[
                    'relative select-none px-3 md:px-5 py-2 md:py-2.5 before:absolute before:inset-y-1 before:left-0 before:w-[3px]',
                    isActive ? 'bg-white/15 text-white font-semibold before:bg-white/70' : 'text-cream/90 hover:bg-white/10 hover:text-white hover:before:bg-white/50',
                  ].join(' ')}>{item.label}</div>
                )}
              </NavLink>
            )
          }
          const opened = !!groupOpen[item.label]
          return (
            <div key={item.label}>
              <button
                type="button" onClick={() => setGroupOpen(p => ({ ...p, [item.label]: !opened }))}
                className="w-full text-left"
                aria-expanded={opened} aria-controls={`submenu-${item.label}`}
              >
                <div className={[
                  'relative select-none px-3 md:px-5 py-2 md:py-2.5 flex items-center justify-between before:absolute before:inset-y-1 before:left-0 before:w-[3px]',
                  opened ? 'bg-white/15 text-white font-semibold before:bg-white/70' : 'text-cream/90 hover:bg-white/10 hover:text-white hover:before:bg-white/50',
                ].join(' ')}>
                  <span>{item.label}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                    className={opened ? 'rotate-90 transition-transform' : 'rotate-0 transition-transform'}>
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
              {opened && (
                <ul id={`submenu-${item.label}`} className="pl-4 md:pl-6 py-1 space-y-[2px]">
                  {item.children.map(child => (
                    <li key={child.path}>
                      <NavLink to={child.path} className="block">
                        {({ isActive }) => (
                          <div className={[
                            'relative select-none px-3 md:px-5 py-2 md:py-2.5 text-sm md:text-[15px] before:absolute before:inset-y-1 before:left-0 before:w-[3px]',
                            isActive ? 'bg-white/15 text-white font-semibold before:bg-white/70' : 'text-cream/90 hover:bg-white/10 hover:text-white hover:before:bg-white/50',
                          ].join(' ')}>{child.label}</div>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
      <div className="px-2 md:px-5 py-6"><AudioDock /></div>
      <div className="px-3 md:px-5 py-3 border-t border-white/10"><AdminGate /></div>
    </div>
  )
}
