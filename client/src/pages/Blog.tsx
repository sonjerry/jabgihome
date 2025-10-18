// client/src/pages/Blog.tsx
import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import type { Post, Attachment } from '../types'
import { listPosts } from '../lib/api'
import { useAuth } from '../state/auth'
import { AnimatePresence, motion } from 'framer-motion'
import 'react-calendar/dist/Calendar.css'
import '../styles/calendar.css'

// Lazy-load heavy calendar component to speed up initial load
const CalendarLazy = lazy(() => import('react-calendar'))

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

// 콘텐츠(HTML/마크다운 혼재)를 카드 미리보기용 평문으로 정제
function toPlainText(input: string) {
  try {
    // 우선 마크다운 일부를 간단 치환 (링크 텍스트 유지)
    let s = (input || '')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // 이미지 마크다운 제거
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크는 텍스트만 남김

    // HTML → 텍스트 디코드 및 태그 제거
    const div = document.createElement('div')
    div.innerHTML = s
    s = (div.textContent || div.innerText || '')

    // 공백 정리
    s = s.replace(/\s+/g, ' ').trim()
    return s
  } catch {
    return (input || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
}

function makeExcerpt(content: string, maxLen = 180) {
  const plain = toPlainText(content)
  return plain.length > maxLen ? plain.slice(0, maxLen) : plain
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

  // API에서 직접 데이터 로딩
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const apiData = await listPosts()
        setPosts(apiData)
      } catch (error) {
        console.error('Failed to load posts:', error)
        setPosts([])
      }
    }
    
    loadPosts()
  }, [])

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

  // 가시 목록 계산 (조회 여부로 제거하지 않음)
  const viewedSet = useMemo(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('viewedPosts') : null
      return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>()
    } catch { return new Set<string>() }
  }, [])

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

  // 스켈레톤 표시 조건: 아직 posts가 비었고 최초 로딩중인 상태로 간주
  const isInitialLoading = posts.length === 0

  // 커버 이미지 프리패치: posts가 로드되면 상단 n개의 커버 이미지를 사전 요청
  useEffect(() => {
    if (!posts || posts.length === 0) return
    const top = posts.slice(0, 8)
    top.forEach(p => {
      const url = pickCover(p)
      if (!url) return
      const img = new Image()
      img.src = url
    })
  }, [posts])

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
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">{headerTitle}</h1>
                <p className="text-sm md:text-base text-white/70 mt-3">{headerSub}</p>
              </div>
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
                {isInitialLoading && (
                  Array.from({ length: 8 }).map((_, i) => (
                    <li key={`skeleton-${i}`} className="relative pl-0 md:pl-8">
                      <article className="rounded-2xl bg-white/5 border border-white/10 shadow-glass overflow-hidden">
                        <div className="grid grid-cols-[88px,1fr] md:grid-cols-[128px,1fr] gap-3 md:gap-4 p-3 md:p-4 items-center">
                          <div className="w-[88px] h-[88px] md:w-[128px] md:h-[128px] rounded-xl overflow-hidden bg-white/10 animate-pulse" />
                          <div className="min-w-0">
                            <div className="h-4 md:h-5 w-2/3 bg-white/10 rounded animate-pulse" />
                            <div className="mt-2 h-3 w-1/3 bg-white/10 rounded animate-pulse" />
                            <div className="mt-3 space-y-2">
                              <div className="h-3 bg-white/10 rounded animate-pulse" />
                              <div className="h-3 w-5/6 bg-white/10 rounded animate-pulse" />
                            </div>
                          </div>
                        </div>
                      </article>
                    </li>
                  ))
                )}
                {visible.map((p) => {
                  const cover = pickCover(p)
                  const plain = toPlainText(p.content)
                  const excerpt = plain.slice(0, 180)
                  const isTrimmed = plain.length > 180

                  return (
                    <li key={p.id} className="relative pl-0 md:pl-8">
                      {!inProgressMode && !viewedSet.has(p.id) && (
                        <div className="hidden md:block absolute left-2.5 top-8 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.2)]" />
                      )}
                      <article className="rounded-2xl bg-white/5 border border-white/10 shadow-glass overflow-hidden">
                        <Link 
                          to={`/blog/${p.id}${inProgressMode && progressTag ? `?progress=${encodeURIComponent(progressTag)}` : ''}`} 
                          className="block select-none"
                        >
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
                                {excerpt}{isTrimmed ? '…' : ''}
                              </p>
                            </div>
                          </div>
                        </Link>
                        
                        {/* 관리자 전용 수정/삭제 버튼 */}
                        {!loading && role === 'admin' && (
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <Link
                              to={`/blog/edit/${p.id}${inProgressMode && progressTag ? `?progress=${encodeURIComponent(progressTag)}` : ''}`}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              title="수정"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                              </svg>
                            </Link>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (!confirm('정말 삭제할까요? 되돌릴 수 없습니다.')) return
                                try {
                                  const API_BASE = import.meta.env.VITE_API_URL || ''
                                  const res = await fetch(`${API_BASE}/api/posts/${p.id}`, {
                                    method: 'DELETE',
                                    credentials: 'include',
                                  })
                                  if (!res.ok) throw new Error(await res.text().catch(() => 'delete failed'))
                                  // 페이지 새로고침으로 목록 업데이트
                                  window.location.reload()
                                } catch (err) {
                                  console.error(err)
                                  alert('삭제에 실패했습니다.')
                                }
                              }}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="삭제"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </article>
                    </li>
                  )
                })}
              </ul>
              {visible.length === 0 && !isInitialLoading && (<p className="text-cream/70">게시물이 없습니다.</p>)}
            </div>
          </div>

          {/* 달력 (진행 모드에서는 숨김) */}
          {!inProgressMode && (
            <aside className="hidden lg:block lg:col-span-1">
              <div className="lg:sticky lg:top-20">
                <GlassCard>
                  <h3 className="text-lg md:text-xl font-semibold mb-3">달력</h3>
                  <Suspense fallback={<div className="text-sm text-cream/70">달력 로딩중…</div>}>
                  <CalendarLazy
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
                  </Suspense>
                  <div className="mt-3 flex items-center gap-4 text-xs text-cream/80">
                    <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded cal-dot has" /> 글 있음</span>
                    <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded cal-dot none" /> 없음</span>
                  </div>
                  {activeDate && (
                    <div className="mt-2 text-xs text-cream/80">
                      선택: <button className="underline" onClick={() => setActiveDate(null)}>{formatDateYMD(activeDate)} ✕</button>
                    </div>
                  )}
                </GlassCard>
              </div>
            </aside>
          )}
        </div>

        {/* 📱 모바일 전용: FAB + 바텀시트 (진행 모드에서는 숨김) */}
        {!inProgressMode && (
          <>
            <button
              onClick={() => setSheetOpen(true)}
              className="md:hidden fixed left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-t-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-glass"
              style={{ bottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}
              aria-label="필터 열기"
            >
              <span className="block text-base leading-none">^</span>
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
                    className="fixed inset-x-0 bottom-0 z-[60] rounded-t-2xl bg-white/10 backdrop-blur-xl border-t border-white/20 shadow-glass"
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


                      <div className="max-h-[70vh] overflow-y-auto pr-1">
                        {/* 모바일용 컴팩트 달력 */}
                        <div className="p-1">
                          <Suspense fallback={<div className="text-xs text-cream/70 px-1 pb-2">달력 로딩중…</div>}>
                          <CalendarLazy
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
                          </Suspense>
                        </div>

                        {/* 카테고리 필터 */}
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
