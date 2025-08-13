// client/src/pages/Home.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import FullscreenVideoModal from '../components/FullscreenVideoModal'
import Stickers from '../components/StickerPeel'
import ModelViewer from '../components/ModelViewer'
import GlassCard from '../components/GlassCard'

/**
 * 목표
 * - 스크롤 완전 제거(모바일 포함): 모든 콘텐츠 1스크린에 수납
 * - 3D 모델 카드 비중 축소
 * - Now/Tech Stack/About/허브(열어보기) 카드 전부 삭제
 * - 글래스모피즘 톤 통일, 모바일 우선 배치
 */
export default function Home() {
  const [showVideo, setShowVideo] = useState(false)

  // 최초 1회 비디오 모달
  useEffect(() => {
    const seen = sessionStorage.getItem('videoShown')
    if (!seen) setShowVideo(true)
  }, [])
  const closeVideo = () => {
    sessionStorage.setItem('videoShown', '1')
    setShowVideo(false)
  }

  // 페이지 체류 동안만 바디 스크롤 잠금 (절대 스크롤 없음)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const today = useMemo(() => {
    const d = new Date()
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden">
      <FullscreenVideoModal open={showVideo} onClose={closeVideo} />

      {/* 상단 네비게이션 높이를 top-16 으로 가정. 내부는 절대 스크롤 금지 */}
      <section className="absolute inset-x-0 top-16 bottom-0 z-0 overflow-hidden">
        {/* 높이를 고정: calc(100vh - 64px). 모든 콘텐츠는 이 안에 수납 */}
        <div className="h-full px-3 md:px-6 lg:px-10">
          {/* 상단 헤더 + 알림 배지 */}
          <header className="h-[12%] min-h-[64px] max-h-[96px] flex flex-col justify-center gap-1 md:gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 backdrop-blur px-2.5 py-1 text-[10px] md:text-xs text-white/90">
                {today}
              </span>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 backdrop-blur px-2.5 py-1 text-[10px] md:text-xs text-emerald-200">
                Glass v3
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              이가을 블로그
            </h1>
            <p className="text-xs md:text-sm text-white/70">
              AI 친화적인 소프트웨어 전공생의 블로그
            </p>
          </header>

          {/* 본문: 좌우 2단(모바일 1단). 높이 엄격 배분으로 스크롤 차단 */}
          <div
            className="
              grid gap-3 md:gap-4
              grid-cols-1 lg:grid-cols-12
              h-[88%]  /* 헤더 제외 전체 */
            "
          >
            {/* 좌측: 소개 + CTA (메인 정보) */}
            <div
              className="
                order-2 lg:order-1
                lg:col-span-6
                flex flex-col
                h-full
              "
            >
              {/* 소개 카드: 고정 높이 */}
              <GlassCard
                className="
                  bg-white/10 backdrop-blur border border-white/15 text-white
                  px-5 py-4 md:px-6 md:py-6
                  flex-1
                  min-h-0
                "
              >
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <h2 className="text-lg md:text-2xl text-amber-300 font-semibold">홈페이지 소개</h2>
                    <p className="mt-2 text-[12px] md:text-sm leading-relaxed text-white/90">
                      인스타 싫어서 홈페이지 만듬
                    </p>
                  </div>

                  {/* 핵심 링크 3개: 화면 하나에 딱 맞게 */}
                  <nav className="mt-4 grid grid-cols-3 gap-2 md:gap-3">
                    <CTA to="/blog" title="블로그" />
                    <CTA to="/gallery" title="갤러리" />
                    <CTA to="/chat" title="챗봇" />
                  </nav>

                  {/* 태그 칩: 1줄로만, 넘치면 숨김 */}
                  <div className="mt-3 flex items-center gap-2 overflow-hidden">
                    {['TypeScript', 'React', 'Vite', 'Tailwind', 'Node', 'Supabase', 'Render', '3D'].map((s) => (
                      <span
                        key={s}
                        className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] md:text-xs text-white/80"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* 하단 작은 카드: 공지/상태 요약(1줄 제한) */}
              <div className="mt-3 md:mt-4 grid grid-cols-3 gap-2 md:gap-3">
                <MiniStat label="업데이트" value="주 3~5회" />
                <MiniStat label="실험" value="UI·LLM" />
                <MiniStat label="선호" value="미니멀" />
              </div>
            </div>

            {/* 우측: 3D 모델 (비중 축소, 고정 높이/폭) */}
            <div
              className="
                order-1 lg:order-2
                lg:col-span-6
                h-full
                flex items-center
              "
            >
              <GlassCard
                className="
                  relative w-full
                  bg-white/10 backdrop-blur border border-white/15
                  shadow-[0_0_30px_rgba(0,0,0,0.25)]
                  overflow-hidden
                  px-0 py-0
                  h-[28vh] md:h-[32vh] lg:h-[40vh]  /* 비중 축소 */
                  mx-auto
                "
              >
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
                  defaultZoom={1.22}
                  minZoomDistance={0.6}
                  maxZoomDistance={6}
                />

                {/* 우하단 캡션(작게) */}
                <div className="absolute right-2 bottom-2">
                  <div className="rounded-full border border-white/15 bg-black/30 backdrop-blur px-2.5 py-0.5 text-[10px] md:text-[11px] text-white/90">
                    AI로 만든 모델
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* 스티커는 장식용: 화면 밖으로 넘치지 않게, 포인터 막기, md 이상에서만 */}
          {!showVideo && (
            <div className="pointer-events-none hidden md:block">
              <div className="absolute right-1 bottom-1 w-[180px] opacity-80">
                <Stickers />
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

/* ───────────────────── 보조 컴포넌트 ───────────────────── */

function CTA({ to, title }: { to: string; title: string }) {
  return (
    <Link
      to={to}
      className="
        block text-center rounded-2xl
        border border-white/20 bg-white/10 hover:bg-white/20 transition
        backdrop-blur px-3 py-2
        text-sm md:text-base
      "
    >
      {title}
    </Link>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur px-3 py-2">
      <div className="text-[10px] md:text-xs text-white/70">{label}</div>
      <div className="text-sm md:text-base font-semibold">{value}</div>
    </div>
  )
}
