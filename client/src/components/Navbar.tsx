// client/src/components/Navbar.tsx
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import AdminGate from './AdminGate'
import AudioDock from './AudioDock'

const tabs = [
  { path: '/', label: '홈' },
  { path: '/blog', label: '블로그' },
  { path: '/project', label: '프로젝트' },
  { path: '/gallery', label: '갤러리' },
] as const

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => { setOpen(false) }, [pathname])

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <Link to="/" className="px-3 md:px-5 py-4 border-b border-white/10 flex items-center">
        <span className="font-bold text-amber-400 text-lg md:text-xl">
          이가을<span className="text-cream/80">·</span>블로그
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {tabs.map((ti) => (
          <NavLink
            key={ti.path}
            to={ti.path}
            end={ti.path === '/'}
            className={({ isActive }) =>
              [
                'block rounded-r-full',
                'px-3 md:px-5 py-2 md:py-2.5',
                'text-sm md:text-base',
                isActive ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-cream/90',
              ].join(' ')
            }
          >
            {ti.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 md:px-5 py-6">
        <AudioDock />
      </div>

      <div className="px-3 md:px-5 py-3 border-t border-white/10">
        <AdminGate />
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        aria-label="Open sidebar"
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-[60] md:hidden rounded-full border border-white/15 bg-white/10 backdrop-blur px-2.5 py-2 hover:bg-white/15 active:scale-95 transition"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="mobile-sidebar"
              className="fixed left-0 top-0 h-screen z-50 md:hidden glass border-r border-white/10 w-[33vw] min-w-[260px] max-w-[360px]"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            >
              <button
                type="button" aria-label="Close sidebar" onClick={() => setOpen(false)}
                className="absolute right-[-14px] top-1/2 -translate-y-1/2 z-[55] rounded-full border border-white/25 bg-white/20 hover:bg-white/30 shadow px-2.5 py-2"
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

      <motion.aside
        className="hidden md:block fixed left-0 top-0 h-screen w-64 z-50 glass border-r border-white/10"
        initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <SidebarContent />
      </motion.aside>
    </>
  )
}
