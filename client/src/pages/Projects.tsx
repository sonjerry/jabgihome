// client/src/pages/Projects.tsx
import { useMemo } from 'react'
import GlassCard from '../components/GlassCard'

type Project = {
  id: string
  title: string
  summary: string
  stack: string[]
  liveUrl?: string
  repoUrl?: string
  status?: 'active' | 'paused' | 'done'
  thumbnail?: string
}

/**
 * 유지보수 편한 구조
 * - 데이터는 아래 MOCK_PROJECTS만 교체하면 됨(나중에 API로 교체도 쉬움)
 * - 카드 컴포넌트는 단일 책임(썸네일/텍/버튼/배지)
 * - 반응형: 모바일 1열, md 2열, xl 3열
 */
const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: '프로젝트 1',
    summary:
      'Render.com에 배포 예정. 간단한 데모와 문서를 통해 바로 체험 가능하도록 구성합니다.',
    stack: ['React', 'Vite', 'Tailwind', 'Render'],
    liveUrl: 'https://example-project1.onrender.com', // 실제 배포 URL로 교체
    repoUrl: 'https://github.com/yourname/project1',   // 실제 레포로 교체
    status: 'active',
  },
  {
    id: 'p2',
    title: '프로젝트 2',
    summary:
      '블로그/갤러리 디자인 규칙을 공유하는 카드형 UI. 퍼포먼스와 접근성 고려.',
    stack: ['TypeScript', 'Express', 'Supabase'],
    liveUrl: 'https://example-project2.onrender.com',
    repoUrl: 'https://github.com/yourname/project2',
    status: 'paused',
  },
  {
    id: 'p3',
    title: '프로젝트 3',
    summary:
      '간단한 체험 페이지 포함. 데모 링크를 통해 바로 확인하고 피드백 반영.',
    stack: ['Three.js', 'GLTF', 'Render'],
    liveUrl: 'https://example-project3.onrender.com',
    repoUrl: 'https://github.com/yourname/project3',
    status: 'done',
  },
]

function StatusBadge({ status }: { status?: Project['status'] }) {
  if (!status) return null
  const map = {
    active:
      'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30',
    paused: 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
    done: 'bg-sky-500/20 text-sky-200 border border-sky-400/30',
  } as const
  const label = { active: '진행중', paused: '보류', done: '완료' }[status]
  return (
    <span
      className={
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ' +
        map[status]
      }
      aria-label={`상태: ${label}`}
      title={`상태: ${label}`}
    >
      {label}
    </span>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/10 border border-white/10 text-white/90">
      {children}
    </span>
  )
}

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
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${styles}`}
    >
      {children}
      <svg
        className="ml-1 w-3.5 h-3.5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path d="M11 3a1 1 0 100 2h2.586L7.293 11.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
      </svg>
    </a>
  )
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <GlassCard
      className="
        group relative overflow-hidden
        p-5 md:p-6
        rounded-3xl
        transition-transform
        hover:scale-[1.01]
      "
    >
      {/* 상단: 제목/상태 */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg md:text-xl font-bold tracking-tight">
          {p.title}
        </h3>
        <StatusBadge status={p.status} />
      </div>

      {/* 요약 */}
      <p className="mt-2 text-sm md:text-base text-white/80 leading-relaxed">
        {p.summary}
      </p>

      {/* 기술 스택 */}
      {p.stack?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {p.stack.map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>
      )}

      {/* 버튼들 */}
      <div className="mt-5 flex flex-wrap gap-2">
        <ButtonLink href={p.liveUrl} variant="primary">
          라이브 데모
        </ButtonLink>
        <ButtonLink href={p.repoUrl} variant="ghost">
          깃허브
        </ButtonLink>
      </div>

      {/* 배경 장식(가벼운 강조) */}
      <div
        className="
          pointer-events-none absolute -right-16 -top-16 size-40 md:size-56
          rounded-full blur-3xl opacity-20 group-hover:opacity-30
          bg-gradient-to-tr from-white/40 to-white/10
          transition-opacity
        "
        aria-hidden
      />
    </GlassCard>
  )
}

export default function Projects() {
  const projects = useMemo(() => MOCK_PROJECTS, [])

  return (
    <main
      className="
        relative min-h-screen
        px-3 md:px-8 lg:px-12
        py-6 md:py-10
        overflow-x-hidden
      "
    >
      {/* 헤더 */}
      <header className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-none">
          프로젝트
        </h1>
        <p className="mt-2 text-white/70 text-sm md:text-base">
          Render 데모 링크로 바로 체험해보고, 코드 저장소에서 변경 이력을 추적하세요.
        </p>
      </header>

      {/* 그리드(가벼움 유지: ScrollStack 같은 스크립트 없이) */}
      <section
        className="
          grid gap-4 md:gap-6
          grid-cols-1 md:grid-cols-2 xl:grid-cols-3
        "
      >
        {projects.map((p) => (
          <ProjectCard key={p.id} p={p} />
        ))}
      </section>
    </main>
  )
}
