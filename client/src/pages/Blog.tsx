// client/src/pages/Blog.tsx
import { useEffect, useMemo, useState, useEffect as useEffectReact } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import GlassCard from '../components/GlassCard'
import type { Post, Attachment } from '../types'
import { listPosts } from '../lib/api'
import { useAuth } from '../state/auth'
import PageShell from '../components/PageShell'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import '../styles/calendar.css'

function formatDate(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
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

function BlogHeader() {
  const { role, loading } = useAuth()
  return (
    <GlassCard className="mb-5 md:mb-6">
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
  )
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([])
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeDate, setActiveDate] = useState<string | null>(null) // YYYY-MM-DD

  // 모바일 필터 바텀시트
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetTab, setSheetTab] = useState<'calendar' | 'tags' | 'categories'>('calendar')

  useEffect(() => { listPosts().then(setPosts).catch(console.error) }, [])

  // 카테고리/태그/날짜 파생 데이터
  const categories = useMemo(() => {
    const map = new Map<string, number>()
    posts.forEach(p => { if (p.category) map.set(p.category, (map.get(p.category) || 0) + 1) })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [posts])

  const tags = useMemo(() => {
    const map = new Map<string, number>()
    posts.forEach(p => (p.tags || []).forEach(t => map.set(t, (map.get(t) || 0) + 1)))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [posts])

  const datesWithPosts = useMemo(() => {
    const set = new Set<string>()
    posts.forEach(p => {
      const d = new Date(p.createdAt)
      const s = d.toISOString().split('T')[0]
      set.add(s)
    })
    return set
  }, [posts])

  const filtered = useMemo(() => {
    return posts
      .filter(p => !activeCat || p.category === activeCat)
      .filter(p => !activeTag || (p.tags || []).includes(activeTag))
      .filter(p => {
        if (!activeDate) return true
        const d = new Date(p.createdAt).toISOString().split('T')[0]
        return d === activeDate
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [posts, activeCat, activeTag, activeDate])

  const clearAll = () => { setActiveCat(null); setActiveTag(null); setActiveDate(null) }

  // 바텀시트 열렸을 때 바디 스크롤 잠금 + ESC 닫기
  useEffectReact(() => {
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

  return (
    <PageShell className="pt-16 md:pt-8 max-w-[1400px] mx-auto px-3">
      <BlogHeader />

      {/* 활성 필터 요약 */}
      {(activeCat || activeTag || activeDate) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {activeCat && (
            <button
              onClick={() => setActiveCat(null)}
              className="px-2 py-1 rounded-full border border-white/20 bg-white/10 text-xs"
            >
              카테고리: {activeCat} ✕
            </button>
          )}
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="px-2 py-1 rounded-full border border-white/20 bg-white/10 text-xs"
            >
              #{activeTag} ✕
            </button>
          )}
          {activeDate && (
            <button
              onClick={() => setActiveDate(null)}
              className="px-2 py-1 rounded-full border border-white/20 bg-white/10 text-xs"
            >
              {formatDate(activeDate)} ✕
            </button>
          )}
          <button onClick={clearAll} className="ml-1 text-xs underline opacity-90 hover:opacity-100">필터 초기화</button>
        </div>
      )}

      {/* 카테고리 버튼(가로 스크롤) */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pr-1">
        {categories.map(([cat, count]) => (
          <button
            key={cat}
            onClick={() => setActiveCat(activeCat === cat ? null : cat)}
            className={[
              'px-3 py-1 rounded-full border text-sm whitespace-nowrap',
              activeCat === cat ? 'bg-white/20 border-white/30' : 'bg-white/10 border-white/10 hover:bg-white/20'
            ].join(' ')}
          >
            {cat} <span className="opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* 목록 + 사이드바 */}
      <div className="grid gap-4 lg:grid-cols-[3fr,1.1fr]">
        {/* 목록 */}
        <div className="space-y-4">
          {filtered.map(p => {
            const cover = pickCover(p)
            const excerpt = p.content.replace(/!\[[^\]]*\]\([^)]+\)/g, '').replace(/[#*`>\-]/g, '').slice(0, 160)
            return (
              <GlassCard key={p.id} className="hover:bg-white/10 transition">
                <Link to={`/blog/${p.id}`} className="block p-4">
                  <div className="grid gap-4 md:gap-5 sm:grid-cols-[140px,1fr] items-start">
                    {cover ? (
                      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl sm:order-1">
                        <img src={cover} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ) : <div className="hidden sm:block sm:order-1" />}

                    <div className="sm:order-2">
                      <header className="mb-1.5">
                        <h2 className="text-xl md:text-2xl font-semibold leading-snug line-clamp-2">{p.title}</h2>
                        <p className="text-xs md:text-sm text-cream/70 mt-1">
                          {formatDate(p.createdAt)} {p.category ? `• ${p.category}` : ''}
                        </p>
                      </header>

                      <p className="text-sm md:text-base text-cream/85 leading-relaxed line-clamp-3">
                        {excerpt}{p.content.length > 160 ? '…' : ''}
                      </p>

                      {p.tags?.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-3">
                          {p.tags.map((t, i) => (
                            <button
                              key={i}
                              onClick={e => { e.preventDefault(); setActiveTag(activeTag === t ? null : t) }}
                              className={[
                                'text-[11px] px-2 py-1 rounded-full border',
                                activeTag === t ? 'bg-white/20 border-white/30' : 'bg-white/10 border-white/10 hover:bg-white/20'
                              ].join(' ')}
                            >
                              #{t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </GlassCard>
            )
          })}
          {filtered.length === 0 && <p className="text-cream/70">조건에 맞는 글이 없습니다.</p>}
        </div>

        {/* 사이드바: 데스크탑 전용 */}
        <div className="space-y-4 lg:sticky lg:top-20 hidden lg:block">
          {/* 달력 */}
          <GlassCard>
            <div className="p-3">
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
              <div className="mt-2 flex items-center gap-3 text-xs text-cream/80">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded cal-dot has" />
                  글 있음
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded cal-dot none" />
                  없음
                </span>
              </div>
            </div>
          </GlassCard>

          {/* 태그 */}
          <GlassCard>
            <div className="p-3 flex flex-wrap gap-2">
              {tags.map(([t, count]) => (
                <button
                  key={t}
                  onClick={() => setActiveTag(activeTag === t ? null : t)}
                  className={[
                    'text-[11px] px-2 py-1 rounded-full border',
                    activeTag === t ? 'bg-white/20 border-white/30' : 'bg-white/10 border-white/10 hover:bg-white/20'
                  ].join(' ')}
                >
                  #{t} <span className="opacity-70">({count})</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* 모바일 전용 필터 FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-50 rounded-full px-4 py-3 bg-white/20 backdrop-blur border border-white/30 shadow"
        aria-label="필터 열기"
      >
        필터
      </button>

      {/* 모바일 바텀시트 */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.button
              aria-label="닫기"
              className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50"
              onClick={() => setSheetOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-[#0b0b0b]/95 border-t border-white/10"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <div className="mx-auto w-full max-w-[720px] p-3">
                <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-white/20" />
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm opacity-80">필터</div>
                  <div className="flex items-center gap-2">
                    {(activeCat || activeTag || activeDate) && (
                      <button onClick={clearAll} className="text-xs underline opacity-90">초기화</button>
                    )}
                    <button
                      onClick={() => setSheetOpen(false)}
                      className="rounded-lg px-2 py-1 text-xs bg-white/10 border border-white/20"
                    >
                      닫기
                    </button>
                  </div>
                </div>

                {/* 탭 */}
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {(['calendar','tags','categories'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setSheetTab(t)}
                      className={[
                        'py-2 rounded-xl border text-sm capitalize',
                        sheetTab === t ? 'bg-white/20 border-white/30' : 'bg-white/10 border-white/10 hover:bg-white/20'
                      ].join(' ')}
                    >
                      {t === 'calendar' ? '달력' : t === 'tags' ? '태그' : '카테고리'}
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
                          return [
                            has ? 'cal-has-post' : 'cal-no-post',
                            isSel ? 'cal-selected' : ''
                          ].join(' ')
                        }}
                        prev2Label={null}
                        next2Label={null}
                      />
                      <div className="mt-2 flex items-center gap-3 text-xs text-cream/80">
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block w-3 h-3 rounded cal-dot has" />
                          글 있음
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block w-3 h-3 rounded cal-dot none" />
                          없음
                        </span>
                      </div>
                    </div>
                  )}

                  {sheetTab === 'tags' && (
                    <div className="p-1 flex flex-wrap gap-2">
                      {tags.map(([t, count]) => (
                        <button
                          key={t}
                          onClick={() => setActiveTag(activeTag === t ? null : t)}
                          className={[
                            'text-[12px] px-3 py-1.5 rounded-full border',
                            activeTag === t ? 'bg-white/20 border-white/30' : 'bg-white/10 border-white/10 hover:bg-white/20'
                          ].join(' ')}
                        >
                          #{t} <span className="opacity-70">({count})</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {sheetTab === 'categories' && (
                    <div className="p-1 flex flex-wrap gap-2">
                      {categories.map(([cat, count]) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCat(activeCat === cat ? null : cat)}
                          className={[
                            'text-[12px] px-3 py-1.5 rounded-full border',
                            activeCat === cat ? 'bg-white/20 border-white/30' : 'bg-white/10 border-white/10 hover:bg-white/20'
                          ].join(' ')}
                        >
                          {cat} <span className="opacity-70">({count})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
