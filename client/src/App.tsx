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
import AudioDock from './components/AudioDock'
import RequireAdmin from './routes/RequireAdmin'

export default function App() {
  return (
    <div className="max-w-[100vw]">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/new" element={<RequireAdmin><Editor /></RequireAdmin>} />
        <Route path="/blog/edit/:id" element={<RequireAdmin><Editor /></RequireAdmin>} />
        <Route path="/blog/:id" element={<PostDetail />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </div>
  )
}
