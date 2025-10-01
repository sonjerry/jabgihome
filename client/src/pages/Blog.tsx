// client/src/pages/Blog.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import type { Post, Attachment } from '../types'
import { listPosts } from '../lib/api'
import { useAuth } from '../state/auth'
import { AnimatePresence, motion } from 'framer-motion'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import '../styles/calendar.css'

/* ───────────── 상수(프로젝트 태그/이름 매핑) ───────────── */
const PROJECT_TAGS = ['p1', 'p2', 'p3'] as const
type ProjectTag = typeof PROJECT_TAGS[number]
const PROJECT_TITLES: Record<ProjectTag, string> = {
  p1: '와카와카',
  p2: 'Openai 튜링 테스트',
  p3: '이가을 블로그',
}

/* ───────────── 유틸 ───────────── */
function formatDateYMD(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}
function firstImageFromAttachments(atts?: Attachment[]) {
  const img = (atts || []).find(a => (a.type || '').startsWith('image/') && a.url)
  return img?.url || null
}
function firstImageFromMarkdown(md: string) {
  const m = md.match(/!\[[^\]]*\]\(([^)]+)\)/)
  return m?.[1] || null
}
function pickCover(post: Post) {
  return firstImageFromAttachments(post.attachments) || firstImageFromMarkdown(post.content) || null
}
function hasTag(p: Post, t: string) {
  const tags = (p.tags || []).map(x => (x || '').toLowerCase())
  return tags.includes(t.toLowerCase())
}
function isProjectTag(t?: string): t is ProjectTag {
  if (!t) return false
  return (PROJECT_TAGS as readonly string[]).includes(t.toLowerCase())
}

