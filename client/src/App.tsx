// client/src/App.tsx
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import React, { Suspense, useState, useEffect, lazy } from 'react'

import Navbar from './components/Navbar'
import NotFound from './pages/NotFound'
import RequireAdmin from './routes/RequireAdmin'
import AudioProvider from './lib/audio/AudioProvider'

// 지연 로딩(무거운 페이지 우선 분리)
const Home = lazy(() => import('./pages/Home'))
const Blog = lazy(() => import('./pages/Blog'))
const PostDetail = lazy(() => import('./pages/PostDetail'))
const Gallery = lazy(() => import('./pages/Gallery'))
const ModelGallery = lazy(() => import('./pages/ModelGallery')) // A안: lazy 유지 + 아래 useEffect로 프리페치
const Editor = lazy(() => import('./pages/Editor'))
const Projects = lazy(() => import('./pages/Projects'))


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

  // 홈 초기 진입 시에는 사이드바 공간을 예약하지 않다가, 스크롤로 reveal되면 여백을 부여
  const [homeReveal, setHomeReveal] = useState<number>(() => {
    if (typeof window === 'undefined') return 1
    const root = getComputedStyle(document.documentElement).getPropertyValue('--home-reveal')
    return Number(root || 0) || 0
  })
  useEffect(() => {
    const onReveal = (e: Event) => {
      try {
        const detail = (e as CustomEvent<number>).detail
        if (typeof detail === 'number') setHomeReveal(detail)
      } catch {}
    }
    window.addEventListener('home:reveal', onReveal as any)
    return () => window.removeEventListener('home:reveal', onReveal as any)
  }, [])

  // ✅ A안: 첫 마운트 시 3D 모델 갤러리 모듈을 사전 프리페치(캐시에 올려둠)
  useEffect(() => {
    import('./pages/ModelGallery').catch(() => {})
  }, [])

  return (
    <AudioProvider>
      {/* Navbar는 포털로 body에 그려지므로 여기선 그냥 사용 */}
      <Navbar />

      {/* 본문: 홈 초기에는 여백 없이 풀블리드, reveal 후(또는 홈 외 페이지)에는 사이드바 폭만큼 여백 */}
      <div
        className={(location.pathname === '/' ? (homeReveal > 0.02 ? 'md:pl-64' : '') : 'md:pl-64')}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 800px' }}
      >
        <Suspense fallback={<div className="p-6 text-sm text-white/70">로딩중…</div>}>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              {/* 홈 */}
              <Route path="/" element={<Page><Home /></Page>} />

              {/* 블로그 목록 */}
              <Route path="/blog" element={<Page><Blog /></Page>} />

              {/* 블로그 상세: /blog/:id */}
              <Route path="/blog/:id" element={<Page><PostDetail /></Page>} />

              {/* 새 글: /blog/new (에디터 매핑) */}
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

              {/* 에디터 직링크 유지 */}
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

              {/* 프로젝트 탭 */}
              <Route path="/projects" element={<Page><Projects /></Page>} />
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
