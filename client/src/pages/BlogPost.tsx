// client/src/pages/BlogPost.tsx
import { useEffect, useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import type { Post } from '../types'
import { getPost } from '../lib/api'
import CommentSection from '../components/CommentSection'
import { useAuth } from '../state/auth'   // ✅ 추가

function formatFullDate(s: string) {
  const d = new Date(s)
  return d.toLocaleString()
}

export default function BlogPost() {
  const nav = useNavigate()
  const { role, loading: authLoading } = useAuth()  // ✅ loading까지 받기
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getPost(id).then(setPost).finally(() => setLoading(false))
  }, [id])

  const title = useMemo(() => post?.title ?? '', [post])

  const onDelete = async () => {
    if (!id) return
    if (!confirm('정말 삭제할까요? 되돌릴 수 없습니다.')) return
    try {
      setDeleting(true)
      const API_BASE = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${API_BASE}/api/posts/${id}`, {
        method: 'DELETE',
        credentials: 'include',         // ✅ 쿠키 포함
      })
      if (!res.ok) throw new Error(await res.text().catch(() => 'delete failed'))
      nav('/blog')
    } catch (e) {
      console.error(e)
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="pt-24 mx-auto max-w-[900px] px-4 md:px-6">불러오는 중…</div>
  }
  if (!post) {
    return <div className="pt-24 mx-auto max-w-[900px] px-4 md:px-6">게시글을 찾을 수 없습니다.</div>
  }

  return (
    <div className="pt-24 mx-auto max-w-[900px] px-4 md:px-6">
      {/* 상단 바: 뒤로 + (관리자용) 삭제 */}
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100"
          aria-label="뒤로가기"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" className="-ml-1">
            <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          뒤로
        </Link>

        {/* ✅ auth 로딩 끝나고 admin일 때만 버튼 표시 */}
        {!authLoading && role === 'admin' && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="glass px-3 py-1.5 rounded-xl hover:bg-red-500/20 text-red-200 disabled:opacity-60"
          >
            {deleting ? '삭제 중…' : '삭제'}
          </button>
        )}
      </div>

      <GlassCard>
        <article className="p-5 md:p-8">
          <header className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{title}</h1>
            <p className="text-xs md:text-sm text-cream/70 mt-2">
              {formatFullDate(post.createdAt)} {post.category ? `• ${post.category}` : ''}
            </p>
            {post.tags?.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {post.tags.map((t, i) => (
                  <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-white/10">#{t}</span>
                ))}
              </div>
            )}
          </header>

          <div className="prose prose-invert max-w-none leading-relaxed">
            {post.content}
          </div>
        </article>
      </GlassCard>

      <section className="mt-8">
        <CommentSection postId={post.id} />
      </section>
    </div>
  )
}