/* ───────────── 페이지 ───────────── */
export default function Blog() {
  const { role, loading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const location = useLocation()

  // 필터 상태
  const [activeCat, setActiveCat] = useState<string>('전체')
  const [activeDate, setActiveDate] = useState<string | null>(null) // YYYY-MM-DD

  // 모바일 바텀시트
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetTab, setSheetTab] = useState<'calendar' | 'categories'>('calendar')

  useEffect(() => { listPosts().then(setPosts).catch(console.error) }, [])

  // URL 파라미터 해석
  const { progressTag, normalTag, progressTitle } = useMemo(() => {
    const sp = new URLSearchParams(location.search)
    const tagParam = (sp.get('tag') || '').toLowerCase()
    const progressParam = (sp.get('progress') || '').toLowerCase()

    const effectiveProgress = isProjectTag(progressParam)
      ? (progressParam as ProjectTag)
      : (isProjectTag(tagParam) ? (tagParam as ProjectTag) : null)

    const normalTag = tagParam && !isProjectTag(tagParam) ? tagParam : null
    const progressTitle = effectiveProgress ? PROJECT_TITLES[effectiveProgress] : null

    return { progressTag: effectiveProgress, normalTag, progressTitle }
  }, [location.search])

  const inProgressMode = !!progressTag

  // 카테고리 집계 (기본 모드에서만 사용)
  const categories = useMemo(() => {
    const m = new Map<string, number>()
    posts.forEach(p => { if (p.category) m.set(p.category, (m.get(p.category) || 0) + 1) })
    const arr = Array.from(m.entries()).sort((a,b)=>b[1]-a[1]).map(([k])=>k)
    return ['전체', ...arr]
  }, [posts])

  // 달력 표시용 날짜 집합 (기본 모드에서만 사용)
  const datesWithPosts = useMemo(() => {
    const s = new Set<string>()
    posts.forEach(p => s.add(new Date(p.createdAt).toISOString().split('T')[0]))
    return s
  }, [posts])

  // 가시 목록 계산
  const visible = useMemo(() => {
    const byCatAndDate = (arr: Post[]) =>
      arr
        .filter(p => activeCat === '전체' || p.category === activeCat)
        .filter(p => !activeDate || new Date(p.createdAt).toISOString().split('T')[0] === activeDate)

    let base: Post[] = posts

    if (inProgressMode && progressTag) {
      // 진행 모드: 해당 프로젝트 태그 글만
      base = posts.filter(p => hasTag(p, progressTag))
      base = byCatAndDate(base)
    } else if (normalTag) {
      // 일반 태그 필터
      base = posts.filter(p => hasTag(p, normalTag))
      base = byCatAndDate(base)
    } else {
      // 기본 블로그 목록: 프로젝트 태그(p1/p2/p3) 달린 글은 제외(프로젝트 페이지에서 보여줌)
      base = posts
        .filter(p => !(p.tags || []).some(t => isProjectTag((t || '').toLowerCase())))
      base = byCatAndDate(base)
    }

    return base.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [posts, activeCat, activeDate, inProgressMode, progressTag, normalTag])

  const clearFilters = () => { setActiveCat('전체'); setActiveDate(null) }

  // 바텀시트 열렸을 때 바디 스크롤 잠금 + ESC 닫기
  useEffect(() => {
    if (!sheetOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [sheetOpen])

  const headerTitle = inProgressMode && progressTag
    ? `${progressTitle} 진행사항`
    : '블로그'
  const headerSub = inProgressMode ? '프로젝트 업데이트 모음' : '일기같은'

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <section className="absolute inset-x-0 bottom-0 top-6 px-3 md:px-8 lg:px-12 z-0 overflow-y-auto">
        {/* 헤더 */}
        <GlassCard className="mb-6 md:mb-8">
          <div className="flex items-center justify-between px-2 py-2">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">{headerTitle}</h1>
              <p className="text-sm md:text-base text-white/70 mt-3">{headerSub}</p>
            </div>
            {!loading && role === 'admin' && !inProgressMode && (
              <Link to="/blog/new" className="glass px-3 py-2 rounded-xl hover:bg-white/20 text-sm">새 글</Link>
            )}
          </div>
        </GlassCard>

        {/* 데스크톱용 카테고리 칩 (진행 모드에서는 숨김) */}
        {!inProgressMode && (
          <div className="hidden sm:flex mt-2 sm:mt-3 flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
            {categories.map(c => {
              const active = c === activeCat
              return (
                <GlassCard key={c} className="p-0 rounded-full">
                  <button
                    onClick={() => setActiveCat(c)}
                    className={['rounded-full px-3 py-1 text-[15px] leading-none whitespace-nowrap',
                      active ? 'bg-white/10 text-white' : 'bg-transparent text-white/90 hover:bg-white/10'].join(' ')}
                    aria-pressed={active}
                  >{c}</button>
                </GlassCard>
              )
            })}
            {(activeCat !== '전체' || activeDate) && (
              <button onClick={clearFilters} className="ml-1 text-xs underline opacity-90 hover:opacity-100">필터 초기화</button>
            )}
          </div>
        )}

        {/* 레이아웃: 데스크톱 3:1 / 모바일 1열 */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* 글 목록 (3) */}
          <div className="lg:col-span-3">
            <div className="relative">
              {!inProgressMode && (
                <div className="hidden md:block absolute left-3 top-0 bottom-0 w-px bg-white/10 pointer-events-none" />
              )}
              <ul className="space-y-4 md:space-y-5">
                {visible.map((p) => {
                  const cover = pickCover(p)
                  const excerpt = p.content
                    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
                    .replace(/[#*`>\-]/g, '')
                    .slice(0, 180)

                  return (
                    <li key={p.id} className="relative pl-0 md:pl-8">
                      {!inProgressMode && (
                        <div className="hidden md:block absolute left-2.5 top-8 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.2)]" />
                      )}
                      <article className="rounded-2xl bg-white/5 border border-white/10 shadow-glass overflow-hidden">
                        <Link to={`/blog/${p.id}`} className="block select-none">
                          <div className="grid grid-cols-[88px,1fr] md:grid-cols-[128px,1fr] gap-3 md:gap-4 p-3 md:p-4 items-center">
                            {/* 썸네일 */}
                            <div className="w-[88px] h-[88px] md:w-[128px] md:h-[128px] rounded-xl overflow-hidden bg-white/5 border border-white/10">
                              {cover ? (
                                <img src={cover} alt={p.title} className="w-full h-full object-cover block" loading="lazy" draggable={false} />
                              ) : (
                                <div className="w-full h-full grid place-items-center text-xs text-white/50">No Image</div>
                              )}
                            </div>
                            {/* 텍스트 */}
                            <div className="min-w-0">
                              <header className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg md:text-xl font-semibold leading-snug line-clamp-1">{p.title}</h2>
                                {p.category && (
                                  <span className="text-[11px] md:text-xs px-2 py-0.5 rounded-full border border-white/15 bg-white/5">{p.category}</span>
                                )}
                              </header>
                              <p className="text-[12px] md:text-sm text-cream/70 mt-1">{formatDateYMD(p.createdAt)}</p>
                              <p className="text-sm md:text-base text-cream/85 leading-relaxed mt-2 line-clamp-2 md:line-clamp-3">
                                {excerpt}{p.content.length > 180 ? '…' : ''}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </article>
                    </li>
                  )
                })}
              </ul>
              {visible.length === 0 && (<p className="text-cream/70">데이터베이스에서 자료 로딩중</p>)}
            </div>
          </div>

          {/* 달력 (진행 모드에서는 숨김) */}
          {!inProgressMode && (
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-20">
                <div className="rounded-2xl bg-white/5 border border-white/10 shadow-glass p-4">
                  <h3 className="text-lg md:text-xl font-semibold mb-3">달력</h3>
                  <Calendar
                    selectRange={false}
                    value={null}
                    onClickDay={(value: Date) => {
                      const s = value.toISOString().split('T')[0]
                      setActiveDate(activeDate === s ? null : s)
                    }}
                    tileClassName={({ date, view }: { date: Date; view: string }) => {
                      if (view !== 'month') return undefined
                      const s = date.toISOString().split('T')[0]
                      const has = datesWithPosts.has(s)
                      const isSel = activeDate === s
                      return [(has ? 'cal-has-post' : 'cal-no-post'), (isSel ? 'cal-selected' : '')].join(' ')
                    }}
                    prev2Label={null}
                    next2Label={null}
                  />
                  <div className="mt-3 flex items-center gap-4 text-xs text-cream/80">
                    <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded cal-dot has" /> 글 있음</span>
                    <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded cal-dot none" /> 없음</span>
                  </div>
                  {activeDate && (
                    <div className="mt-2 text-xs text-cream/80">
                      선택: <button className="underline" onClick={() => setActiveDate(null)}>{formatDateYMD(activeDate)} ✕</button>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* 📱 모바일 전용: FAB + 바텀시트 (진행 모드에서는 숨김) */}
        {!inProgressMode && (
          <>
            <button
              onClick={() => setSheetOpen(true)}
              className="sm:hidden fixed bottom-4 right-4 z-50 rounded-full px-4 py-3 bg-white/20 backdrop-blur border border-white/30 shadow"
              aria-label="필터 열기"
            >
              필터
            </button>

            <AnimatePresence>
              {sheetOpen && (
                <>
                  <motion.button
                    aria-label="닫기"
                    className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50"
                    onClick={() => setSheetOpen(false)}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  />
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-x-0 bottom-0 z-[60] rounded-t-2xl bg-[#0b0b0b]/95 border-t border-white/10"
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
                  >
                    <div className="mx-auto w-full max-w-[720px] p-3">
                      <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-white/20" />
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm opacity-80">필터</div>
                        <div className="flex items-center gap-2">
                          {(activeCat !== '전체' || activeDate) && (
                            <button onClick={clearFilters} className="text-xs underline opacity-90">초기화</button>
                          )}
                          <button onClick={() => setSheetOpen(false)} className="rounded-lg px-2 py-1 text-xs bg-white/10 border border-white/20">닫기</button>
                        </div>
                      </div>

                      {/* 탭 */}
                      <div className="mb-3 grid grid-cols-2 gap-2">
                        {(['calendar','categories'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setSheetTab(t)}
                            className={['py-2 rounded-xl border text-sm',
                              sheetTab === t ? 'bg-white/20 border-white/30' : 'bg-white/10 border-white/10 hover:bg-white/20'
                            ].join(' ')}
                          >
                            {t === 'calendar' ? '달력' : '카테고리'}
                          </button>
                        ))}
                      </div>

                      <div className="max-h-[70vh] overflow-y-auto pr-1">
                        {sheetTab === 'calendar' && (
                          <div className="p-1">
                            <Calendar
                              selectRange={false}
                              value={null}
                              onClickDay={(value: Date) => {
                                const s = value.toISOString().split('T')[0]
                                setActiveDate(activeDate === s ? null : s)
                              }}
                              tileClassName={({ date, view }: { date: Date; view: string }) => {
                                if (view !== 'month') return undefined
                                const s = date.toISOString().split('T')[0]
                                const has = datesWithPosts.has(s)
                                const isSel = activeDate === s
                                return [(has ? 'cal-has-post' : 'cal-no-post'), (isSel ? 'cal-selected' : '')].join(' ')
                              }}
                              prev2Label={null}
                              next2Label={null}
                            />
                          </div>
                        )}
                        {sheetTab === 'categories' && (
                          <div className="p-1 flex flex-wrap gap-2">
                            {categories.map(c => {
                              const active = c === activeCat
                              return (
                                <button
                                  key={c}
                                  onClick={() => setActiveCat(c)}
                                  className={['text-[12px] px-3 py-1.5 rounded-full border',
                                    active ? 'bg-white/20 border-white/30' : 'bg-white/10 border-white/10 hover:bg-white/20'
                                  ].join(' ')}
                                >
                                  {c}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        )}
      </section>
    </main>
  )
}
