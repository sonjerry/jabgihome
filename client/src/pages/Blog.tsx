// client/src/pages/Blog.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import type { Post, Attachment } from '../types'
import { listPosts } from '../lib/api'
import { useAuth } from '../state/auth'
import PageShell from '../components/PageShell'

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
    <GlassCard className="mb-45 md:mb-6">
      {/* 패딩 축소 */}
      <div className="flex items-center justify-between px-1 md:px-1 py-1 md:py-1">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">블로그</h1>
          <p className="text-sm md:text-base text-white/70 mt-4">일기같은거</p>
        </div>
        {!loading && role === 'admin' && (
          <Link to="/blog/new" className="glass px-3 py-2 rounded-xl hover:bg-white/20 text-sm">
            New Post
          </Link>
        )}
      </div>
    </GlassCard>
  )
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([])
  useEffect(() => { listPosts().then(setPosts).catch(console.error) }, [])
  const ordered = useMemo(() => [...posts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [posts])

  return (
    <PageShell className="pt-16 md:pt-8">
      <BlogHeader />

      {ordered.length === 0 && <p className="text-cream/70">아직 게시글이 없습니다.</p>}

      <div className="space-y-4">
        {ordered.map((p) => {
          const cover = pickCover(p)
          const excerpt = p.content.replace(/!\[[^\]]*\]\([^)]+\)/g, '').replace(/[#*`>\-]/g, '').slice(0, 160)

          return (
            <GlassCard key={p.id} className="hover:bg-white/10 transition">
              {/* 헤더 카드와 같은 좌우 패딩으로 라인 맞춤 */}
              <Link to={`/blog/${p.id}`} className="block px-3 md:px-4 py-3 md:py-4">
                <div className="grid gap-4 md:gap-5 sm:grid-cols-[140px,1fr] items-start">
                  {cover ? (
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl sm:order-1">
                      <img src={cover} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ) : (
                    <div className="hidden sm:block sm:order-1" />
                  )}

                  <div className="sm:order-2">
                    <header className="mb-1.5">
                      <h2 className="text-xl md:text-2xl font-semibold leading-snug line-clamp-2">{p.title}</h2>
                      <p className="text-xs md:text-sm text-cream/70 mt-1">
                        {formatDate(p.createdAt)} {p.category ? `• ${p.category}` : ''}
                      </p>
                    </header>

                    <p className="text-sm md:text-base text-cream/85 leading-relaxed line-clamp-3">
                      {excerpt}
                      {p.content.length > 160 ? '…' : ''}
                    </p>

                    {p.tags?.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-3">
                        {p.tags.map((t, i) => (
                          <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-white/10">#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </GlassCard>
          )
        })}
      </div>
    </PageShell>
  )
}
