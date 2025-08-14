// client/src/App.tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import React, { Suspense, useState, lazy } from 'react'

import Navbar from './components/Navbar'
import NotFound from './pages/NotFound'
import RequireAdmin from './routes/RequireAdmin'
import AudioProvider from './lib/audio/AudioProvider'

// 지연 로딩(무거운 페이지 우선 분리)
const Home = lazy(() => import('./pages/Home'))
const Blog = lazy(() => import('./pages/Blog'))
const PostDetail = lazy(() => import('./pages/PostDetail'))
const Gallery = lazy(() => import('./pages/Gallery'))
const ModelGallery = lazy(() => import('./pages/ModelGallery'))
const Editor = lazy(() => import('./pages/Editor'))

const transition = { duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }

function Page({ children }: { children: React.ReactNode }) {
  const [pe, setPe] = useState<'none' | 'auto'>('none')
  return (
    <motion.div
      style={{ pointerEvents: pe, contain: 'content' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={transition}
      onAnimationStart={() => setPe('none')}
      onAnimationComplete={() => setPe('auto')}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  return (
    <AudioProvider>
      {/* Navbar는 포털로 body에 그려지므로 여기선 그냥 사용 */}
      <Navbar />

      {/* 본문: 사이드바 폭만큼 여백 + 보이는 영역만 페인트 */}
      <div className="md:pl-64" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 800px' }}>
        <Suspense fallback={<div className="p-6 text-sm text-white/70">로딩중…</div>}>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Page><Home /></Page>} />
              <Route path="/blog" element={<Page><Blog /></Page>} />
              <Route path="/post/:id" element={<Page><PostDetail /></Page>} />
              <Route path="/gallery" element={<Page><Gallery /></Page>} />
              <Route path="/modelgallery" element={<Page><ModelGallery /></Page>} />
              <Route path="/editor" element={<RequireAdmin><Page><Editor /></Page></RequireAdmin>} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Page><NotFound /></Page>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
    </AudioProvider>
  )
}
