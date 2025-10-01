// client/src/pages/Home.tsx
import { useEffect, useRef, useState } from 'react'
import djVideo from '../assets/media/dj.mp4'
import { Link } from 'react-router-dom'
import Stickers from '../components/StickerPeel'
import GlassCard from '../components/GlassCard'

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const heroRef = useRef<HTMLDivElement | null>(null)
  const [parallaxY, setParallaxY] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isVideoReady, setIsVideoReady] = useState(false)

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

  // 비디오 로딩 진행률 추적 (buffered 기반)
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    const updateProgress = () => {
      try {
        if (!vid.duration || vid.duration === Infinity) return
        const ranges = vid.buffered
        if (!ranges || ranges.length === 0) return
        const end = ranges.end(ranges.length - 1)
        const pct = Math.max(0, Math.min(100, Math.round((end / vid.duration) * 100)))
        setLoadProgress(pct)
        if (pct >= 100) setIsVideoReady(true)
      } catch {}
    }

    const onLoadedMeta = () => { updateProgress() }
    const onProgress = () => { updateProgress() }
    const onCanPlayThrough = () => { setIsVideoReady(true); setLoadProgress(100) }
    const onWaiting = () => { setIsVideoReady(false) }
    const onPlaying = () => { if (loadProgress >= 100) setIsVideoReady(true) }

    vid.addEventListener('loadedmetadata', onLoadedMeta)
    vid.addEventListener('progress', onProgress)
    vid.addEventListener('canplaythrough', onCanPlayThrough)
    vid.addEventListener('waiting', onWaiting)
    vid.addEventListener('playing', onPlaying)

    // 초기 한번 계산
    updateProgress()

    return () => {
      vid.removeEventListener('loadedmetadata', onLoadedMeta)
      vid.removeEventListener('progress', onProgress)
      vid.removeEventListener('canplaythrough', onCanPlayThrough)
      vid.removeEventListener('waiting', onWaiting)
      vid.removeEventListener('playing', onPlaying)
    }
  }, [loadProgress])

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
        {/* 스타일: 슬로우 줌 키프레임 */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes heroSlowZoom { 0% { transform: scale(1) } 100% { transform: scale(1.03) } }
          `,
          }}
        />
        {/* 배경 비디오 */}
        <video
          ref={videoRef}
          src={djVideo}
          muted={isMuted}
          playsInline
          autoPlay
          loop
          // @ts-ignore
          webkit-playsinline="true"
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover will-change-transform"
          style={{ transform: `translateY(${parallaxY * -1}px)`, animation: 'heroSlowZoom 24s linear infinite alternate' }}
        />

        {/* 로딩 바 (비디오 위 하단, 준비 완료 시 페이드 아웃) */}
        <div
          aria-hidden
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(92%,720px)] transition-opacity duration-300 ${isVideoReady ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="px-3 py-2 rounded-2xl bg-black/35 border border-white/20 backdrop-blur-md shadow-glass">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 h-2 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-amber-300/90 shadow-[0_0_16px_rgba(251,191,36,0.65)]"
                  style={{ width: `${loadProgress}%`, transition: 'width 220ms ease' }}
                />
              </div>
              <span className="text-[11px] md:text-xs text-white/85 tabular-nums min-w-[38px] text-right">{loadProgress}%</span>
            </div>
          </div>
        </div>

        {/* 비네트 + 컬러 그레이딩 + 그라데이션 마스크 */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 상/하단 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-black/80" />
          {/* 소프트 라이트 앰버 오버레이 */}
          <div className="absolute inset-0 mix-blend-soft-light bg-amber-300/10" />
          {/* 비네트 */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%)',
              mixBlendMode: 'multiply',
            }}
          />
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
            {/* 사운드 토글 버튼 */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  const next = !isMuted
                  setIsMuted(next)
                  const v = videoRef.current
                  if (v) {
                    v.muted = next
                    if (next) {
                      // Mute: keep playing silently
                      return
                    }
                    // Unmute: make sure audio starts reliably on user gesture
                    try { v.removeAttribute('muted') } catch {}
                    v.muted = false
                    v.volume = 1
                    // Some browsers need a pause->play to reattach audio pipeline
                    try { v.pause() } catch {}
                    setTimeout(() => { v.play().catch(() => {}) }, 0)
                  }
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 transition backdrop-blur px-3 py-2 text-sm md:text-base pointer-events-auto"
              >
                {isMuted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M4 9h4l5-4v14l-5-4H4V9z" fill="currentColor"/>
                    <path d="M16 8l4 8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M20 8l-4 8" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M4 9h4l5-4v14l-5-4H4V9z" fill="currentColor"/>
                    <path d="M18.5 8.5a6 6 0 010 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16.5 10.5a3 3 0 010 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
                <span className="opacity-90">{isMuted ? '음소거 해제' : '음소거'}</span>
              </button>
            </div>
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
