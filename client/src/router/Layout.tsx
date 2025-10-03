// client/src/router/Layout.tsx
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Suspense } from 'react'

import Navbar from '../components/Navbar'
import AudioProvider from '../lib/audio/AudioProvider'
import Silk from '../components/Silk'
import PageTransition from './PageTransition'
import ErrorBoundary from './ErrorBoundary'

export default function Layout() {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <AudioProvider>
      {/* 홈 페이지가 아닌 경우에만 Silk 배경 효과 적용 */}
      {!isHomePage && (
        <div className="fixed inset-0 z-[-1]">
          <Silk
            speed={5}
            scale={1}
            color="#7B7481"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>
      )}

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
