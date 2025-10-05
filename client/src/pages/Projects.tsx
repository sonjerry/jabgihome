// client/src/pages/Projects.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import GlassCard from '../components/GlassCard'

/** ====== 타입 ====== */
type Project = {
  id: string
  title: string
  summary: string
  linkUrl?: string
  repoUrl?: string
  status?: 'active' | 'paused' | 'done'
  thumbnail?: string
}

type PostBrief = {
  id: string
  title: string
  tags?: string[]            // ['p1','devlog'] 등
  createdAt?: string         // ISO 문자열 가정
  slug?: string              // 있으면 우선 사용
}

/** ====== 환경 & 유틸 ====== */
const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'https://leegaeulblog-server.onrender.com'

function byDateDesc(a?: string, b?: string) {
  const ta = a ? Date.parse(a) : 0
  const tb = b ? Date.parse(b) : 0
  return tb - ta
}

function postLink(p: PostBrief) {
  // slug 우선, 없으면 id로 상세 라우팅 가정
  if (p.slug) return `/blog/${encodeURIComponent(p.slug)}`
  return `/blog/${encodeURIComponent(p.id)}`
}

/** ====== 프로젝트 정의 ====== */
const PROJECTS: Project[] = [
  {
    id: 'p1',
    title: '와카와카',
    summary: 'WI-FI 라즈베리파이 기반 심레이싱 조종 자동차 (와이파이 카)',
    linkUrl: 'http://100.84.162.124:8000/',
    repoUrl: 'https://github.com/sonjerry/wakawaka2',
    status: 'active',
  },
  {
    id: 'p2',
    title: 'OpenAI 튜링 테스트',
    summary: '현재 LLM 수준으로 사람과 구별 불가능한 페르소나를 만들 수 있을까',
    linkUrl: 'https://example-project2.onrender.com',
    repoUrl: 'https://github.com/sonjerry/Turing-test',
    status: 'paused',
  },
  {
    id: 'p3',
    title: '이가을 블로그',
    summary: '프론트/백엔드 본 블로그',
    linkUrl: 'https://leegaeulblog.onrender.com',
    repoUrl: 'https://github.com/sonjerry/LeeGaeulBlog',
    status: 'done',
  },
]

/** ====== 뱃지 ====== */
function StatusBadge({ status }: { status?: Project['status'] }) {
  if (!status) return null
  const map = {
    active: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30',
    paused: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30',
    done: 'bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/30',
  } as const
  const label = { active: '진행중', paused: '보류', done: '완료' }[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {label}
    </span>
  )
}

