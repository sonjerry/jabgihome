// client/src/pages/Home.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import FullscreenVideoModal from '../components/FullscreenVideoModal'
import Stickers from '../components/StickerPeel'
import ModelViewer from '../components/ModelViewer'
import GlassCard from '../components/GlassCard'

export default function Home() {
  const [showVideo, setShowVideo] = useState(false)

  /* 최초 1회 비디오 모달 */
  useEffect(() => {
    const seen = sessionStorage.getItem('videoShown')
    if (!seen) setShowVideo(true)
  }, [])
  const closeVideo = () => {
    sessionStorage.setItem('videoShown', '1')
    setShowVideo(false)
  }

  /* 홈 체류 중에만 바디 스크롤 잠금 -> 내부 섹션 스크롤 사용 */
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  /* 오늘 날짜 배지용 */
  const today = useMemo(() => {
    const d = new Date()
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }, [])

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <FullscreenVideoModal open={showVideo} onClose={closeVideo} />

      {/* 전체 레이아웃: 상단 네브 높이만큼 여백, 내부 스크롤 */}
      <section className="absolute inset-x-0 bottom-0 top-16 z-0">
        <div className="h-full overflow-y-auto px-3 md:px-6 lg:px-12 pb-24">
          {/* 헤더 영역 */}
          <header className="flex flex-col gap-2 md:gap-3 pt-1 md:pt-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 backdrop-blur px-2.5 py-1 text-[10px] md:text-xs text-white/90">
                {today}
              </span>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 backdrop-blur px-2.5 py-1 text-[10px] md:text-xs text-emerald-200">
                v3 · Glass UI
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none">
              이가을 블로그
            </h1>
            <p className="text-sm md:text-base text-white/70">
              AI 친화적인 소프트웨어 전공생의 작업실 · 글, 프로젝트, 갤러리, 그리고 실험들
            </p>
          </header>

          {/* 1행: 히어로(소개+CTA) | 모델 전시 */}
          <div className="mt-4 md:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
            {/* 히어로(왼쪽) */}
            <div className="lg:col-span-5 order-2 lg:order-1 space-y-3 md:space-y-4">
              {/* 소개 카드: 밀도 높게 */}
              <GlassCard className="bg-white/10 backdrop-blur border border-white/15 text-white px-5 py-4 md:px-6 md:py-5">
                <h2 className="text-lg md:text-xl text-amber-300 font-semibold">홈페이지 소개</h2>
                <p className="mt-2 text-[12px] md:text-sm leading-relaxed text-white/90">
                  빠르게 실험하고, 바로 배포하고, 곧바로 기록합니다. 글래스모피즘과 인터랙션을
                  적극 활용해 “보여주는 블로그”를 지향해요.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] md:text-xs text-white/80">React</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] md:text-xs text-white/80">Vite</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] md:text-xs text-white/80">Render</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] md:text-xs text-white/80">Supabase</span>
                </div>

                {/* CTA 버튼 */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    to="/blog"
                    className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 transition backdrop-blur px-3 py-2 text-center text-sm"
                  >
                    블로그
                  </Link>
                  <Link
                    to="/gallery"
                    className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 transition backdrop-blur px-3 py-2 text-center text-sm"
                  >
                    갤러리
                  </Link>
                  <Link
                    to="/chat"
                    className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 transition backdrop-blur px-3 py-2 text-center text-sm col-span-2"
                  >
                    챗봇 실험실
                  </Link>
                </div>
              </GlassCard>

              {/* 상태/통계 카드 */}
              <GlassCard className="bg-white/10 backdrop-blur border border-white/15 text-white px-5 py-4 md:px-6 md:py-5">
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <StatChip label="업데이트" value="주 3~5회" />
                  <StatChip label="실험" value="UI·LLM" />
                  <StatChip label="선호" value="미니멀" />
                </div>
                <p className="mt-3 text-[12px] md:text-xs text-white/70">
                  * 실제 포스트 수/태그 등은 블로그 탭에서 확인하실 수 있어요.
                </p>
              </GlassCard>

              {/* 링크 카드(빠른 이동) */}
              <GlassCard className="bg-white/10 backdrop-blur border border-white/15 text-white px-5 py-4 md:px-6 md:py-5">
                <h3 className="text-base md:text-lg font-semibold">빠른 이동</h3>
                <nav className="mt-3 grid grid-cols-2 gap-2 md:gap-3">
                  <QuickLink to="/blog" title="최근 글" desc="업데이트 로그/메모" />
                  <QuickLink to="/blog" title="개발 노트" desc="문제해결 기록" />
                  <QuickLink to="/gallery" title="그림·3D" desc="WIP 포함" />
                  <QuickLink to="/blog" title="프로젝트" desc="작업 회고" />
                </nav>
              </GlassCard>
            </div>

            {/* 모델 전시(오른쪽) */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <GlassCard
                className="
                  relative rounded-3xl border border-white/15 bg-white/5 backdrop-blur
                  shadow-[0_0_40px_rgba(0,0,0,0.25)] overflow-hidden
                  px-0 py-0
                "
              >
                {/* ModelViewer는 컨테이너 꽉 채우기 */}
                <div className="h-[52vh] md:h-[56vh] lg:h-[60vh]">
                  <ModelViewer
                    url="/models/aira.glb"
                    width="100%"
                    height="100%"
                    environmentPreset="studio"
                    autoFrame
                    autoRotate
                    autoRotateSpeed={0.25}
                    enableManualRotation
                    enableManualZoom
                    enableHoverRotation
                    placeholderSrc="/icons/model-placeholder.png"
                    showScreenshotButton={false}
                    ambientIntensity={0.4}
                    keyLightIntensity={1}
                    fillLightIntensity={0.6}
                    rimLightIntensity={0.8}
                    defaultZoom={1.18}
                    minZoomDistance={0.6}
                    maxZoomDistance={6}
                  />
                </div>

                {/* 우하단 캡션 */}
                <div className="absolute right-3 bottom-3">
                  <div className="rounded-full border border-white/15 bg-black/30 backdrop-blur px-3 py-1 text-[12px] text-white/90">
                    AI로 만든 모델
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* 2행: 콘텐츠 허브 (블로그/프로젝트/갤러리/채팅) */}
          <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <HubCard to="/blog" title="블로그" kicker="notes" desc="짧고 자주, 기록 중심" />
            <HubCard to="/blog" title="프로젝트" kicker="build" desc="실험·회고·배포" />
            <HubCard to="/gallery" title="갤러리" kicker="visual" desc="그림/3D/WIP" />
            <HubCard to="/chat" title="챗봇" kicker="ai" desc="대화형 인터랙션" />
          </div>

          {/* 3행: NOW(최근 근황) + Tech Stack + 연락/오픈소스 */}
          <div className="mt-4 md:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
            {/* NOW */}
            <div className="lg:col-span-6 space-y-3">
              <GlassCard className="bg-white/10 backdrop-blur border border-white/15 text-white px-5 py-4 md:px-6 md:py-5">
                <h3 className="text-base md:text-lg font-semibold">Now</h3>
                <ul className="mt-2 space-y-2 text-[12px] md:text-sm text-white/85">
                  <li>· 글 목록 로딩 속도 개선(정적 요약 → 백그라운드 최신화)</li>
                  <li>· UI 실험: GlassCard 밀도/그리드 최적화, 모바일 터치 목표치 확대</li>
                  <li>· 3D 전시 고정 프레임/줌 범위 재조정</li>
                </ul>
              </GlassCard>

              {/* 연락 */}
              <GlassCard className="bg-white/10 backdrop-blur border border-white/15 text-white px-5 py-4 md:px-6 md:py-5">
                <h3 className="text-base md:text-lg font-semibold">Contact</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-[12px] md:text-sm">
                  <Chip as="a" href="mailto:gaeeul@example.com">이메일</Chip>
                  <Chip as={Link} to="/blog">블로그 DM</Chip>
                  <Chip as={Link} to="/chat">챗봇으로 말걸기</Chip>
                </div>
              </GlassCard>
            </div>

            {/* Tech Stack */}
            <div className="lg:col-span-6 space-y-3">
              <GlassCard className="bg-white/10 backdrop-blur border border-white/15 text-white px-5 py-4 md:px-6 md:py-5">
                <h3 className="text-base md:text-lg font-semibold">Tech Stack</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['TypeScript', 'React', 'Vite', 'Tailwind', 'Node/Express', 'Supabase', 'Render', 'Three/3D'].map(s => (
                    <span
                      key={s}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] md:text-xs text-white/85"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[12px] md:text-xs text-white/70">
                  배포: Render · 데이터: Supabase · 정적 파이프라인: Vite
                </p>
              </GlassCard>

              {/* 가벼운 About */}
              <GlassCard className="bg-white/10 backdrop-blur border border-white/15 text-white px-5 py-4 md:px-6 md:py-5">
                <h3 className="text-base md:text-lg font-semibold">About</h3>
                <p className="mt-2 text-[12px] md:text-sm text-white/90 leading-relaxed">
                  문제를 분해하고, 속도를 올리고, 결과를 남기는 편입니다. UI/LLM/3D를
                  좋아하고, “작게 시작해 바로 보여주기”를 중시합니다.
                </p>
              </GlassCard>
            </div>
          </div>

          {/* 스티커: 모달 닫힌 뒤에만 렌더 */}
          {!showVideo && (
            <div className="mt-6">
              <Stickers />
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

/* ───────────────────── 보조 컴포넌트 ───────────────────── */

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur px-3 py-2">
      <div className="text-[10px] md:text-xs text-white/70">{label}</div>
      <div className="text-sm md:text-base font-semibold">{value}</div>
    </div>
  )
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="
        group rounded-2xl border border-white/15 bg-white/10 backdrop-blur px-3 py-2
        hover:bg-white/20 transition text-left
      "
    >
      <div className="text-sm md:text-base font-semibold">{title}</div>
      <div className="text-[11px] md:text-xs text-white/70">{desc}</div>
      <div className="mt-1 text-[11px] md:text-xs opacity-0 group-hover:opacity-100 transition">
        바로가기 →
      </div>
    </Link>
  )
}

function HubCard({ to, title, kicker, desc }: { to: string; title: string; kicker: string; desc: string }) {
  return (
    <Link
      to={to}
      className="
        block rounded-3xl border border-white/15 bg-white/10 backdrop-blur
        hover:bg-white/20 transition
        p-4 md:p-5
      "
    >
      <div className="text-[11px] md:text-xs uppercase tracking-wide text-white/70">{kicker}</div>
      <div className="mt-1 text-lg md:text-xl font-bold">{title}</div>
      <div className="mt-1 text-[12px] md:text-sm text-white/80">{desc}</div>
      <div className="mt-3 text-[12px] md:text-sm opacity-80">열어보기 →</div>
    </Link>
  )
}

type ChipProps =
  | ({ as?: 'a' } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ as?: typeof Link } & React.ComponentProps<typeof Link>)
  | ({ as?: 'button' } & React.ButtonHTMLAttributes<HTMLButtonElement>)

function Chip(props: ChipProps & { children: React.ReactNode }) {
  const { as, children, ...rest } = props as any
  const Comp: any = as || 'span'
  return (
    <Comp
      {...rest}
      className={[
        'rounded-full border border-white/15 bg-white/10 backdrop-blur',
        'px-3 py-1 text-[12px] md:text-sm text-white/85 hover:bg-white/20 transition'
      ].join(' ')}
    >
      {children}
    </Comp>
  )
}
