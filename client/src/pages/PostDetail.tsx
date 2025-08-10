// client/src/pages/PostDetail.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import type { Post } from '../types'
import { getPost } from '../lib/api'
import CommentSection from '../components/CommentSection'

function formatFullDate(s: string) {
  const d = new Date(s)
  return d.toLocaleString()
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getPost(id)
      .then(setPost)
      .finally(() => setLoading(false))
  }, [id])

  const title = useMemo(() => post?.title ?? '', [post])

  if (loading) {
    return <div className="pt-24 mx-auto max-w-[900px] px-4 md:px-6">불러오는 중…</div>
  }
  if (!post) {
    return <div className="pt-24 mx-auto max-w-[900px] px-4 md:px-6">게시글을 찾을 수 없습니다.</div>
  }

  return (
    <div className="pt-24 mx-auto max-w-[900px] px-4 md:px-6">
      {/* 좌상단 뒤로가기 */}
      <div className="flex items-center gap-3 mb-4">
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
                  <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-white/10">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* 필요 시 마크다운 렌더러로 교체 가능 */}
          <div className="prose prose-invert max-w-none leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </article>
      </GlassCard>

      {/* 댓글 */}
      <section className="mt-8">
        <CommentSection postId={post.id} />
      </section>
    </div>
  )
}
