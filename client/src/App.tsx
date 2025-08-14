// client/src/App.tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Blog from './pages/Blog'
import Editor from './pages/Editor'
import PostDetail from './pages/PostDetail'
import Gallery from './pages/Gallery'
import NotFound from './pages/NotFound'
import ModelGallery from './pages/ModelGallery'
import RequireAdmin from './routes/RequireAdmin'
import AudioProvider from './lib/audio/AudioProvider'
import { useEffect } from 'react'

const transition = { duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }
const variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={transition}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()

  // (안전) 홈 진입 직후에도 갤러리 라우트가 즉시 반응하도록 사전 워밍업
  useEffect(() => {
    // 정적 import라 번들은 이미 포함되어 있지만, 초기 진입 시 파싱 워밍업 겸 한 번 접근
    void Promise.all([import('./pages/Gallery'), import('./pages/ModelGallery')])
  }, [])

  return (
    <AudioProvider>
      <Navbar />
      <main className="max-w-[100vw] min-h-screen pl-0 md:pl-64">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Page><Home /></Page>} />
            <Route path="/blog" element={<Page><Blog /></Page>} />
            <Route
              path="/blog/new"
              element={
                <RequireAdmin>
                  <Page><Editor /></Page>
                </RequireAdmin>
              }
            />
            <Route
              path="/blog/edit/:id"
              element={
                <RequireAdmin>
                  <Page><Editor /></Page>
                </RequireAdmin>
              }
            />
            <Route path="/blog/:id" element={<Page><PostDetail /></Page>} />
            <Route path="/gallery" element={<Page><Gallery /></Page>} />
            <Route path="/modelgallery" element={<Page><ModelGallery /></Page>} />
            <Route path="/404" element={<Page><NotFound /></Page>} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </AudioProvider>
  )
}
