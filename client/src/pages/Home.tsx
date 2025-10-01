// client/src/pages/Home.tsx
import { useEffect, useRef, useState } from 'react'
import djVideo from '../assets/media/dj.mp4'
import { Link } from 'react-router-dom'
import GlassCard from '../components/GlassCard'

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const heroRef = useRef<HTMLDivElement | null>(null)
  const [parallaxY, setParallaxY] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [revealProgress, setRevealProgress] = useState(0) // 0~1: 네비/카드 등장, 비디오 리레이아웃
  const revealTargetRef = useRef(0)
  const rafRevealRef = useRef(0)

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
        setParallaxY(Math.min(40, y * 0.08))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // 스크롤/영상 종료에 따른 등장 애니메이션 트리거 + 부드러운 보간
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      revealTargetRef.current = y > 40 ? 1 : 0
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const animate = () => {
      const current = revealProgress
      const target = revealTargetRef.current
      const next = current + (target - current) * 0.12
      if (Math.abs(next - current) > 0.002) {
        setRevealProgress(next)
        try {
          document.documentElement.style.setProperty('--home-reveal', String(next))
          window.dispatchEvent(new CustomEvent('home:reveal', { detail: next }))
        } catch {}
      }
      rafRevealRef.current = requestAnimationFrame(animate)
    }
    rafRevealRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRevealRef.current)
  }, [revealProgress])

  // 비디오 진행이 끝나가면 자동으로 등장
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    const onTime = () => {
      try {
        if (!vid.duration || vid.duration === Infinity) return
        const ratio = vid.currentTime / vid.duration
        if (ratio >= 0.9) revealTargetRef.current = 1
      } catch {}
    }
    const onEnded = () => { revealTargetRef.current = 1 }
    vid.addEventListener('timeupdate', onTime)
    vid.addEventListener('ended', onEnded)
    return () => {
      vid.removeEventListener('timeupdate', onTime)
      vid.removeEventListener('ended', onEnded)
    }
  }, [])

  return (
    <main className="relative min-h-screen overflow-x-hidden text-white">
      {/* 히어로 섹션: 배경 비디오 */}
      <section
        ref={heroRef}
        className="relative w-full h-[100vh] overflow-hidden"
        style={{ ['--home-reveal' as any]: String(revealProgress) }}
      >
        {/* 스타일: 슬로우 줌 키프레임 */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes heroSlowZoom { 0% { transform: scale(1) } 100% { transform: scale(1.03) } }
            @keyframes homeArrowBlink { 0%, 80%, 100% { opacity: .2 } 40% { opacity: 1 } }
            @keyframes homeArrowFloat { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(2px) } }
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
          className="fixed inset-0 w-full h-full object-cover will-change-transform"
          style={{
            transform: `translateY(${parallaxY * -1 - revealProgress * 30}px) scale(${1 - revealProgress * 0.06})`,
            animation: 'heroSlowZoom 28s linear infinite alternate',
            filter: 'brightness(0.9) saturate(0.9) contrast(1.05)',
            zIndex: 0 as any
          }}
        />

        {/* 스크롤 힌트: 하단 중앙 글라스 화살표 3개 (blink) */}
        <div
          className="absolute inset-x-0 bottom-[12vh] z-20 flex justify-center pointer-events-none"
          style={{
            opacity: Math.max(0, 1 - revealProgress * 1.2),
            transition: 'opacity 300ms ease'
          }}
        >
          <div className="pointer-events-auto rounded-2xl border border-white/20 bg-white/10 backdrop-blur px-2.5 py-2 shadow-glass">
            <div className="flex flex-col items-center gap-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                   style={{ animation: 'homeArrowBlink 1.4s infinite ease-in-out, homeArrowFloat 2.2s infinite ease-in-out', animationDelay: '0ms' }}
                   aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                   style={{ animation: 'homeArrowBlink 1.4s infinite ease-in-out, homeArrowFloat 2.2s infinite ease-in-out', animationDelay: '150ms' }}
                   aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                   style={{ animation: 'homeArrowBlink 1.4s infinite ease-in-out, homeArrowFloat 2.2s infinite ease-in-out', animationDelay: '300ms' }}
                   aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* 로딩 바 (비디오 중앙, 준비 완료 시 페이드 아웃) */}
        <div
          aria-hidden
          className={`absolute inset-0 z-20 flex items-center justify-center px-4 transition-opacity duration-300 ${isVideoReady ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="w-[min(92%,720px)] px-4 py-3 rounded-2xl bg-black/45 border border-white/20 backdrop-blur-md shadow-glass">
            <div className="flex items-center gap-3">
              <span className="text-xs md:text-sm text-white/90">로딩중</span>
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

        {/* 비네트 + 컬러 그레이딩 + 그라데이션 마스크 + 그레인 */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 상/하단 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/30 to-black/85" />
          {/* 소프트 라이트 앰버 오버레이 (강도 약간 증가) */}
          <div className="absolute inset-0 mix-blend-soft-light bg-amber-300/14" />
          {/* 비네트 */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 48%, rgba(0,0,0,0.55) 100%)',
              mixBlendMode: 'multiply',
            }}
          />
          {/* 그레인/노이즈 레이어 */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.10]"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.07) 1px, transparent 1px)',
              backgroundPosition: '0 0, 1px 1px',
              backgroundSize: '3px 3px, 3px 3px',
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* 히어로 콘텐츠 (제목) - 상단~중앙 심미적 배치 */}
        <div className="absolute inset-x-0 top-[18vh] md:top-[22vh] z-10 px-4 md:px-8">
          <div className="mx-auto w-full max-w-5xl text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
              잡다한 기록 홈페이지
            </h1>
            <p className="mt-4 md:mt-6 text-base md:text-lg text-amber-300">
              인스타는 너무 평범해서 홈페이지 직접 만듦
            </p>
          </div>
        </div>

        {/* 하단 우측 플로팅 사운드 토글 (히어로 섹션 내부, 영상 우하단 가장자리) */}
        <div className="pointer-events-none absolute bottom-3 right-3 z-30">
          <button
            type="button"
            onClick={() => {
              const next = !isMuted
              setIsMuted(next)
              const v = videoRef.current
              if (v) {
                v.muted = next
                if (next) return
                try { v.removeAttribute('muted') } catch {}
                v.muted = false
                v.volume = 1
                try { v.pause() } catch {}
                setTimeout(() => { v.play().catch(() => {}) }, 0)
              }
            }}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/35 hover:bg-black/45 transition backdrop-blur-md px-3 py-2 shadow-glass"
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
            <span className="opacity-90 text-sm">{isMuted ? '음소거 해제' : '음소거'}</span>
          </button>
        </div>

      </section>

      {/* 본문: 기존 그리드 등장 애니메이션 (새 요소 없이) */}
      <section
        className="relative z-10 w-full p-4 md:p-8 flex flex-col justify-center items-center pointer-events-auto"
        style={{
          opacity: revealProgress,
          transform: `translateY(${(20 * (1 - revealProgress)).toFixed(2)}px)`,
          transition: 'transform 300ms ease, opacity 300ms ease'
        }}
      >
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


      {/* 스티커 오버레이 홈에서는 제거됨 */}
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
