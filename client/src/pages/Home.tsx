// client/src/pages/Home.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import FullscreenVideoModal from '../components/FullscreenVideoModal'
import Stickers from '../components/StickerPeel'
import ModelViewer from '../components/ModelViewer'
import GlassCard from '../components/GlassCard'

/**
 * 목표
 * - 스크롤 완전 제거(모바일 포함)
 * - 시각적 계층 구조 명확화
 * - 중앙 집중형 레이아웃으로 시선 집중
 * - 글래스모피즘 톤 통일
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
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* 배경 그라데이션과 블러 효과를 위한 레이어 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#0A121E] backdrop-blur-3xl"></div>

      {/* 비디오 모달은 배경 위에 띄움 */}
      <FullscreenVideoModal open={showVideo} onClose={closeVideo} />

      {/* 모든 콘텐츠를 수직 중앙으로 정렬 */}
      <section className="relative z-10 w-full h-screen p-4 md:p-8 flex flex-col items-center justify-center">

        {/* 상단 헤더: 중앙 정렬 */}
        <header className="text-center mb-6 md:mb-8">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Badge text={today} color="white" />
            <Badge text="Glass v4" color="emerald" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
            이가을 블로그
          </h1>
          <p className="mt-2 text-md md:text-lg text-white/70">
            AI 친화적인 소프트웨어 전공생의 블로그
          </p>
        </header>

        {/* 메인 컨텐츠 영역: 모바일 1단, 데스크톱 2단 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-6xl h-auto">
          {/* 좌측: 소개 및 핵심 링크 */}
          <GlassCard className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-amber-300">
                홈페이지 소개
              </h2>
              <p className="mt-4 text-sm md:text-base text-white/90 leading-relaxed">
                인스타 싫어서 홈페이지 만듬
              </p>
            </div>
            <nav className="mt-6 grid grid-cols-3 gap-3">
              <CTA to="/blog" title="블로그" />
              <CTA to="/gallery" title="갤러리" />
              <CTA to="/chat" title="챗봇" />
            </nav>
            <div className="mt-4 flex flex-wrap gap-2 overflow-hidden">
              {['TypeScript', 'React', 'Vite', 'Tailwind', 'Node', 'Supabase', 'Render', '3D'].map((s) => (
                <TagChip key={s} text={s} />
              ))}
            </div>
          </GlassCard>

          {/* 우측: 3D 모델 뷰어 */}
          <GlassCard className="relative p-0 overflow-hidden h-[30vh] md:h-[40vh] lg:h-[50vh] flex items-center justify-center">
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
            {/* 3D 모델 캡션 */}
            <div className="absolute right-4 bottom-4">
              <Badge text="AI로 만든 모델" color="black" />
            </div>
          </GlassCard>
        </div>

        {/* 하단 미니 통계 카드 (Footer 역할) */}
        <div className="mt-6 md:mt-8 grid grid-cols-3 gap-3 w-full max-w-6xl">
          <MiniStat label="업데이트" value="주 3~5회" />
          <MiniStat label="실험" value="UI·LLM" />
          <MiniStat label="선호" value="미니멀" />
        </div>
      </section>

      {/* 스티커 컴포넌트: 데스크톱 환경에서만 표시 */}
      {!showVideo && (
        <div className="pointer-events-none hidden md:block">
          <div className="absolute right-1 bottom-1 w-[180px] opacity-80">
            <Stickers />
          </div>
        </div>
      )}
    </main>
  )
}

/* ───────────────────── 보조 컴포넌트 ───────────────────── */

// CTA 컴포넌트
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

// MiniStat 컴포넌트
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur px-3 py-2">
      <div className="text-[10px] md:text-xs text-white/70">{label}</div>
      <div className="text-sm md:text-base font-semibold">{value}</div>
    </div>
  )
}

// Badge 컴포넌트 (재사용성 높임)
function Badge({ text, color }: { text: string; color: "white" | "emerald" | "black" }) {
  const colorClass = {
    white: "border-white/15 bg-white/10 text-white/90",
    emerald: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
    black: "border-white/15 bg-black/30 text-white/90",
  }[color];

  return (
    <span className={`rounded-full border backdrop-blur px-2.5 py-1 text-[10px] md:text-xs ${colorClass}`}>
      {text}
    </span>
  );
}

// TagChip 컴포넌트 (재사용성 높임)
function TagChip({ text }: { text: string }) {
  return (
    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] md:text-xs text-white/80">
      {text}
    </span>
  );
}