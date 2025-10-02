// client/src/App.tsx
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import React, { Suspense, useState, useEffect, lazy } from 'react'

import Navbar from './components/Navbar'
import NotFound from './pages/NotFound'
import RequireAdmin from './routes/RequireAdmin'
import AudioProvider from './lib/audio/AudioProvider'
import Silk from './components/Silk'

// 지연 로딩(무거운 페이지 우선 분리)
const Home = lazy(() => import('./pages/Home'))
const Blog = lazy(() => import('./pages/Blog'))
const PostDetail = lazy(() => import('./pages/PostDetail'))
const Gallery = lazy(() => import('./pages/Gallery'))
const ModelGallery = lazy(() => import('./pages/ModelGallery')) // A안: lazy 유지 + 아래 useEffect로 프리페치
const Editor = lazy(() => import('./pages/Editor'))
const Projects = lazy(() => import('./pages/Projects'))


const transition = { duration: 0.15, ease: [0.22, 0.61, 0.36, 1] } // 애니메이션 시간 단축

function Page({ children, disableTransform = false }: { children: React.ReactNode; disableTransform?: boolean }) {
  const [pe, setPe] = useState<'auto'>('auto') // 기본값을 auto로 변경
  const location = useLocation()
  
  // 라우트 변경 시 포인터 이벤트 즉시 활성화
  useEffect(() => {
    setPe('auto')
  }, [location.pathname])
  
  return (
    <motion.div
      style={{ pointerEvents: pe, contain: 'content' }}
      initial={disableTransform ? { opacity: 0 } : { opacity: 0, y: 5 }} // y 값 감소
      animate={disableTransform ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={disableTransform ? { opacity: 0 } : { opacity: 0, y: -5 }} // y 값 감소
      transition={transition}
      onAnimationStart={() => setPe('auto')} // 애니메이션 시작 시에도 auto 유지
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
      {/* Home 페이지가 아닌 경우에만 Silk 배경 효과 적용 */}
      {location.pathname !== '/' && (
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

      {/* Navbar는 포털로 body에 그려지므로 여기선 그냥 사용 */}
      <Navbar />

      {/* 본문: 홈('/')에서는 항상 여백 없이 풀블리드, 기타 페이지는 사이드바 폭만큼 여백 */}
      <div
        className={(location.pathname === '/' ? '' : 'md:pl-64')}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 800px' }}
      >
        <Suspense fallback={<div className="p-6 text-sm text-white/70">로딩중…</div>}>
          <AnimatePresence mode="popLayout" initial={false}>
            <Routes location={location} key={location.pathname}>
              {/* 홈: transform 비활성화(고정 요소가 뷰포트 기준을 유지하도록) */}
              <Route path="/" element={<Page disableTransform><Home /></Page>} />

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
