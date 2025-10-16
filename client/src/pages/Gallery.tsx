// client/src/pages/Gallery.tsx
import { useMemo, useState, useEffect, useCallback } from 'react'
import GlassCard from '../components/GlassCard'
import GlareHover from '../components/GlareHover' // 추가
import { useAuth } from '../state/auth'
import { ThreadAPI, ReviewAPI } from '../lib/api'

type ImgItem = {
  title: string
  url: string
  category: string
}

const IMAGE_MODULES = import.meta.glob('../assets/gallery/**/*.{png,jpg,jpeg,gif,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function filenameToTitle(p: string) {
  const base = decodeURIComponent(p.split('/').pop() || '')
  const name = base.replace(/\.[^/.]+$/, '')
  return name.replace(/[_-]+/g, ' ').trim()
}

function pathToCategory(p: string) {
  const marker = '/gallery/'
  const i = p.indexOf(marker)
  if (i === -1) return '미분류'
  const rest = p.slice(i + marker.length)
  const first = rest.split('/')[0]
  return first && !first.includes('.') ? first : '미분류'
}

export default function Gallery() {
  const { role } = useAuth()
  const allImages: ImgItem[] = useMemo(
    () =>
      Object.entries(IMAGE_MODULES)
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([p, url]) => ({
          title: filenameToTitle(p),
          url,
          category: pathToCategory(p),
        })),
    []
  )

  const categories = useMemo(() => {
    const s = new Set<string>()
    for (const img of allImages) s.add(img.category)
    return ['전체', ...Array.from(s).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))]
  }, [allImages])

  const byCategory = useMemo(() => {
    const map = new Map<string, ImgItem[]>()
    for (const c of categories) map.set(c, [])
    for (const img of allImages) map.get(img.category)?.push(img)
    map.set('전체', allImages)
    return map
  }, [allImages, categories])

  const [cat, setCat] = useState<string>(categories[0] ?? '전체')
  const visible = byCategory.get(cat) ?? []

  const [open, setOpen] = useState(false)
  const [entering, setEntering] = useState(false) // modal enter/exit animation
  const [idx, setIdx] = useState(0)
  const openAt = useCallback((i: number) => {
    setIdx(i)
    setOpen(true)
  }, [])
  const close = useCallback(() => {
    // animate out then close
    setEntering(false)
    setTimeout(() => setOpen(false), 200)
  }, [])
  const next = useCallback(() => setIdx(i => (i + 1) % visible.length), [visible.length])
  const prev = useCallback(() => setIdx(i => (i - 1 + visible.length) % visible.length), [visible.length])

  useEffect(() => {
    setIdx(0)
    setOpen(false)
  }, [cat])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // handle enter animation on open
  useEffect(() => {
    if (open) {
      // next frame to ensure transition
      const id = requestAnimationFrame(() => setEntering(true))
      return () => cancelAnimationFrame(id)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, next, prev])

  // ── comments (per image) ─────────────────────────────────
  type Comment = { id: string; nickname: string; content: string; createdAt: string }
  const currentKey = visible[idx]?.url ?? ''
  const [comments, setComments] = useState<Comment[]>([])
  const [draft, setDraft] = useState('')

  const refreshComments = useCallback(async (key: string) => {
    const list = await ThreadAPI.list(key)
    setComments(list.map(c => ({ id: c.id, nickname: c.nickname, content: c.content, createdAt: c.createdAt })))
  }, [])

  useEffect(() => {
    if (open && currentKey) {
      refreshComments(currentKey)
      setDraft('')
    }
  }, [open, currentKey, refreshComments])

  const handleAddComment = useCallback(async () => {
    const text = draft.trim()
    if (!text || !currentKey) return
    await ThreadAPI.create(currentKey, { nickname: '익명', password: 'anon', content: text })
    setDraft('')
    await refreshComments(currentKey)
  }, [draft, currentKey, refreshComments])

  const handleDeleteComment = useCallback(async (id: string) => {
    if (role !== 'admin' || !currentKey) return
    await ThreadAPI.delete(id)
    await refreshComments(currentKey)
  }, [role, currentKey, refreshComments])

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <section
        className="
          absolute inset-x-0 bottom-0 top-6
          px-3 md:px-8 lg:px-12
          z-0 overflow-y-auto
        "
      >
        {/* 🔧 여백 수정: mb-45 (오타) → mb-6 md:mb-8 */}
        <GlassCard className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">AI 그림 갤러리</h1>
          <p className="text-sm md:text-base text-white/70 mt-4">
            텍스트로 생성한 그림
          </p>
        </GlassCard>

        {/* 🔧 태그 바 위 여백 추가 (모바일에서 답답했던 간격 개선) */}
        <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
          {categories.map(c => {
            const count = byCategory.get(c)?.length ?? 0
            const active = c === cat
            return (
              <GlassCard key={c} className="p-0 rounded-full">
                <button
                  onClick={() => setCat(c)}
                  className={[
                    // 🔧 모바일 터치 영역 살짝 키움
                    'rounded-full px-2 py-1 text-[15px] leading-none whitespace-nowrap',
                    active
                      ? 'bg-white/10 text-white'
                      : 'bg-transparent text-white/90 hover:bg-white/10'
                  ].join(' ')}
                  aria-pressed={active}
                >
                  {c} <span className="opacity-60">({count})</span>
                </button>
              </GlassCard>
            )
          })}
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
          {visible.map((img, i) => (
            <figure
              key={img.url}
              className="mb-5 break-inside-avoid relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-glass select-none"
            >
              <button onClick={() => openAt(i)} className="block w-full text-left">
                <GlareHover
                  glareColor="#ffffff"
                  glareOpacity={0.3}
                  glareAngle={-30}
                  glareSize={300}
                  transitionDuration={800}
                  playOnce={false}
                  style={{ width: '100%', height: '100%' }}
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    loading="lazy"
                    className="w-full h-auto object-cover block"
                    draggable={false}
                  />
                </GlareHover>
              </button>
            </figure>
          ))}
        </div>
      </section>

      {open && visible[idx] && (
        <div
          className={[
            'fixed inset-0 z-50 flex items-center justify-center',
            entering ? 'bg-black/90' : 'bg-black/0',
            'transition-[background-color] duration-200 ease-out'
          ].join(' ')}
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-[30%] top-1/2 -translate-y-1/2 rounded-full px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white"
            aria-label="이전"
          >
            ◀
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-[30%] top-1/2 -translate-y-1/2 rounded-full px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white"
            aria-label="다음"
          >
            ▶
          </button>

          <div
            className="relative w-[92vw] max-w-5xl max-h-[86vh] rounded-xl overflow-hidden bg-white border border-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={[
                'transition-all duration-200 ease-out',
                entering ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              ].join(' ')}
            >
              <img
                src={visible[idx].url}
                alt={visible[idx].title}
                className="block w-full max-h-[60vh] object-contain bg-white"
              />

              {/* comments */}
              <div className="px-4 py-3 space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">댓글</h3>
                <div className="max-h-[18vh] overflow-y-auto space-y-2 pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-gray-500">첫 댓글을 남겨보세요.</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="text-sm flex items-start gap-2">
                        <div className="flex-1">
                          <span className="text-gray-600 mr-2">{c.nickname}</span>
                          <span className="text-gray-900 break-words align-middle">{c.content}</span>
                        </div>
                        {role === 'admin' && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="shrink-0 text-xs px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-700"
                          >삭제</button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment() } }}
                    placeholder="텍스트만 입력..."
                    className="flex-1 rounded-md bg-black/5 text-gray-900 placeholder:text-gray-400 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 border border-black/10"
                  />
                  <button
                    onClick={handleAddComment}
                    className="px-3 py-2 rounded-md bg-black/5 hover:bg-black/10 text-gray-900 text-sm border border-black/10"
                  >
                    남기기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
