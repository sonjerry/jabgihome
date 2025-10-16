// client/src/router/Layout.tsx
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Suspense } from 'react'

import Navbar from '../components/Navbar'
import AudioProvider from '../lib/audio/AudioProvider'
import PageTransition from './PageTransition'
import ErrorBoundary from './ErrorBoundary'

export default function Layout() {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <AudioProvider>
      {/* 전역 배경(index.css)만 사용하여 단순화 */}

      {/* 네비게이션 바 - 홈 페이지에서는 숨김 */}
      {!isHomePage && <Navbar />}

      {/* 메인 콘텐츠 영역 */}
      <div
        className={isHomePage ? '' : 'md:pl-64'}
        style={
          isHomePage
            ? undefined
            : {
                contentVisibility: 'auto',
                containIntrinsicSize: '1px 800px',
              }
        }
      >
        <Suspense fallback={isHomePage ? null : (
          <div className="p-6 text-sm text-white/70">로딩중…</div>
        )}>
          <ErrorBoundary>
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition key={location.pathname} isHomePage={isHomePage}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </ErrorBoundary>
        </Suspense>
      </div>
    </AudioProvider>
  )
}
