// client/src/pages/Blog.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import type { Post } from '../types'
import { listPosts } from '../lib/api'
import { useAuth } from '../state/auth'

function formatDate(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function BlogHeader() {
  const { role, loading } = useAuth()
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold tracking-tight">블로그</h1>
      {!loading && role === 'admin' && (
        <Link
          to="/blog/new"
          className="glass px-3 py-1.5 rounded-xl hover:bg-white/20"
        >
          New Post
        </Link>
      )}
    </div>
  )
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    listPosts().then(setPosts).catch(console.error)
  }, [])

  // 최신순
  const ordered = useMemo(
    () => [...posts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [posts]
  )

  return (
    <div className="pt-24 mx-auto max-w-[900px] px-4 md:px-6">
      <BlogHeader />

      {ordered.length === 0 && (
        <p className="text-cream/70">아직 게시글이 없습니다.</p>
      )}

      {/* 타임라인 */}
      <div className="relative before:absolute before:left-[10px] md:before:left-[12px] before:top-0 before:bottom-0 before:w-px before:bg-white/10">
        {ordered.map((p) => (
          <article key={p.id} className="relative pl-8 md:pl-10 mb-8">
            {/* 타임라인 점 */}
            <span className="absolute left-0 md:left-0 top-2 block h-2.5 w-2.5 rounded-full bg-white/40 ring-4 ring-white/10" />

            <GlassCard className="hover:bg-white/10 transition">
              <Link to={`/blog/${p.id}`} className="block p-4 md:p-5">
                <header className="mb-2">
                  <h2 className="text-xl md:text-2xl font-semibold leading-snug">
                    {p.title}
                  </h2>
                  <p className="text-xs md:text-sm text-cream/70 mt-1">
                    {formatDate(p.createdAt)} {p.category ? `• ${p.category}` : ''}
                  </p>
                </header>

                <p className="text-sm md:text-base text-cream/85 leading-relaxed line-clamp-3">
                  {p.content.replace(/[#*`>\-]/g, '').slice(0, 260)}
                  {p.content.length > 260 ? '…' : ''}
                </p>

                {p.tags?.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {p.tags.map((t, i) => (
                      <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-white/10">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </GlassCard>
          </article>
        ))}
      </div>
    </div>
  )
}
