// client/src/pages/PostDetail.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import type { Post } from '../types'
import { getPost } from '../lib/api'
import CommentSection from '../components/CommentSection'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import clsx from 'clsx'
import { useAuth } from '../state/auth'
import { StickerPeel } from '../components/StickerPeel'

/* ───── 유틸 ───── */
function formatFullDate(s: string) {
  const d = new Date(s)
  let dateStr = d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
  return dateStr.replace(/\.$/, '')
}

const PROJECT_TAGS = new Set(['p1', 'p2', 'p3'])
const isProjectTag = (t: string) => PROJECT_TAGS.has((t || '').toLowerCase())

/* ───── 이미지 컨테이너 ───── */
function FigureImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { alt = '', ...rest } = props
  return (
    <figure className="my-6">
      <div
        className="
          mx-auto max-w-[64ch]
          aspect-[4/3] md:aspect-[16/9]
          rounded-2xl border border-white/10 bg-white/[0.03]
          grid
        "
      >
        <div className="p-px w-full h-full grid place-items-center">
          <img
            {...rest}
            alt={alt}
            loading="lazy"
            className="block max-w-full max-h-full w-auto h-auto object-contain object-center select-none rounded-[inherit]"
            draggable={false}
          />
        </div>
      </div>
      {alt && (
        <figcaption className="mt-2 text-center text-xs text-white/60">
          {alt}
        </figcaption>
      )}
    </figure>
  )
}

