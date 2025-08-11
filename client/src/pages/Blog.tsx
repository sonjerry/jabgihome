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
  // ![alt](url) 형태의 첫 이미지 추출
  const m = md.match(/!\[[^\]]*\]\(([^)]+)\)/)
  return m?.[1] || null
}

function pickCover(post: Post) {
  return firstImageFromAttachments(post.attachments) || firstImageFromMarkdown(post.content) || null
}

function BlogHeader() {
  const { role, loading } = useAuth()
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none">블로그</h1>
        <p className="mt-2 text-sm md:text-base text-cream/70">글과 사진을 담는 기록</p>
      </div>
      {!loading && role === 'admin' && (
        <Link
          to="/blog/new"
          className="glass px-3 py-2 rounded-xl hover:bg-white/20 text-sm"
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

  const ordered = useMemo(
    () => [...posts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [posts]
  )

  return (
    <PageShell>
      <BlogHeader />

      {ordered.length === 0 && (
        <p className="text-cream/70">아직 게시글이 없습니다.</p>
      )}

      <div className="space-y-4">
        {ordered.map((p) => {
          const cover = pickCover(p)
          const excerpt = p.content
            .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // 마크다운 이미지 제거
            .replace(/[#*`>\-]/g, '')
            .slice(0, 160)

        return (
          <GlassCard key={p.id} className="hover:bg-white/10 transition">
            <Link to={`/blog/${p.id}`} className="block p-4 md:p-5">
              <div className="grid gap-4 md:gap-5 sm:grid-cols-[140px,1fr] items-start">
                {/* 썸네일 */}
                {cover ? (
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-xl sm:order-1">
                    <img
                      src={cover}
                      alt={p.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="hidden sm:block sm:order-1" />
                )}

                {/* 텍스트 영역 */}
                <div className="sm:order-2">
                  <header className="mb-1.5">
                    <h2 className="text-xl md:text-2xl font-semibold leading-snug line-clamp-2">
                      {p.title}
                    </h2>
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
                        <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-white/10">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </GlassCard>
        )})}
      </div>
    </PageShell>
  )
}
