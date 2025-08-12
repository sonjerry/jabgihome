// client/src/pages/Blog.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

  useEffect(() => { listPosts().then(setPosts).catch(console.error) }, [])

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

  return (
    <PageShell className="pt-16 md:pt-8 max-w-[1400px] mx-auto px-3">
      <BlogHeader />

      {/* 카테고리 버튼 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(([cat, count]) => (
          <button
            key={cat}
            onClick={() => setActiveCat(activeCat === cat ? null : cat)}
            className={[
              'px-3 py-1 rounded-full border text-sm',
              activeCat === cat ? 'bg-white/20 border-white/30' : 'bg-white/10 border-white/10 hover:bg-white/20'
            ].join(' ')}
          >
            {cat} <span className="opacity-70">({count})</span>
          </button>
        ))}
        {(activeCat || activeTag || activeDate) && (
          <button onClick={clearAll} className="ml-1 text-sm underline opacity-90 hover:opacity-100">필터 초기화</button>
        )}
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

        {/* 사이드바 */}
        <div className="space-y-4 lg:sticky lg:top-20">
          {/* 달력 */}
          <GlassCard>
            <div className="p-3">
              <Calendar
                selectRange={false}
                value={null} // 기본 선택 제거
                onClickDay={(value) => {
                  const s = value.toISOString().split('T')[0]
                  setActiveDate(activeDate === s ? null : s)
                }}
                tileClassName={({ date, view }) => {
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
    </PageShell>
  )
}
