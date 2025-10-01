// client/src/pages/Home.tsx
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Stickers from '../components/StickerPeel'
import GlassCard from '../components/GlassCard'

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const heroRef = useRef<HTMLDivElement | null>(null)
  const [parallaxY, setParallaxY] = useState(0)

  // 뷰포트 진입 시 재생, 이탈 시 일시정지
  useEffect(() => {
    const el = heroRef.current
    const vid = videoRef.current
    if (!el || !vid) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            vid.play().catch(() => {})
          } else {
            vid.pause()
          }
        }
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // 부드러운 패럴랙스
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        // 스크롤 대비 약한 비율로 이동
        setParallaxY(Math.min(60, y * 0.15))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <main className="relative min-h-screen overflow-x-hidden text-white">
      {/* 히어로 섹션: 배경 비디오 */}
      <section
        ref={heroRef}
        className="relative w-full h-[82vh] md:h-[88vh] overflow-hidden"
      >
        {/* 배경 비디오 */}
        <video
          ref={videoRef}
          src="/media/dj.mp4"
          muted
          playsInline
          autoPlay
          // @ts-ignore
          webkit-playsinline="true"
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: `translateY(${parallaxY * -1}px)` }}
        />

        {/* 컬러 오버레이 + 그라데이션 마스크로 콘텐츠와 자연스러운 블렌딩 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70" />
          <div className="absolute inset-0 mix-blend-screen bg-amber-300/5" />
        </div>

        {/* 히어로 콘텐츠 */}
        <div className="relative z-10 h-full px-4 md:px-8 flex items-end">
          <div className="w-full max-w-6xl pb-8">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
              잡다한 기록 홈페이지
            </h1>
            <p className="mt-4 md:mt-6 text-md md:text-lg text-amber-300">
              인스타는 너무 평범해서 홈페이지 직접 만듦
            </p>
          </div>
        </div>
      </section>

      {/* 본문: 클릭 보장용 pointer-events-auto */}
      <section className="relative z-10 w-full p-4 md:p-8 flex flex-col justify-center items-center pointer-events-auto">
        <div className="w-full max-w-6xl pointer-events-auto">
          {/* 상단 헤더 제거 → 히어로로 이동 */}

          {/* 메인 컨텐츠 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
            {/* 좌측 카드: 소개 및 내비게이션 */}
            <GlassCard className="p-6 md:p-8 flex flex-col justify-between order-2 lg:order-1 pointer-events-auto">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-amber-300">
                  컨텐츠
                </h2>
                <p className="mt-4 text-sm md:text-base text-white/90 leading-relaxed">
                   
                </p>
              </div>
              <nav className="mt-6 grid grid-cols-3 gap-3 pointer-events-auto">
                <CTA to="/blog" title="블로그" />
                <CTA to="/gallery" title="갤러리" />
                <CTA to="/projects" title="프로젝트" />
              </nav>
            </GlassCard>

            {/* 우측 카드: 연락처 정보 */}
            <GlassCard className="p-6 md:p-8 flex flex-col justify-end order-1 lg:order-2 pointer-events-auto">
              <div className="mt-auto">
                <h2 className="text-lg md:text-xl font-semibold text-white/80 mb-3">
                  Contact Me
                </h2>
                <div className="flex flex-col gap-2">
                  <MiniStat
                    label="GitHub"
                    value="sonjerry"
                    link="https://github.com/sonjerry"
                  />
                  <MiniStat
                    label="Email"
                    value="qh.e.720@icloud.com"
                    link="mailto:qh.e.720@icloud.com"
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 스티커: 화면 전체 오버레이 */}
      <div className="fixed inset-0 z-[2000] pointer-events-none scale-75 sm:scale-100 origin-top-left">
        <Stickers />
      </div>
    </main>
  )
}

/* ───────────────────── 보조 컴포넌트 ───────────────────── */

// CTA
function CTA({ to, title }: { to: string; title: string }) {
  return (
    <Link
      to={to}
      className="
        block text-center rounded-2xl
        border border-white/20 bg-white/10 hover:bg-white/20 transition
        backdrop-blur px-3 py-2
        text-sm md:text-base
        pointer-events-auto
      "
    >
      {title}
    </Link>
  )
}

// MiniStat
function MiniStat({
  label,
  value,
  link,
}: {
  label: string
  value: string
  link: string
}) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border border-white/15 bg-white/10 hover:bg-white/20 backdrop-blur px-3 py-2 transition pointer-events-auto"
    >
      <div className="text-[10px] md:text-xs text-white/70">{label}</div>
      <div className="text-sm md:text-base font-semibold">{value}</div>
    </a>
  )
}
