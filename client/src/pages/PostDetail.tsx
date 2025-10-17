// client/src/pages/PostDetail.tsx
import { useEffect, useMemo, useState } from 'react'
import React from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import type { Post } from '../types'
import { getPost } from '../lib/api'
import CommentSection from '../components/CommentSection'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import clsx from 'clsx'
import { useAuth } from '../state/auth'

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
          mx-auto max-w-full
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
  const editorFontSize = post?.style?.fontSize ?? 16
  const editorTextColor = post?.style?.textColor ?? '#111827'

  useEffect(() => {
    if (!id) return
    setLoading(true)
    
    const loadPost = async () => {
      try {
        // 1. 정적 파일 먼저 시도 (빠른 로딩)
        const staticResponse = await fetch('/data/posts.json', { cache: 'no-store' })
        if (staticResponse.ok) {
          const posts: Post[] = await staticResponse.json()
          const foundPost = posts.find(p => p.id === id)
          if (foundPost) {
            setPost(foundPost)
            
            // 2. 백그라운드에서 API로 최신 데이터 확인
            try {
              const API_BASE = import.meta.env.VITE_API_URL || ''
              const health = await fetch(`${API_BASE}/api/health`, { credentials: 'omit' }).catch(() => null)
              if (health && health.ok) {
                const apiPost = await getPost(id)
                setPost(apiPost)
              }
            } catch (apiError) {
              console.warn('API fallback failed, using static data:', apiError)
            }
            return
          }
        }
        
        // 3. 정적 파일에 없으면 API 사용
        const apiPost = await getPost(id)
        setPost(apiPost)
      } catch (error) {
        console.error('Failed to load post:', error)
        setPost(null)
      } finally {
        setLoading(false)
      }
    }
    
    loadPost()
  }, [id])

  // 방문 기록: 로컬스토리지에 열람한 글 ID 저장 (방문자 개인 기준)
  useEffect(() => {
    if (!id) return
    try {
      const key = 'viewedPosts'
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
      const arr: string[] = raw ? JSON.parse(raw) : []
      if (!arr.includes(id)) {
        arr.unshift(id)
        // 과도한 누적 방지: 최근 500개까지만 유지
        const trimmed = arr.slice(0, 500)
        localStorage.setItem(key, JSON.stringify(trimmed))
      }
    } catch {}
  }, [id])

  const title = useMemo(() => post?.title ?? '', [post])

  // TipTap HTML 본문 내 <img> 태그를 통일된 레이아웃(figure)으로 감싸고 캡션(alt) 표시
  function wrapImagesInHtml(html: string) {
    try {
      // src/alt 추출하여 동일한 Figure 레이아웃으로 치환
      return html.replace(/<img\s+([^>]*?)>/gi, (full, attrs) => {
        const srcMatch = /src=["']([^"']+)["']/i.exec(attrs) || []
        const altMatch = /alt=["']([^"']*)["']/i.exec(attrs) || []
        const src = (srcMatch[1] || '').replace(/"/g, '&quot;')
        const alt = (altMatch[1] || '').replace(/"/g, '&quot;')
        const rest = attrs
          .replace(/\s*(src|alt)=["'][^"']*["']/gi, '')
          .trim()
        // FigureImage 컴포넌트의 구조와 유사하게 통일 (4:3 / md:16:9, 캡션 표시)
        return (
          `\n<figure class="my-6">\n`
          + `  <div class="mx-auto max-w-full aspect-[4/3] md:aspect-[16/9] rounded-2xl border border-white/10 bg-white/[0.03] grid">\n`
          + `    <div class="p-px w-full h-full grid place-items-center">\n`
          + `      <img src="${src}" alt="${alt}" ${rest ? rest + ' ' : ''}loading="lazy" class="block max-w-full max-h-full w-auto h-auto object-contain object-center select-none rounded-[inherit]" />\n`
          + `    </div>\n`
          + `  </div>\n`
          + (alt ? `  <figcaption class="mt-2 text-center text-xs text-white/60">${alt}</figcaption>\n` : '')
          + `</figure>\n`
        )
      })
    } catch {
      return html
    }
  }

  // TipTap에서 Shift+Enter로 들어오는 연속 <br>을 가독성 있는 공백 블록으로 치환
  function normalizeLineBreaks(html: string) {
    try {
      // <br>가 2번 이상 연속되면 가독성 간격 블록으로 변환
      return html.replace(/(?:<br\s*\/?>\s*){2,}/gi, '<div class="br-gap" aria-hidden="true"></div>')
    } catch {
      return html
    }
  }

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
  function renderTokenText(input: any): any {
    // 지원 토큰:
    // 1) 범위 토큰: {{size:20}} ... {{/size}}, {{color:#ff0000}} ... {{/color}}
    // 2) 인라인 토큰: {{size:20|text}}, {{color:#ff0000|text}}
    const renderString = (txt: string) => {
      const out: any[] = []
      const stack: Array<React.CSSProperties> = []
      const pushText = (s: string) => {
        if (!s) return
        const style = stack.reduce((acc, cur) => Object.assign(acc, cur), {} as React.CSSProperties)
        out.push(style && Object.keys(style).length ? <span style={style} key={out.length}>{s}</span> : s)
      }
      // 먼저 인라인 토큰을 간단 치환
      const inlineRegex = /\{\{(size|color):([^|}]+)\|([^}]+)\}\}/g
      txt = txt.replace(inlineRegex, (_m, k, v, t) => {
        const style = k === 'size' ? `font-size:${Number(v)}px` : `color:${v}`
        return `<<SPAN ${style}>>${t}<<END>>`
      })

      const tokenRegex = /(\{\{size:([^}]+)\}\}|\{\{color:([^}]+)\}\}|\{\{\/size\}\}|\{\{\/color\}\}|<<SPAN ([^>]+)>>|<<END>>)/g
      let last = 0
      let m: RegExpExecArray | null
      while ((m = tokenRegex.exec(txt)) !== null) {
        if (m.index > last) pushText(txt.slice(last, m.index))
        const token = m[0]
        if (token.startsWith('{{size:')) {
          stack.push({ fontSize: `${Number(m[2])}px` })
        } else if (token.startsWith('{{color:')) {
          stack.push({ color: m[3] })
        } else if (token === '{{/size}}') {
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].fontSize) { stack.splice(i, 1); break }
          }
        } else if (token === '{{/color}}') {
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].color) { stack.splice(i, 1); break }
          }
        } else if (token.startsWith('<<SPAN ')) {
          const styleStr = m[5] || ''
          const style: React.CSSProperties = {}
          styleStr.split(';').forEach(rule => {
            const [k, v] = rule.split(':').map(s => s?.trim())
            if (!k || !v) return
            if (k === 'font-size') style.fontSize = v
            if (k === 'color') style.color = v
          })
          stack.push(style)
        } else if (token === '<<END>>') {
          stack.pop()
        }
        last = m.index + token.length
      }
      if (last < txt.length) pushText(txt.slice(last))
      return out
    }

    if (typeof input === 'string') return renderString(input)
    // children 배열일 경우 각각 처리
    if (Array.isArray(input)) {
      return input.map((c, i) => typeof c === 'string' ? <React.Fragment key={i}>{renderString(c)}</React.Fragment> : c)
    }
    return input
  }
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

    h1: ({ className, children, ...props }) => (
      <h1 {...props} className={clsx('mt-10 mb-4 text-3xl md:text-4xl font-bold', className)}>{renderTokenText(children)}</h1>
    ),
    h2: ({ className, children, ...props }) => (
      <h2 {...props} className={clsx('mt-9 mb-3 text-2xl md:text-3xl font-semibold', className)}>{renderTokenText(children)}</h2>
    ),
    h3: ({ className, children, ...props }) => (
      <h3 {...props} className={clsx('mt-7 mb-2 text-xl md:text-2xl font-semibold', className)}>{renderTokenText(children)}</h3>
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
    p:  ({ className, children, ...props }) => (
      <p {...props} className={clsx('my-4', className)}>
        {renderTokenText(children)}
      </p>
    ),
    li: ({ className, children, ...props }) => (
      <li {...props} className={className}>{renderTokenText(children)}</li>
    ),
  }

  // 프로젝트 태그는 표시에서 숨김
  const visibleTags = (post.tags || []).filter(t => !isProjectTag((t || '').toLowerCase()))

  return (
    <div className="pt-24">
      {/* 상단 바: 뒤로 + (관리자) 삭제 */}
      <div className="mx-auto max-w-[1200px] px-3 md:px-8 flex items-center justify-between mb-8">
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
                className="px-3 py-1.5 rounded-xl text-blue-400 hover:bg-blue-500/20 transition-colors font-medium border border-white/10"
                aria-label="글 수정"
              >
                수정
              </Link>
              <button
                onClick={onDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-xl text-red-400 hover:bg-red-500/20 disabled:opacity-60 transition-colors font-medium border border-white/10"
              >
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
        )}
      </div>

      <article
        className="mx-auto w-full max-w-[1200px] px-3 md:px-8 text-left"
        style={{ fontFamily: 'Gulim, 굴림, sans-serif' }}
      >
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

        {/* 본문: 넓은 콘텐츠 영역, 에디터 설정 적용 */}
        <div
          style={{ color: editorTextColor, fontSize: `${editorFontSize}px` }}
          className={clsx(
            'post-content',
            'leading-[1.85]',
            'text-left'
          )}
        >
          {post.content?.startsWith('<') ? (
            <div
              className="prose max-w-none"
              style={{ color: editorTextColor }}
              dangerouslySetInnerHTML={{ __html: normalizeLineBreaks(wrapImagesInHtml(post.content)) }}
            />
          ) : (
            <div className="prose max-w-none" style={{ color: editorTextColor }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {post.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </article>

      {/* 댓글 */}
      <section className="mt-12 space-y-6 mx-auto max-w-[900px] px-3 md:px-6">
        <CommentSection postId={post.id} />
      </section>
    </div>
  )
}
 
