// client/src/pages/PostDetail.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import type { Post, Attachment } from '../types'
import { getPost } from '../lib/api'
import CommentSection from '../components/CommentSection'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import clsx from 'clsx'
import { useAuth } from '../state/auth'

function formatFullDate(s: string) {
  const d = new Date(s)
  let dateStr = d.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric' 
  })
  // 끝에 마침표 제거
  dateStr = dateStr.replace(/\.$/, '')
  return dateStr
}
function firstImageFromAttachments(atts?: Attachment[]) {
  const img = (atts || []).find(a => (a.type || '').startsWith('image/') && a.url)
  return img?.url || null
}
function firstImageFromMarkdown(md: string) {
  const m = md.match(/!\[[^\]]*\]\(([^)]+)\)/)
  return m?.[1] || null
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { role, loading: authLoading } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getPost(id).then(setPost).finally(() => setLoading(false))
  }, [id])

  const title = useMemo(() => post?.title ?? '', [post])
  const hero = useMemo(() => {
    if (!post) return null
    return firstImageFromAttachments(post.attachments) || firstImageFromMarkdown(post.content) || null
  }, [post])

  const onDelete = async () => {
    if (!id) return
    if (!confirm('정말 삭제할까요? 되돌릴 수 없습니다.')) return
    try {
      setDeleting(true)
      const API_BASE = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${API_BASE}/api/posts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
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

  if (loading) return <div className="pt-24 mx-auto max-w-[1000px] px-3 md:px-6">불러오는 중…</div>
  if (!post) return <div className="pt-24 mx-auto max-w-[1000px] px-3 md:px-6">게시글을 찾을 수 없습니다.</div>

  const mdComponents: Components = {
    img: ({ className, ...props }) => (
      <img {...props} loading="lazy" className={clsx('rounded-xl w-full h-auto max-h-[70vh] object-contain my-4', className)} />
    ),
    a: ({ className, ...props }) => (
      <a {...props} target="_blank" rel="noreferrer" className={clsx('underline decoration-dotted', className)} />
    ),
    h1: ({ className, ...props }) => (
      <h1 {...props} className={clsx('mt-8 mb-4 text-3xl md:text-4xl font-bold', className)} />
    ),
    h2: ({ className, ...props }) => (
      <h2 {...props} className={clsx('mt-7 mb-3 text-2xl md:text-3xl font-semibold', className)} />
    ),
    h3: ({ className, ...props }) => (
      <h3 {...props} className={clsx('mt-6 mb-2 text-xl md:text-2xl font-semibold', className)} />
    ),
    code: ({ className, children, ...props }) => {
      const isBlock = !!className && className.includes('language-')
      return isBlock ? (
        <pre className="bg-black/40 rounded-xl p-4 overflow-x-auto">
          <code {...props} className={className}>{children}</code>
        </pre>
      ) : (
        <code {...props} className={clsx('px-1.5 py-0.5 rounded bg-white/10', className)}>{children}</code>
      )
    },
  }

  return (
    <div className="pt-24 mx-auto max-w-[1000px] px-3 md:px-6">
      <div className="flex items-center justify-between mb-4">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100" aria-label="뒤로가기">
          <svg width="18" height="18" viewBox="0 0 24 24" className="-ml-1">
            <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          뒤로
        </Link>

        {!authLoading && role === 'admin' && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="glass px-3 py-1.5 rounded-xl text-red-200 hover:bg-red-500/20 disabled:opacity-60"
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
                  <Link
                    key={i}
                    to={`/blog?tag=${encodeURIComponent(t)}`}
                    className="text-[11px] px-2 py-1 rounded-full bg-white/10 hover:bg-white/20"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}
          </header>

          <div className="prose prose-invert max-w-none leading-relaxed post-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {post.content}
            </ReactMarkdown>
          </div>
        </article>
      </GlassCard>

      {/* 댓글 섹션 - 여백 확보 */}
      <section className="mt-12 space-y-6">
        <CommentSection postId={post.id} />
      </section>
    </div>
  )
}
