// client/src/App.tsx
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
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
const Projects = lazy(() => import('./pages/Projects')) // ✅ 추가: 프로젝트 페이지

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

/** 구(舊) 링크 `/post/:id`를 `/blog/:id`로 매끄럽게 리다이렉트 */
function LegacyPostRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/blog/${id ?? ''}`} replace />
}

/** 구(舊) 링크 `/project`를 `/projects`로 리다이렉트 (혹시 북마크 대비) */
function LegacyProjectsRedirect() {
  return <Navigate to="/projects" replace />
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
              {/* 홈 */}
              <Route path="/" element={<Page><Home /></Page>} />

              {/* 블로그 목록 */}
              <Route path="/blog" element={<Page><Blog /></Page>} />

              {/* ✅ 블로그 상세: /blog/:id (목록과 일치) */}
              <Route path="/blog/:id" element={<Page><PostDetail /></Page>} />

              {/* ✅ 새 글: /blog/new (에디터를 여기로 매핑) */}
              <Route
                path="/blog/new"
                element={
                  <RequireAdmin>
                    <Page><Editor /></Page>
                  </RequireAdmin>
                }
              />

              {/* 구 링크 호환: /post/:id → /blog/:id */}
              <Route path="/post/:id" element={<LegacyPostRedirect />} />

              {/* (선택) 에디터 직링크도 유지하고 싶으면 아래 라우트도 둡니다 */}
              <Route
                path="/editor"
                element={
                  <RequireAdmin>
                    <Page><Editor /></Page>
                  </RequireAdmin>
                }
              />

              {/* 갤러리들 */}
              <Route path="/gallery" element={<Page><Gallery /></Page>} />
              <Route path="/modelgallery" element={<Page><ModelGallery /></Page>} />

              {/* ✅ 프로젝트 탭 */}
              <Route path="/projects" element={<Page><Projects /></Page>} />

              {/* 구 주소 호환 */}
              <Route path="/project" element={<LegacyProjectsRedirect />} />

              {/* 리다이렉트/404 */}
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Page><NotFound /></Page>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
    </AudioProvider>
  )
}
