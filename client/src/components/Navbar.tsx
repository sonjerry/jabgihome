// client/src/components/Navbar.tsx
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState, useCallback } from 'react'
import AdminGate from './AdminGate'
import AudioDock from './AudioDock'

type Leaf = { path: string; label: string }
type Group = { label: string; children: Leaf[] }
type Item = Leaf | Group

function isGroup(item: Item): item is Group {
  return (item as Group).children !== undefined
}

/** 네비게이션 정의 */
const navItems: Item[] = [
  { path: '/', label: '홈' },
  { path: '/blog', label: '블로그' },
  {
    label: '갤러리',
    children: [
      { path: '/gallery', label: 'AI 그림 갤러리' },
      { path: '/modelgallery', label: '3D 모델 갤러리' },
    ],
  },
] as const

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // 라우트 변경 시 모바일 사이드바 닫기
  useEffect(() => { setOpen(false) }, [pathname])

  // 각 그룹의 열림 상태 관리
  const defaultOpenMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    for (const it of navItems) {
      if (isGroup(it)) {
        map[it.label] = it.children.some(c => pathname.startsWith(c.path))
      }
    }
    return map
  }, [pathname])

  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>(defaultOpenMap)
  useEffect(() => setGroupOpen(defaultOpenMap), [defaultOpenMap])

  const setOpenOf = useCallback((label: string, v: boolean) => {
    setGroupOpen(prev => ({ ...prev, [label]: v }))
  }, [])

  // 데스크탑에서 hover 시 열림/닫힘
  const onDesktopHover = (label: string, v: boolean) => {
    setOpenOf(label, v)
  }

  const ListItemBase = ({
    active,
    children,
    className = '',
  }: { active?: boolean; children: React.ReactNode; className?: string }) => (
    <div
      className={[
        'relative select-none pointer-events-auto', // 🔒 클릭 보장
        active ? 'bg-white/15 text-white font-semibold' : 'text-cream/90 hover:bg-white/10 hover:text-white',
        'before:absolute before:inset-y-1 before:left-0 before:w-[3px]',
        active ? 'before:bg-white/70' : 'hover:before:bg-white/50',
        'px-3 md:px-5 py-2 md:py-2.5',
        'rounded-none',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )

  const SidebarContent = () => (
    <div className="flex h-full flex-col pointer-events-auto"> {/* 🔒 전체 클릭 보장 */}
      {/* 헤더 */}
      <Link to="/" className="px-3 md:px-5 py-4 border-b border-white/10 flex items-center">
        <span className="font-bold text-amber-400 text-lg md:text-xl">
          이가을<span className="text-cream/80">·</span>블로그
        </span>
      </Link>

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {navItems.map((item) => {
          if (!isGroup(item)) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className="block"
              >
                {({ isActive }) => <ListItemBase active={isActive}>{item.label}</ListItemBase>}
              </NavLink>
            )
          }

          const label = item.label
          const opened = !!groupOpen[label]

          return (
            <div
              key={label}
              className="group/nav"
              onMouseEnter={() => onDesktopHover(label, true)}
              onMouseLeave={() => onDesktopHover(label, false)}
            >
              {/* 그룹 헤더 버튼 */}
              <button
                type="button"
                onClick={() => setOpenOf(label, !opened)}
                className="w-full text-left pointer-events-auto"  // 🔒
                aria-expanded={opened}
                aria-controls={`submenu-${label}`}
              >
                <ListItemBase active={opened} className="flex items-center justify-between">
                  <span>{label}</span>
                  <svg
                    width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                    className={['transition-transform duration-200', opened ? 'rotate-90' : 'rotate-0'].join(' ')}
                  >
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </ListItemBase>
              </button>

              {/* 하위 메뉴 */}
              <AnimatePresence initial={false}>
                {opened && (
                  <motion.div
                    id={`submenu-${label}`}
                    key={`${label}-submenu`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="pl-4 md:pl-6"
                  >
                    <ul className="py-1 space-y-[2px]">
                      {item.children.map((child) => (
                        <li key={child.path} className="pointer-events-auto"> {/* 🔒 */}
                          <NavLink to={child.path} className="block">
                            {({ isActive }) => (
                              <ListItemBase
                                active={isActive}
                                className="px-3 md:px-5 py-2 md:py-2.5 text-sm md:text-[15px]"
                              >
                                {child.label}
                              </ListItemBase>
                            )}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      {/* 오디오 도크 */}
      <div className="px-2 md:px-5 py-6">
        <AudioDock />
      </div>

      {/* 관리자 영역 */}
      <div className="px-3 md:px-5 py-3 border-t border-white/10">
        <AdminGate />
      </div>
    </div>
  )

  return (
    <>
      {/* 모바일: 열기 버튼 */}
      <button
        type="button"
        aria-label="Open sidebar"
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-[90] md:hidden rounded-full border border-white/15 bg-white/10 backdrop-blur px-2.5 py-2 hover:bg-white/15 active:scale-95 transition"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* 모바일 사이드바 */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] md:hidden" // 모바일 오버레이
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="mobile-sidebar"
              className="fixed left-0 top-0 h-screen z-[100] md:hidden glass border-r border-white/10 w-[33vw] min-w-[260px] max-w-[360px] pointer-events-auto"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            >
              <button
                type="button" aria-label="Close sidebar" onClick={() => setOpen(false)}
                className="absolute right-[-14px] top-1/2 -translate-y-1/2 z-[105] rounded-full border border-white/25 bg-white/20 hover:bg-white/30 shadow px-2.5 py-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 데스크탑 사이드바 (항상 최상위) */}
      <motion.aside
        className="hidden md:block fixed left-0 top-0 h-screen w-64 z-[120] glass border-r border-white/10 pointer-events-auto"
        initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <SidebarContent />
      </motion.aside>
    </>
  )
}
