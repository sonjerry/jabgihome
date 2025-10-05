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

  // 별점 컴포넌트 (0.5 단위 지원)
  const StarRating = ({ value, onChange, editable = false }: { value: number; onChange?: (rating: number) => void; editable?: boolean }) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null)
    
    const handleStarClick = (starValue: number) => {
      if (!editable || !onChange) return
      onChange(starValue)
    }

    const handleStarHover = (starValue: number) => {
      if (!editable) return
      setHoverValue(starValue)
    }

    const handleMouseLeave = () => {
      if (!editable) return
      setHoverValue(null)
    }

    const displayValue = hoverValue || value

    const getStarFill = (starIndex: number) => {
      if (starIndex < displayValue) return '#fbbf24'
      return 'none'
    }

    const getStarStroke = (starIndex: number) => {
      if (starIndex < displayValue) return '#fbbf24'
      return '#6b7280'
    }

    return (
      <div className="flex items-center gap-0.5" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            disabled={!editable}
            className={`transition-colors ${editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={getStarFill(star)}
              stroke={getStarStroke(star)}
              strokeWidth={getStarFill(star) === 'none' ? 1 : 0}
              className="transition-all duration-150"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
        <span className="ml-3 text-sm text-white/70">
          {value.toFixed(1)}/5.0
        </span>
      </div>
    )
  }

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

  const TIERS: { key: Tier; color: string; label: string; desc: string }[] = [
    { key: 'S', color: 'from-rose-400/40 to-rose-500/40', label: 'S', desc: '강렬한 여운, 완벽한 서사, 흠잡을 곳 없는 작화, 모든걸 아우른 1황' },
    { key: 'A', color: 'from-amber-300/40 to-amber-400/40', label: 'A', desc: '걸작. 감동을 주는 작품들' },
    { key: 'B', color: 'from-blue-300/40 to-blue-400/40', label: 'B', desc: '수작. 뛰어난 개성을 갖고 있는 작품들' },
    { key: 'C', color: 'from-lime-200/40 to-lime-300/40', label: 'C', desc: '평작. 충분히 재밌다.시간이 아깝지 않은 작품들' },
    { key: 'D', color: 'from-green-200/40 to-green-300/40', label: 'D', desc: '흠... 그정돈가? 아쉬운 점들이 더 큰 작품들' },
    { key: 'F', color: 'from-slate-200/40 to-slate-300/40', label: 'F', desc: '굳이 안봐도 되는 작품들' },
  ]

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <section className="absolute inset-x-0 bottom-0 top-6 px-3 md:px-8 lg:px-12 z-0 overflow-y-auto">
        <GlassCard className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">애니 티어리스트</h1>
          <p className="text-sm md:text-base text-white/70 mt-4">객관적이고 정확한 분류</p>
        </GlassCard>

        <div className="space-y-3 md:space-y-4">
          {TIERS.map(t => {
            const list = byTier.get(t.key as Tier) || []
            return (
              <div key={t.key}>
                <div className={`glass rounded-2xl p-2 md:p-3 bg-gradient-to-r ${t.color} border border-white/10`}> 
                  <div className="flex items-center gap-3 mb-2">
                    <div className="shrink-0 rounded-xl px-3 py-1.5 text-lg font-bold bg-black/30 border border-white/10">{t.label}</div>
                    <p className="text-white/85 text-sm">{t.desc}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
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
            )
          })}
        </div>
      </section>

      {open && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur"
          role="dialog" aria-modal="true" onClick={close}
        >
          <div className="relative w-[95vw] max-w-6xl max-h-[90vh] rounded-xl overflow-hidden bg-black/30 backdrop-blur border border-white/10 flex" onClick={(e) => e.stopPropagation()}>
            {/* 왼쪽: 포스터 */}
            <div className="w-1/2 min-w-0 flex-shrink-0">
              <img 
                src={current.url} 
                alt={current.title} 
                className="w-full h-full object-contain bg-black/20" 
              />
            </div>

            {/* 오른쪽: 별점, 리뷰, 댓글 */}
            <div className="w-1/2 flex flex-col p-6 min-w-0">
              {/* 제목 */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white mb-2">{current.title}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/60">티어:</span>
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${
                    current.tier === 'S' ? 'bg-rose-500/20 text-rose-300' :
                    current.tier === 'A' ? 'bg-amber-500/20 text-amber-300' :
                    current.tier === 'B' ? 'bg-blue-500/20 text-blue-300' :
                    current.tier === 'C' ? 'bg-lime-500/20 text-lime-300' :
                    current.tier === 'D' ? 'bg-green-500/20 text-green-300' :
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                    {current.tier}
                  </span>
                </div>
              </div>

              {/* 별점 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white/90 mb-3">평점</h3>
                {savedReview ? (
                  <div className="space-y-2">
                    <StarRating value={savedReview.rating} editable={false} />
                    {role === 'admin' && (
                      <div className="mt-3">
                        <label className="block text-sm text-white/70 mb-2">평점 수정</label>
                        <StarRating value={rating} onChange={setRating} editable={true} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {role === 'admin' ? (
                      <div className="space-y-2">
                        <label className="block text-sm text-white/70 mb-2">평점 설정</label>
                        <StarRating value={rating} onChange={setRating} editable={true} />
                      </div>
                    ) : (
                      <p className="text-white/50 text-sm">아직 평점이 없습니다.</p>
                    )}
                  </div>
                )}
              </div>

              {/* 리뷰 */}
              <div className="mb-6 flex-1 min-h-0">
                <h3 className="text-lg font-semibold text-white/90 mb-3">리뷰</h3>
                {savedReview ? (
                  <div className="space-y-2">
                    <div className="text-white/80 whitespace-pre-wrap bg-white/5 rounded-lg p-3 min-h-[100px]">
                      {savedReview.text}
                    </div>
                    {savedReview.updatedAt && (
                      <div className="text-white/40 text-xs">
                        {new Date(savedReview.updatedAt).toLocaleString()}
                      </div>
                    )}
                    {role === 'admin' && (
                      <div className="mt-3 space-y-2">
                        <label className="block text-sm text-white/70">리뷰 수정</label>
                        <textarea 
                          value={reviewText} 
                          onChange={(e) => setReviewText(e.target.value)} 
                          placeholder="리뷰를 작성하세요..." 
                          className="w-full min-h-[80px] rounded-md bg-white/10 text-white placeholder:text-white/40 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20" 
                        />
                        <div className="flex justify-end">
                          <button 
                            onClick={handleSaveReview} 
                            className="px-4 py-2 rounded-md bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm transition-colors"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {role === 'admin' ? (
                      <div className="space-y-2">
                        <textarea 
                          value={reviewText} 
                          onChange={(e) => setReviewText(e.target.value)} 
                          placeholder="리뷰를 작성하세요..." 
                          className="w-full min-h-[100px] rounded-md bg-white/10 text-white placeholder:text-white/40 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20" 
                        />
                        <div className="flex justify-end">
                          <button 
                            onClick={handleSaveReview} 
                            className="px-4 py-2 rounded-md bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm transition-colors"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/50 text-sm bg-white/5 rounded-lg p-3 min-h-[100px] flex items-center justify-center">
                        아직 리뷰가 없습니다.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 댓글 */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-white/90 mb-3">댓글</h3>
                <div className="max-h-[200px] overflow-y-auto space-y-2 mb-3">
                  {comments.length === 0 ? (
                    <p className="text-xs text-white/50 text-center py-4">첫 댓글을 남겨보세요.</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="text-sm bg-white/5 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="text-white/70 mr-2 font-medium">{c.nickname}</span>
                            <span className="text-white/90 break-words">{c.content}</span>
                          </div>
                          {role === 'admin' && (
                            <button 
                              onClick={() => handleDeleteComment(c.id)} 
                              className="shrink-0 text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-colors"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment() } }}
                    placeholder="댓글을 입력하세요..."
                    className="flex-1 rounded-md bg-white/10 text-white placeholder:text-white/40 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <button 
                    onClick={handleAddComment} 
                    className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                  >
                    등록
                  </button>
                </div>
              </div>
            </div>

            {/* 네비게이션 버튼들 */}
            <button 
              onClick={(e) => { e.stopPropagation(); prev() }} 
              aria-label="이전" 
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors"
            >
              ◀
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); next() }} 
              aria-label="다음" 
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors"
            >
              ▶
            </button>
            <button 
              onClick={close} 
              aria-label="닫기" 
              className="absolute right-2 top-2 rounded-full px-2 py-1 bg-white/10 hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  )
}


