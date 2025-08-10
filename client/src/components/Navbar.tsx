import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import AdminGate from './AdminGate'
import { useI18n } from '../lib/i18n'
import  AudioDock  from './AudioDock'
const tabs = [
  { path: '/', key: 'home' },
  { path: '/blog', key: 'blog' },
  { path: '/chat', key: 'chatbot' },
  { path: '/gallery', key: 'gallery' },
] as const

export default function Navbar() {
  const { t } = useI18n()

  return (
    // 왼쪽 고정 사이드바 (모바일 w-20, md 이상 w-64)
    <motion.aside
      className="fixed left-0 top-0 h-screen w-20 md:w-64 z-50 glass border-r border-white/10"
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <div className="flex h-full flex-col">
        {/* 로고 */}
        <Link
          to="/"
          className="px-3 md:px-5 py-4 border-b border-white/10 flex items-center"
        >
          <span className="font-bold text-amber-400 text-lg md:text-xl">
            이가을<span className="text-cream/80">·</span>블로그
          </span>
        </Link>

        {/* 네비게이션 */}
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
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'hover:bg-white/10 text-cream/90',
                ].join(' ')
              }
            >
              {t(ti.key as any)}
            </NavLink>
          ))}
        </nav>

        {/* 오디오 플레이어 */}
        
        <div className="px-2 md:px-5 py-6">
          <AudioDock />
        </div>

        {/* 우측 하단(관리 버튼 등) */}
        <div className="px-3 md:px-5 py-3 border-t border-white/10">
          <AdminGate />
        </div>
      </div>
    </motion.aside>
  )
}
