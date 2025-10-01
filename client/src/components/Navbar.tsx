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

  return (
    <>
      {/* 상단/좌측 고정 사이드바 한 가지 형태만 사용 */}
      <aside
        className="hidden md:block fixed left-0 top-0 h-screen w-64 z-[100] isolate glass border-r border-white/10"
        role="navigation" aria-label="사이드바"
      >
        <SidebarContent navItems={navItems} groupOpen={groupOpen} setGroupOpen={setGroupOpen} />
      </aside>

      {/* 모바일 버튼 */}
      <button
        type="button" aria-label="Open sidebar" onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-[101] md:hidden rounded-full border border-white/15 bg-white/10 backdrop-blur px-2.5 py-2"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-[101] bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
          <aside
            className="fixed left-0 top-0 h-screen z-[102] md:hidden glass border-r border-white/10 w-[33vw] min-w-[260px] max-w-[360px]"
            role="dialog" aria-modal="true"
          >
            <button
              type="button" aria-label="Close sidebar" onClick={() => setMobileOpen(false)}
              className="absolute right-[-14px] top-1/2 -translate-y-1/2 z-[103] rounded-full border border-white/25 bg-white/20 px-2.5 py-2"
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
