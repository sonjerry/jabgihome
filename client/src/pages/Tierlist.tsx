import { useMemo, useState, useCallback, useEffect } from 'react'
import GlassCard from '../components/GlassCard'
import { useAuth } from '../state/auth'
import { ThreadAPI, ReviewAPI } from '../lib/api'

type Poster = {
  title: string
  url: string
  tier: Tier
}

type Tier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

const POSTER_MODULES = import.meta.glob('../assets/tier/**/*.{png,jpg,jpeg,webp,avif,gif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function extractTierAndTitle(p: string): { tier: Tier; title: string } | null {
  const i = p.indexOf('/tier/')
  if (i === -1) return null
  const rest = p.slice(i + '/tier/'.length)
  const [tier, name] = rest.split('/')
  if (!tier || !name) return null
  const t = tier as Tier
  if (!['S', 'A', 'B', 'C', 'D', 'F'].includes(t)) return null
  const title = decodeURIComponent(name.replace(/\.[^/.]+$/, '')).replace(/[_-]+/g, ' ').trim()
  return { tier: t, title }
}

type Review = { rating: number; text: string; updatedAt?: string }
type Comment = { id: string; nickname: string; content: string; createdAt: string }

export default function Tierlist() {
  const { role } = useAuth()

  const posters: Poster[] = useMemo(
    () => Object.entries(POSTER_MODULES)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([p, url]) => ({
        url,
        ...(extractTierAndTitle(p) ?? { tier: 'F', title: 'Unknown' }),
      })) as Poster[],
    []
  )

  const byTier = useMemo(() => {
    const map = new Map<Tier, Poster[]>()
    ;(['S','A','B','C','D','F'] as Tier[]).forEach(t => map.set(t, []))
    for (const it of posters) map.get(it.tier)?.push(it)
    return map
  }, [posters])

  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)
  const [currentList, setCurrentList] = useState<Poster[]>([])

  const openPoster = useCallback((list: Poster[], index: number) => {
    setCurrentList(list)
    setIdx(index)
    setOpen(true)
  }, [])

  const close = useCallback(() => setOpen(false), [])
  const next = useCallback(() => setIdx(i => (i + 1) % (currentList.length || 1)), [currentList.length])
  const prev = useCallback(() => setIdx(i => (i - 1 + (currentList.length || 1)) % (currentList.length || 1)), [currentList.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, close, next, prev])

  const current = currentList[idx]
  const storageKey = current ? `tier:${current.url}` : ''

  // ── review (admin only) ─────────────────────────────
  const [rating, setRating] = useState<number>(0)
  const [reviewText, setReviewText] = useState('')
  const [savedReview, setSavedReview] = useState<Review | null>(null)

  const refreshReview = useCallback(async (key: string) => {
    const r = await ReviewAPI.get(key)
    if (r) setSavedReview({ rating: r.rating, text: r.text, updatedAt: r.updatedAt })
    else setSavedReview(null)
  }, [])

  // ── comments (anonymous) ────────────────────────────
  const [comments, setComments] = useState<Comment[]>([])
  const [draft, setDraft] = useState('')
  const refreshComments = useCallback(async (key: string) => {
    const list = await ThreadAPI.list(key)
    setComments(list.map(c => ({ id: c.id, nickname: c.nickname, content: c.content, createdAt: c.createdAt })))
  }, [])

  useEffect(() => {
    if (!open || !storageKey) return
    refreshReview(storageKey)
    refreshComments(storageKey)
    setReviewText('')
    setDraft('')
    setRating(savedReview?.rating || 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storageKey])

  const handleSaveReview = useCallback(async () => {
    if (role !== 'admin' || !storageKey) return
    await ReviewAPI.save(storageKey, rating, reviewText.trim())
    await refreshReview(storageKey)
    setReviewText('')
  }, [role, storageKey, rating, reviewText, refreshReview])

  const handleAddComment = useCallback(async () => {
    const text = draft.trim()
    if (!text || !storageKey) return
    await ThreadAPI.create(storageKey, { nickname: '익명', password: 'anon', content: text })
    setDraft('')
    await refreshComments(storageKey)
  }, [draft, storageKey, refreshComments])

  const handleDeleteComment = useCallback(async (id: string) => {
    if (role !== 'admin' || !storageKey) return
    await ThreadAPI.delete(id)
    await refreshComments(storageKey)
  }, [role, storageKey, refreshComments])

  const TIERS: { key: Tier; color: string; label: string }[] = [
    { key: 'S', color: 'from-rose-400/40 to-rose-500/40', label: 'S' },
    { key: 'A', color: 'from-amber-300/40 to-amber-400/40', label: 'A' },
    { key: 'B', color: 'from-yellow-300/40 to-yellow-400/40', label: 'B' },
    { key: 'C', color: 'from-lime-200/40 to-lime-300/40', label: 'C' },
    { key: 'D', color: 'from-green-200/40 to-green-300/40', label: 'D' },
    { key: 'F', color: 'from-slate-200/40 to-slate-300/40', label: 'F' },
  ]

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <section className="absolute inset-x-0 bottom-0 top-6 px-3 md:px-8 lg:px-12 z-0 overflow-y-auto">
        <GlassCard className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">애니 티어리스트</h1>
          <p className="text-sm md:text-base text-white/70 mt-4">`src/tier/`에 올린 포스터가 자동으로 분류됩니다.</p>
        </GlassCard>

        <div className="space-y-3 md:space-y-4">
          {TIERS.map(t => {
            const list = byTier.get(t.key as Tier) || []
            return (
              <div key={t.key}>
                <div className={`glass rounded-2xl p-2 md:p-3 bg-gradient-to-r ${t.color} border border-white/10`}> 
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 rounded-xl px-3 py-1.5 text-lg font-bold bg-black/30 border border-white/10">{t.label}</div>
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                      {list.length === 0 && (
                        <div className="text-sm text-white/60 px-2 py-6">포스터가 없습니다.</div>
                      )}
                      {list.map((p, i) => (
                        <button
                          key={p.url}
                          onClick={() => openPoster(list, i)}
                          className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10 shadow-glass hover:bg-white/10 transition-colors"
                          title={p.title}
                        >
                          <img src={p.url} alt={p.title} className="block w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {open && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur"
          role="dialog" aria-modal="true" onClick={close}
        >
          <div className="relative w-[92vw] max-w-5xl max-h-[86vh] rounded-xl overflow-hidden bg-black/30 backdrop-blur border border-white/10" onClick={(e) => e.stopPropagation()}>
            <img src={current.url} alt={current.title} className="block w-full max-h-[56vh] object-contain bg-black/20" />

            <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white/80">댓글</h3>
                <div className="max-h-[22vh] overflow-y-auto space-y-2 pr-1 mt-2">
                  {comments.length === 0 ? (
                    <p className="text-xs text-white/50">첫 댓글을 남겨보세요.</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="text-sm flex items-start gap-2">
                        <div className="flex-1">
                          <span className="text-white/70 mr-2">{c.nickname}</span>
                          <span className="text-white/90 break-words align-middle">{c.content}</span>
                        </div>
                        {role === 'admin' && (
                          <button onClick={() => handleDeleteComment(c.id)} className="shrink-0 text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200">삭제</button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment() } }}
                    placeholder="텍스트만 입력..."
                    className="flex-1 rounded-md bg-white/10 text-white placeholder:text-white/40 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <button onClick={handleAddComment} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm">남기기</button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white/80">리뷰(관리자)</h3>
                {savedReview ? (
                  <div className="mt-2 space-y-2">
                    <div className="text-white/80">평점: <span className="font-semibold">{savedReview.rating}</span>/10</div>
                    <div className="text-white/80 whitespace-pre-wrap">{savedReview.text}</div>
                    {savedReview.updatedAt && (
                      <div className="text-white/40 text-xs">{new Date(savedReview.updatedAt).toLocaleString()}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-white/50 mt-1 text-sm">아직 리뷰가 없습니다.</p>
                )}

                {role === 'admin' && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs text-white/70">평점(0~10)</label>
                    <input type="range" min={0} max={10} step={1} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full" />
                    <div className="text-white/80">{rating}</div>
                    <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="코멘트" className="w-full min-h-[90px] rounded-md bg-white/10 text-white placeholder:text-white/40 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20" />
                    <div className="flex justify-end">
                      <button onClick={handleSaveReview} className="px-3 py-2 rounded-md bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm">저장</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button onClick={(e) => { e.stopPropagation(); prev() }} aria-label="이전" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 bg-white/10 hover:bg-white/20">◀</button>
            <button onClick={(e) => { e.stopPropagation(); next() }} aria-label="다음" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 bg-white/10 hover:bg-white/20">▶</button>
            <button onClick={close} aria-label="닫기" className="absolute right-2 top-2 rounded-full px-2 py-1 bg-white/10 hover:bg-white/20">✕</button>
          </div>
        </div>
      )}
    </main>
  )
}


