// client/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Blog from './pages/Blog'
import Editor from './pages/Editor'
import PostDetail from './pages/PostDetail'
import Gallery from './pages/Gallery'
import Chatbot from './pages/Chatbot'
import NotFound from './pages/NotFound'
import RequireAdmin from './routes/RequireAdmin'
import AudioProvider from './lib/audio/AudioProvider'

export default function App() {
  return (
    <AudioProvider>
      {/* 고정 사이드바(모바일 오버레이)는 Navbar 내부에서 처리 */}
      <Navbar />

      {/* 본문: 데스크탑(md↑)에서만 사이드바 폭(16rem) 만큼 왼쪽 패딩 */}
      <main className="max-w-[100vw] min-h-screen pl-0 md:pl-64">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route
            path="/blog/new"
            element={
              <RequireAdmin>
                <Editor />
              </RequireAdmin>
            }
          />
          <Route
            path="/blog/edit/:id"
            element={
              <RequireAdmin>
                <Editor />
              </RequireAdmin>
            }
          />
          <Route path="/blog/:id" element={<PostDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/chat" element={<Chatbot />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>
    </AudioProvider>
  )
}
