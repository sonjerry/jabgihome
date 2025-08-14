// client/src/pages/Blog.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import type { Post, Attachment } from '../types'
import { listPosts } from '../lib/api'
import { useAuth } from '../state/auth'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import '../styles/calendar.css'

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

/* ───────────── 페이지 ───────────── */
export default function Blog() {
  const { role, loading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [activeCat, setActiveCat] = useState<string>('전체')
  const [activeDate, setActiveDate] = useState<string | null>(null) // YYYY-MM-DD

  useEffect(() => {
    listPosts().then(setPosts).catch(console.error)
  }, [])

  // 카테고리 집계
  const categories = useMemo(() => {
    const m = new Map<string, number>()
    posts.forEach(p => { if (p.category) m.set(p.category, (m.get(p.category) || 0) + 1) })
    const arr = Array.from(m.entries()).sort((a,b)=>b[1]-a[1]).map(([k])=>k)
    return ['전체', ...arr]
  }, [posts])

  // 달력 표시용 날짜 집합
  const datesWithPosts = useMemo(() => {
    const s = new Set<string>()
    posts.forEach(p => s.add(new Date(p.createdAt).toISOString().split('T')[0]))
    return s
  }, [posts])

  // 필터링
  const visible = useMemo(() => {
    return posts
      .filter(p => activeCat === '전체' || p.category === activeCat)
      .filter(p => !activeDate || new Date(p.createdAt).toISOString().split('T')[0] === activeDate)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [posts, activeCat, activeDate])

  const clearFilters = () => { setActiveCat('전체'); setActiveDate(null) }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <section
        className="
          absolute inset-x-0 bottom-0 top-6
          px-3 md:px-8 lg:px-12
          z-0 overflow-y-auto
        "
      >
        {/* 헤더 */}
        <GlassCard className="mb-6 md:mb-8">
          <div className="flex items-center justify-between px-2 py-2">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">블로그</h1>
              <p className="text-sm md:text-base text-white/70 mt-3">일기같은</p>
            </div>
            {!loading && role === 'admin' && (
              <Link to="/blog/new" className="glass px-3 py-2 rounded-xl hover:bg-white/20 text-sm">
                새 글
              </Link>
            )}
          </div>
        </GlassCard>

        {/* 카테고리 칩 */}
        <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
          {categories.map(c => {
            const active = c === activeCat
            return (
              <GlassCard key={c} className="p-0 rounded-full">
                <button
                  onClick={() => setActiveCat(c)}
                  className={[
                    'rounded-full px-3 py-1 text-[15px] leading-none whitespace-nowrap',
                    active ? 'bg-white/10 text-white' : 'bg-transparent text-white/90 hover:bg-white/10'
                  ].join(' ')}
                  aria-pressed={active}
                >
                  {c}
                </button>
              </GlassCard>
            )
          })}
          {(activeCat !== '전체' || activeDate) && (
            <button
              onClick={clearFilters}
              className="ml-1 text-xs underline opacity-90 hover:opacity-100"
            >
              필터 초기화
            </button>
          )}
        </div>

        {/* ───────────── 레이아웃: 데스크톱 3:1 / 모바일 1열 ───────────── */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* 글 목록 (3) — 가로형 카드 + 타임라인 */}
          <div className="lg:col-span-3">
            <div className="relative">
              {/* 타임라인 수직 라인 (데스크톱 이상에서 표시) */}
              <div className="hidden md:block absolute left-3 top-0 bottom-0 w-px bg-white/10 pointer-events-none" />

              <ul className="space-y-4 md:space-y-5">
                {visible.map((p, i) => {
                  const cover = pickCover(p)
                  const excerpt = p.content
                    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
                    .replace(/[#*`>\-]/g, '')
                    .slice(0, 180)

                  return (
                    <li key={p.id} className="relative pl-0 md:pl-8">
                      {/* 타임라인 노드 */}
                      <div className="hidden md:block absolute left-2.5 top-8 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.2)]" />

                      <article className="rounded-2xl bg-white/5 border border-white/10 shadow-glass overflow-hidden">
                        <Link to={`/blog/${p.id}`} className="block select-none">
                          {/* 가로형: 썸네일(왼쪽 정사각) + 본문(오른쪽) */}
                          <div className="grid grid-cols-[88px,1fr] md:grid-cols-[128px,1fr] gap-3 md:gap-4 p-3 md:p-4 items-center">
                            {/* 정비율(정사각) 썸네일 - 크기 축소 */}
                            <div className="w-[88px] h-[88px] md:w-[128px] md:h-[128px] rounded-xl overflow-hidden bg-white/5 border border-white/10">
                              {cover ? (
                                <img
                                  src={cover}
                                  alt={p.title}
                                  className="w-full h-full object-cover block"
                                  loading="lazy"
                                  draggable={false}
                                />
                              ) : (
                                <div className="w-full h-full grid place-items-center text-xs text-white/50">No Image</div>
                              )}
                            </div>

                            {/* 텍스트 */}
                            <div className="min-w-0">
                              <header className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg md:text-xl font-semibold leading-snug line-clamp-1">{p.title}</h2>
                                {p.category && (
                                  <span className="text-[11px] md:text-xs px-2 py-0.5 rounded-full border border-white/15 bg-white/5">
                                    {p.category}
                                  </span>
                                )}
                              </header>

                              <p className="text-[12px] md:text-sm text-cream/70 mt-1">
                                {formatDateYMD(p.createdAt)}
                              </p>

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

              {visible.length === 0 && (
                <p className="text-cream/70">글이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 달력 (1) */}
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
                    return [
                      has ? 'cal-has-post' : 'cal-no-post',
                      isSel ? 'cal-selected' : ''
                    ].join(' ')
                  }}
                  prev2Label={null}
                  next2Label={null}
                />

                {/* 범례 & 선택 요약 */}
                <div className="mt-3 flex items-center gap-4 text-xs text-cream/80">
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded cal-dot has" /> 글 있음
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded cal-dot none" /> 없음
                  </span>
                </div>
                {activeDate && (
                  <div className="mt-2 text-xs text-cream/80">
                    선택: <button className="underline" onClick={() => setActiveDate(null)}>{formatDateYMD(activeDate)} ✕</button>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
