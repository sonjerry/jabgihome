// client/src/router/Layout.tsx
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Suspense } from 'react'

import Navbar from '../components/Navbar'
import AudioProvider from '../lib/audio/AudioProvider'
import SkyBackground from '../components/SkyBackground'
import PageTransition from './PageTransition'
import ErrorBoundary from './ErrorBoundary'

export default function Layout() {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <AudioProvider>
      {/* 홈 페이지가 아닌 경우에만 하늘색 배경 효과 적용 */}
      {!isHomePage && <SkyBackground />}

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
        <Suspense fallback={
          <div className="p-6 text-sm text-white/70">로딩중…</div>
        }>
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