/* ───── 페이지 ───── */
export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const location = useLocation()
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

  if (loading) {
    return (
      <div className="pt-24 mx-auto max-w-[1000px] px-3 md:px-6">
        불러오는 중…
      </div>
    )
  }
  if (!post) {
    return (
      <div className="pt-24 mx-auto max-w-[1000px] px-3 md:px-6">
        게시글을 찾을 수 없습니다.
      </div>
    )
  }

  /* ── 마크다운 컴포넌트 ── */
  const mdComponents: Components = {
    img: (props) => <FigureImage {...props} />,

    a: ({ className, ...props }) => (
      <a
        {...props}
        target="_blank"
        rel="noreferrer"
        className={clsx(
          'underline decoration-dotted underline-offset-4 hover:decoration-amber-300/80',
          className
        )}
      />
    ),

    h1: ({ className, ...props }) => (
      <h1 {...props} className={clsx('mt-10 mb-4 text-3xl md:text-4xl font-bold', className)} />
    ),
    h2: ({ className, ...props }) => (
      <h2 {...props} className={clsx('mt-9 mb-3 text-2xl md:text-3xl font-semibold', className)} />
    ),
    h3: ({ className, ...props }) => (
      <h3 {...props} className={clsx('mt-7 mb-2 text-xl md:text-2xl font-semibold', className)} />
    ),

    code: ({ className, children, ...props }) => {
      const isBlock = !!className && className.includes('language-')
      return isBlock ? (
        <pre className="bg-white/5 border border-white/10 rounded-2xl p-4 overflow-x-auto my-5">
          <code {...props} className={className}>
            {children}
          </code>
        </pre>
      ) : (
        <code {...props} className={clsx('px-1.5 py-0.5 rounded bg-white/10', className)}>
          {children}
        </code>
      )
    },

    table: ({ className, ...props }) => (
      <div className="-mx-2 px-2 overflow-x-auto my-5">
        <table {...props} className={clsx('text-sm w-full border-collapse', className)} />
      </div>
    ),
    thead: ({ className, ...props }) => (
      <thead {...props} className={clsx('bg-transparent', className)} />
    ),
    tbody: ({ className, ...props }) => (
      <tbody
        {...props}
        className={clsx('[&>tr:nth-child(odd)]:bg-white/[0.04]', className)}
      />
    ),
    th: ({ className, ...props }) => (
      <th
        {...props}
        className={clsx('text-left font-semibold py-2 border-b border-white/10', className)}
      />
    ),
    td: ({ className, ...props }) => (
      <td
        {...props}
        className={clsx('py-2 align-top border-b border-white/5', className)}
      />
    ),

    ul: ({ className, ...props }) => <ul {...props} className={clsx('my-4 pl-6 list-disc', className)} />,
    ol: ({ className, ...props }) => <ol {...props} className={clsx('my-4 pl-6 list-decimal', className)} />,
    p:  ({ className, ...props }) => <p  {...props} className={clsx('my-4', className)} />,
  }

  // 프로젝트 태그는 표시에서 숨김
  const visibleTags = (post.tags || []).filter(t => !isProjectTag((t || '').toLowerCase()))

  return (
    <div className="pt-24 mx-auto max-w-[1000px] px-3 md:px-6">
      {/* 상단 바: 뒤로 + (관리자) 삭제 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            // URL 파라미터를 확인해서 프로젝트 진행사항에서 온 경우 해당 페이지로 돌아가기
            const searchParams = new URLSearchParams(location.search)
            const progress = searchParams.get('progress')
            if (progress) {
              nav(`/blog?progress=${encodeURIComponent(progress)}`)
            } else {
              nav(-1) // 브라우저 히스토리에서 이전 페이지로
            }
          }}
          className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity"
          aria-label="뒤로가기"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" className="-ml-1">
            <path
              d="M15 18l-6-6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          뒤로
        </button>

        {!authLoading && role === 'admin' && (
          <div className="flex items-center gap-2">
            <Link
              to={`/blog/edit/${id}`}
              className="glass px-3 py-1.5 rounded-xl text-blue-400 hover:bg-blue-500/20 transition-colors font-medium"
              aria-label="글 수정"
            >
              수정
            </Link>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="glass px-3 py-1.5 rounded-xl text-red-400 hover:bg-red-500/20 disabled:opacity-60 transition-colors font-medium"
            >
              {deleting ? '삭제 중…' : '삭제'}
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <GlassCard>
          <article className="p-5 md:p-8">
          {/* 헤더 */}
          <header className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{title}</h1>
            <p className="text-xs md:text-sm text-cream/70 mt-2 whitespace-nowrap">
              {formatFullDate(post.createdAt)} {post.category ? `• ${post.category}` : ''}
            </p>

            {visibleTags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {visibleTags.map((t, i) => (
                  <Link
                    key={`${t}-${i}`}
                    to={`/blog?tag=${encodeURIComponent(t)}`}
                    className="text-[11px] px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* 본문 */}
          <div
            className={clsx(
              'prose prose-invert post-content',
              'max-w-[72ch] mx-auto',
              'leading-[1.85]',
              'prose-headings:scroll-mt-28',
              'prose-p:my-4'
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {post.content}
            </ReactMarkdown>
          </div>
          </article>
        </GlassCard>
        <SideStickers />
      </div>

      {/* 댓글 */}
      <section className="mt-12 space-y-6">
        <CommentSection postId={post.id} />
      </section>
    </div>
  )
}

/* ───── 사이드 스티커 오버레이 ───── */
function SideStickers() {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  // 스티커 png 자동 수집
  const urls = useMemo(() => {
    const mods = import.meta.glob('../assets/sticker/*.png', {
      eager: true,
      query: '?url',
      import: 'default',
    })
    return Object.values(mods) as string[]
  }, [])

  // 컨테이너 사이즈 추적
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect
      setBox({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  type Item = { url: string; width: number; rotate: number; x: number; y: number; peelDirection: number }

  const items: Item[] = useMemo(() => {
    if (!box.h || urls.length === 0) return []

    const isMobile = box.w > 0 && box.w <= 640
    const countBase = Math.max(2, Math.floor(box.h / (isMobile ? 340 : 280)))
    const count = Math.min(isMobile ? 3 : 6, countBase)

    const pick = (arr: string[], n: number) => {
      const tmp = [...arr]
      for (let i = tmp.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[tmp[i], tmp[j]] = [tmp[j], tmp[i]]
      }
      return tmp.slice(0, n)
    }

    const chosen = pick(urls, count)
    const topPad = isMobile ? 12 : 16
    const bottomPad = isMobile ? 12 : 16
    const usableH = Math.max(0, box.h - topPad - bottomPad)

    const results: Item[] = []
    for (let i = 0; i < chosen.length; i++) {
      const url = chosen[i]
      const width = isMobile ? rand(90, 130) : rand(130, 200)
      const rotate = rand(-8, 8)
      const t = (i + 1) / (chosen.length + 1)
      const jitter = rand(-24, 24)
      let y = topPad + Math.round(t * usableH) + jitter - Math.round(width / 2)
      y = clamp(y, topPad, Math.max(topPad, box.h - bottomPad - width))

      const leftSide = i % 2 === 0
      const peelDirection = 0
      const leftX = -Math.round(width * (isMobile ? 0.35 : 0.42))
      const rightX = Math.round(box.w - width * (isMobile ? 0.65 : 0.58))
      const x = leftSide ? leftX : rightX

      results.push({ url, width, rotate, x, y, peelDirection })
    }
    return results
  }, [box.w, box.h, urls])

  if (items.length === 0) return null

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-visible z-[5]">
      {items.map((it, idx) => (
        <StickerPeel
          key={`${it.url}-${idx}`}
          imageSrc={it.url}
          width={it.width}
          rotate={it.rotate}
          peelBackHoverPct={18}
          peelBackActivePct={36}
          shadowIntensity={0.6}
          lightingIntensity={0.12}
          initialPosition={{ x: it.x, y: it.y }}
          peelDirection={it.peelDirection}
          className="pointer-events-auto"
        />
      ))}
    </div>
  )
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}
