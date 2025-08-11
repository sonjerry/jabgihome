// client/src/pages/PostDetail.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import type { Post, Attachment } from '../types'
import { getPost } from '../lib/api'
import CommentSection from '../components/CommentSection'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import clsx from 'clsx'

function formatFullDate(s: string) {
  const d = new Date(s)
  return d.toLocaleString()
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
  const hero = useMemo(() => {
    if (!post) return null
    return firstImageFromAttachments(post.attachments) || firstImageFromMarkdown(post.content) || null
  }, [post])

  if (loading) {
    return <div className="pt-24 mx-auto max-w-[1000px] px-3 md:px-6">불러오는 중…</div>
  }
  if (!post) {
    return <div className="pt-24 mx-auto max-w-[1000px] px-3 md:px-6">게시글을 찾을 수 없습니다.</div>
  }

  // ✅ ReactMarkdown 전용 컴포넌트들을 명시적으로 타이핑
  const mdComponents: Components = {
    img: ({ node, className, ...props }) => (
      <img
        {...props}
        loading="lazy"
        className={clsx('rounded-xl w-full h-auto max-h-[70vh] object-contain my-4', className)}
      />
    ),
    a: ({ node, className, ...props }) => (
      <a
        {...props}
        target="_blank"
        rel="noreferrer"
        className={clsx('underline decoration-dotted', className)}
      />
    ),
    h1: ({ node, className, ...props }) => (
      <h1 {...props} className={clsx('mt-8 mb-4 text-3xl md:text-4xl font-bold', className)} />
    ),
    h2: ({ node, className, ...props }) => (
      <h2 {...props} className={clsx('mt-7 mb-3 text-2xl md:text-3xl font-semibold', className)} />
    ),
    h3: ({ node, className, ...props }) => (
      <h3 {...props} className={clsx('mt-6 mb-2 text-xl md:text-2xl font-semibold', className)} />
    ),
    code: ({ node, inline, className, children, ...props }) =>
      inline ? (
        <code {...props} className={clsx('px-1.5 py-0.5 rounded bg-white/10', className)}>
          {children}
        </code>
      ) : (
        <pre className="bg-black/40 rounded-xl p-4 overflow-x-auto">
          <code {...props} className={className}>{children}</code>
        </pre>
      ),
  }

  return (
    <div className="pt-24 mx-auto max-w-[1000px] px-3 md:px-6">
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

      {/* 히어로 이미지(있으면) */}
      {hero && (
        <div className="mb-4 overflow-hidden rounded-2xl">
          <img src={hero} alt={title} className="w-full h-auto object-cover max-h-[55vh]" />
        </div>
      )}

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

          {/* 본문: 마크다운 */}
          <div className="prose prose-invert max-w-none leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* 첨부 갤러리 */}
          {!!post.attachments?.length && (
            <section className="mt-8">
              <h3 className="text-sm font-semibold mb-3 opacity-80">첨부 이미지</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {post.attachments!.filter(a => (a.type || '').startsWith('image/')).map(a => (
                  <img key={a.id} src={a.url} alt={a.name || 'attachment'}
                       className="w-full h-36 object-cover rounded-lg" loading="lazy" />
                ))}
              </div>
            </section>
          )}
        </article>
      </GlassCard>

      {/* 댓글 */}
      <section className="mt-8">
        <CommentSection postId={post.id} />
      </section>
    </div>
  )
}