/** ====== 외부 링크 버튼 ====== */
function ButtonLink({
  href,
  children,
  variant = 'primary',
}: {
  href?: string
  children: React.ReactNode
  variant?: 'primary' | 'ghost'
}) {
  if (!href) return null
  const base =
    'inline-flex items-center justify-center h-9 px-3 rounded-xl text-sm transition-transform active:scale-[0.98]'
  const styles =
    variant === 'primary'
      ? 'bg-white/90 text-black hover:bg-white'
      : 'bg-white/10 text-white hover:bg-white/15 border border-white/15'
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${styles}`}>
      {children}
      <svg className="ml-1 w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M11 3a1 1 0 100 2h2.586L7.293 11.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
      </svg>
    </a>
  )
}

/** ====== 프로젝트 카드 (세로 롱 + 타임라인) ====== */
function ProjectCard({
  project,
  posts,
}: {
  project: Project
  posts: PostBrief[]
}) {
  const top = posts
    .filter(p => (p.tags || []).map(t => (t || '').toLowerCase()).includes(project.id.toLowerCase()))
    .sort((a, b) => byDateDesc(a.createdAt, b.createdAt))
    .slice(0, 10) // 더 길게

  return (
    <GlassCard
      className="
        relative overflow-hidden
        p-6 md:p-8
        rounded-3xl
        min-h-[560px] md:min-h-[620px]
        grid grid-rows-[auto_1fr_auto]
      "
    >
      {/* 헤더: 제목/상태/요약/액션 */}
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-none">
              {project.title}
            </h3>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-2 text-sm md:text-base text-white/80">{project.summary}</p>
        </div>

        <div className="flex gap-2 shrink-0">
          
          <ButtonLink href={project.repoUrl} variant="ghost">깃허브</ButtonLink>
        </div>
      </header>

      

      {/* 하단 액션: 진행사항 보기 */}
      <footer className="mt-6">
        <Link
          to={`/blog?progress=${encodeURIComponent(project.id)}`}
          className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-sm bg-white/10 text-white hover:bg-white/15 border border-white/15 transition-transform active:scale-[0.98]"
          aria-label={`${project.title} 진행사항 보기`}
        >
          진행사항 보기
          <svg className="ml-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M7 4a1 1 0 000 2h5.586L6.293 12.293a1 1 0 001.414 1.414L14 7.414V13a1 1 0 102 0V5a1 1 0 00-1-1H7z" />
          </svg>
        </Link>
      </footer>

      {/* WAKAWAKA 미디어 섹션: 진행사항 버튼 아래 */}
      {project.id === 'p1' && (
        <div className="mt-5">
          <WakaWakaMedia />
        </div>
      )}

      {/* 은은한 배경 하이라이트 */}
      <div
        className="
          pointer-events-none absolute -right-24 -top-24 size-56 md:size-72
          rounded-full blur-3xl opacity-15
          bg-gradient-to-tr from-white/40 to-white/10
        "
        aria-hidden
      />
    </GlassCard>
  )
}

/** ====== WAKAWAKA 미디어 컴포넌트 ====== */
function WakaWakaMedia() {
  const carImg = '/media/wakawaka-car.jpg'
  const uiImg = '/media/wakawaka-ui.jpg'
  return (
    <div
      className="
        relative grid gap-3 md:gap-4
        grid-cols-1 md:grid-cols-[1.25fr_1fr]
      "
    >
      {/* 좌측: 실물 사진 (비율 유지 카드) */}
      <div
        className="
          relative overflow-hidden rounded-2xl
          border border-white/15 bg-white/5
          backdrop-blur-xl shadow-glass
          aspect-[4/3]
        "
      >
        <img
          src={carImg}
          alt="WAKAWAKA 실물"
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e: any) => { e.currentTarget.style.display = 'none' }}
        />
        {/* 상단 라벨 */}
        <div className="absolute left-3 top-3 px-2.5 py-1 rounded-lg text-[11px] bg-white/20 text-black/90 font-semibold">
          hardware
        </div>
        {/* 유리 하이라이트 */}
        <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-white/30 blur-3xl opacity-20" aria-hidden />
      </div>

      {/* 우측: UI 스크린샷 (세로 카드) */}
      <div
        className="
          relative overflow-hidden rounded-2xl
          border border-white/15 bg-white/5
          backdrop-blur-xl shadow-glass
          aspect-[5/4]
        "
      >
        <img
          src={uiImg}
          alt="WAKAWAKA UI"
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e: any) => { e.currentTarget.style.display = 'none' }}
        />
        <div className="absolute left-3 top-3 px-2.5 py-1 rounded-lg text-[11px] bg-white/20 text-black/90 font-semibold">
          software
        </div>
        <div className="pointer-events-none absolute -left-10 -bottom-10 size-36 rounded-full bg-white/30 blur-3xl opacity-20" aria-hidden />
      </div>
    </div>
  )
}

/** ====== 페이지 ====== */
export default function Projects() {
  const [posts, setPosts] = useState<PostBrief[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        // 1) 정적 프리로드 우선
        const r1 = await fetch('/posts-brief.json', { cache: 'no-store' })
        if (r1.ok) {
          const d = (await r1.json()) as PostBrief[]
          if (mounted) {
            setPosts(Array.isArray(d) ? d : [])
            setLoading(false)
          }
          // 2) 백그라운드 최신화(선택): API 한 번 더
          try {
            const r2 = await fetch(`${API_BASE}/api/posts-brief`, { cache: 'no-store' })
            if (r2.ok) {
              const d2 = (await r2.json()) as PostBrief[]
              if (mounted && Array.isArray(d2) && d2.length) setPosts(d2)
            }
          } catch {}
          return
        }

        // 3) 정적이 없으면 API 사용
        const r2 = await fetch(`${API_BASE}/api/posts-brief`, { cache: 'no-store' })
        if (!r2.ok) throw new Error(`API ${r2.status}`)
        const d2 = (await r2.json()) as PostBrief[]
        if (mounted) setPosts(Array.isArray(d2) ? d2 : [])
      } catch (e: any) {
        console.error('Failed to load posts:', e?.message || '불러오기 오류')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <main
      className="
        relative min-h-screen
        px-3 md:px-8 lg:px-12
        py-6 md:py-10
        overflow-x-hidden
      "
    >
      <GlassCard className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">
          프로젝트
        </h1>
        <p className="text-sm md:text-base text-white/70 mt-4">
          토이 프로젝트 모음
        </p>
      </GlassCard>

      {/* 세로 풀폭 나열 */}
      <section className="space-y-5 md:space-y-7">
        {PROJECTS.map((p) => (
          <ProjectCard key={p.id} project={p} posts={posts} />
        ))}

        {loading && (
          <GlassCard className="p-5 md:p-6">
            <p className="text-white/70 text-sm">업데이트를 불러오는 중…</p>
          </GlassCard>
        )}


      </section>
    </main>
  )
}
