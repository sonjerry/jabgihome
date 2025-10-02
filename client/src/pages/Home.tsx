// client/src/pages/Home.tsx
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import djVideo from '../assets/media/dj.mp4'
import { Link } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import ContactDock from '../components/ContactDock'
import BlurText from "../components/BlurText"
import CircularText from '../components/CircularText'
 


export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const heroRef = useRef<HTMLDivElement | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [hasUnmuted, setHasUnmuted] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [videoMuteOverride, setVideoMuteOverride] = useState<null | 'forceUnmute'>(null) // 음악 자동 음소거 무시
  const videoMuteOverrideRef = useRef<null | 'forceUnmute'>(null)
  const justUnmutedAtRef = useRef<number>(0)
  const [revealProgress, setRevealProgress] = useState(0) // 0~1: 네비/카드 등장, 비디오 리레이아웃
  const [isInitialLoad, setIsInitialLoad] = useState(true) // 초기 로딩 상태
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
        // 5%만 로딩되어도 바로 준비 완료로 처리하여 재생을 진행
        if (pct >= 5) {
          if (!isVideoReady) {
            setIsVideoReady(true)
            setIsInitialLoad(false)
            try { void vid.play() } catch {}
          }
        }
        if (pct >= 100) setIsVideoReady(true)
      } catch {}
    }

    const onLoadedMeta = () => { updateProgress() }
    const onLoadedData = () => { setIsVideoReady(true); setIsInitialLoad(false) }
    const onCanPlay = () => { setIsVideoReady(true); setIsInitialLoad(false) }
    const onProgress = () => { updateProgress() }
    const onWaiting = () => { /* 대기 중에도 준비 상태를 유지 */ }
    const onPlaying = () => {
      setIsVideoReady(true)
      setIsVideoPlaying(true)
      setIsInitialLoad(false)
    }

    vid.addEventListener('loadedmetadata', onLoadedMeta)
    vid.addEventListener('loadeddata', onLoadedData)
    vid.addEventListener('canplay', onCanPlay)
    vid.addEventListener('progress', onProgress)
    vid.addEventListener('waiting', onWaiting)
    vid.addEventListener('playing', onPlaying)

    // 초기 한번 계산
    updateProgress()

    return () => {
      vid.removeEventListener('loadedmetadata', onLoadedMeta)
      vid.removeEventListener('loadeddata', onLoadedData)
      vid.removeEventListener('canplay', onCanPlay)
      vid.removeEventListener('progress', onProgress)
      vid.removeEventListener('waiting', onWaiting)
      vid.removeEventListener('playing', onPlaying)
    }
  }, [])

  // 초기 상태: 아직 음소거 해제하지 않음
  useEffect(() => { setHasUnmuted(false) }, [])

  // 로딩 완료 3초 후 힌트 표시, 그 전에는 숨김
  useEffect(() => {
    if (isVideoReady) {
      const t = setTimeout(() => setShowHint(true), 3000)
      return () => clearTimeout(t)
    }
    setShowHint(false)
  }, [isVideoReady])

  // 음소거 해제 시 바로 카드가 등장하도록 리빌 트리거
  useEffect(() => {
    if (hasUnmuted) {
      revealTargetRef.current = 1
    }
  }, [hasUnmuted])

  // 뮤직 플레이어 재생 시 영상 자동 음소거 (레퍼런스로 레이스 방지)
  useEffect(() => {
    videoMuteOverrideRef.current = videoMuteOverride
  }, [videoMuteOverride])

  useEffect(() => {
    const onMusicPlaying = (e: Event) => {
      try {
        const isPlaying = (e as CustomEvent<boolean>).detail
        const v = videoRef.current
        const override = videoMuteOverrideRef.current
        const now = Date.now()
        // 언뮤트 직후 짧은 시간(800ms) 동안은 재음소거 무시
        const withinGrace = now - (justUnmutedAtRef.current || 0) < 800
        if (!v) return
        if (isPlaying) {
          if (override !== 'forceUnmute' && !withinGrace) {
            v.muted = true
            setIsMuted(true)
          }
        } else {
          if (override === 'forceUnmute') {
            v.muted = false
            setIsMuted(false)
          }
        }
      } catch {}
    }
    window.addEventListener('music:playing', onMusicPlaying as any)
    return () => window.removeEventListener('music:playing', onMusicPlaying as any)
  }, [])

  // iOS 밴딩 효과 방지 및 스크롤 제어
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    
    // iOS 밴딩 효과 방지 및 스크롤 최적화
    html.style.overscrollBehavior = 'none'
    body.style.overscrollBehavior = 'none'
    ;(html.style as any).WebkitOverflowScrolling = 'touch'
    ;(body.style as any).WebkitOverflowScrolling = 'touch'
    
    
    if (isInitialLoad) {
      const prevHtml = html.style.overflow
      const prevBody = body.style.overflow
      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
      return () => {
        html.style.overflow = prevHtml
        body.style.overflow = prevBody
        html.style.overscrollBehavior = ''
        body.style.overscrollBehavior = ''
        ;(html.style as any).WebkitOverflowScrolling = ''
        ;(body.style as any).WebkitOverflowScrolling = ''
        
      }
    }
    
    return () => {
      html.style.overscrollBehavior = ''
      body.style.overscrollBehavior = ''
      ;(html.style as any).WebkitOverflowScrolling = ''
      ;(body.style as any).WebkitOverflowScrolling = ''
      
    }
  }, [isInitialLoad])

  // 패럴랙스 효과 제거 - 영상은 고정

  // 스크롤/영상 종료에 따른 등장 애니메이션 트리거 + 부드러운 보간 (모바일에서도 활성화)
  useEffect(() => {
    // 모바일에서도 스크롤 기반 애니메이션 활성화
    // if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 767px)').matches) {
    //   return
    // }
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

  const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 767px)').matches

  const handleUnmute = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    setHasUnmuted(true)
    setVideoMuteOverride('forceUnmute')
    videoMuteOverrideRef.current = 'forceUnmute'
    justUnmutedAtRef.current = Date.now()
    setIsMuted(false)
    if (v) {
      try { v.removeAttribute('muted') } catch {}
      v.muted = false
      v.volume = 1
      try { void v.play() } catch {}
    }
    // 음악과의 겹침 방지: 오디오 일시정지 이벤트 브로드캐스트
    try { window.dispatchEvent(new CustomEvent('home:video-unmuted')) } catch {}
  }

  return (
    <main 
      className="relative overflow-x-hidden text-white"
      style={{ 
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch',
        minHeight: '200vh', // 모바일에서도 스크롤 가능하도록 높이 설정
        background: 'transparent',
        // 스크롤 시 배경이 보이지 않도록 완전 투명
        backgroundColor: 'transparent'
      }}
      // onClick 핸들러 제거 - 스크롤 기반으로 변경
    >
      {/* 히어로 섹션: 고정된 배경 비디오 (포털로 body에 렌더링하여 어느 상위 transform 영향도 받지 않도록) */}
      {createPortal(
      <section
        ref={heroRef}
        className="fixed inset-0 w-full overflow-hidden"
        style={{ 
          ['--home-reveal' as any]: String(revealProgress),
          overscrollBehavior: 'none',
          background: 'transparent',
        }}
      >
        {/* 스타일: 슬로우 줌 키프레임 */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes heroSlowZoom { 0% { transform: scale(1) } 100% { transform: scale(1.03) } }
            @keyframes homeArrowBlink { 0%, 80%, 100% { opacity: .2 } 40% { opacity: 1 } }
            @keyframes homeArrowFloat { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(2px) } }
            @keyframes hintSlideUp { 
              0% { 
                opacity: 0; 
                transform: translateY(30px) scale(0.9); 
              } 
              100% { 
                opacity: 1; 
                transform: translateY(0) scale(1); 
              } 
            }
            @keyframes overlayFadeIn {
              0% { 
                opacity: 0; 
                backdrop-filter: blur(0px);
              }
              100% { 
                opacity: 1; 
                backdrop-filter: blur(20px);
              }
            }
          `,
          }}
        />
        {/* 배경 비디오 - iOS 완전 고정 */}
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
          style={{
            animation: 'heroSlowZoom 28s linear infinite alternate',
            filter: 'brightness(0.9) saturate(0.9) contrast(1.05)',
            zIndex: 0 as any,
          }}
        />

        {/* 스크롤 힌트: 클릭 기능 없이 시각적 표시만 */}
        {hasUnmuted && revealProgress < 0.1 && (
          <div
            className="absolute inset-x-0 bottom-[20vh] z-20 flex items-center justify-center"
            style={{
              opacity: 1 - revealProgress * 10, // 스크롤 시 서서히 사라짐
              transition: 'opacity 300ms ease, transform 300ms ease',
              animation: 'hintSlideUp 0.6s ease-out'
            }}
          >
            <div className="text-center">
              <div className="text-white/80 text-sm mb-3">아래로 스크롤하세요</div>
              <div className="pointer-events-none rounded-3xl border border-white/20 bg-white/10 backdrop-blur px-10 py-3 shadow-glass">
                <div className="flex items-center gap-3">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                       style={{ animation: 'homeArrowBlink 1.4s infinite ease-in-out, homeArrowFloat 2.2s infinite ease-in-out', animationDelay: '0ms' }}
                       aria-hidden>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                       style={{ animation: 'homeArrowBlink 1.4s infinite ease-in-out, homeArrowFloat 2.2s infinite ease-in-out', animationDelay: '150ms' }}
                       aria-hidden>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                       style={{ animation: 'homeArrowBlink 1.4s infinite ease-in-out, homeArrowFloat 2.2s infinite ease-in-out', animationDelay: '300ms' }}
                       aria-hidden>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 로딩 오버레이: 중앙 CircularText + 하단 음소거 해제 버튼 */}
        {(!isVideoReady || isInitialLoad) && (
          <div
            className={`absolute inset-0 z-[100] flex flex-col items-center justify-center gap-6 px-4 bg-black transition-opacity duration-300`}
          >
            <CircularText
              text={"로딩중*로딩중*로딩중*"}
              onHover="speedUp"
              spinDuration={20}
              className="text-white/95"
            />
          </div>
        )}

        {/* 로딩 후에도 클릭 전까지 하단 음소거 버튼 유지 */}
        {isVideoReady && !hasUnmuted && (
          <div 
            className="fixed inset-0 z-[100000] pointer-events-none flex items-end justify-center"
            style={{
              animation: 'fadeInBackdrop 0.5s ease-out',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 120px)' // ContactDock과 겹치지 않도록 더 위로 이동
            }}
          >
            <button
              type="button"
              role="button"
              tabIndex={0}
              onClick={handleUnmute}
              onMouseDown={handleUnmute}
              className="pointer-events-auto inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 transition-all duration-200 backdrop-blur-xl px-7 py-3.5 shadow-glass transform hover:scale-105 active:scale-95"
              style={{
                animation: 'bounceIn 0.8s ease-out 0.3s both'
              }}
            >
              <span className="opacity-90 text-sm md:text-base font-medium whitespace-nowrap">이곳을 눌러 음소거를 해제해주세요</span>
            </button>
          </div>
        )}



        {/* 히어로 콘텐츠 (제목) - 로딩 중 숨김, 재생 시작 후 BlurText로 출현 */}
        {(isVideoReady && isVideoPlaying) && (
          <div className="absolute inset-0 z-10 px-4 md:px-8 flex items-center justify-center" style={{ transform: 'translateY(-6vh)' }}>
            <div className="w-full max-w-5xl flex flex-col items-center text-center">
              <BlurText
                text="잡다한 기록 홈페이지"
                animateBy="letters"
                className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight drop-shadow-lg break-keep whitespace-nowrap"
                delay={20}
                direction="top"
                noWrap
              />
              <BlurText
                text="인스타는 너무 평범해서 홈페이지 직접 만듦"
                animateBy="words"
                className="mt-4 md:mt-6 text-base md:text-lg text-amber-300 break-keep"
                delay={80}
                direction="bottom"
              />
            </div>
          </div>
        )}

        {/* 중앙 음소거 버튼 블록은 로딩 오버레이에서 처리하므로 별도 노출 없음 */}

      </section>, document.body)}

      {/* Contact Dock: 언뮤트 전에는 포인터 이벤트 차단하여 버튼과 충돌 방지 */}
      <div
        style={{
          pointerEvents: (isVideoReady && !hasUnmuted) ? 'none' : undefined,
          zIndex: (isVideoReady && !hasUnmuted) ? 10 as any : undefined,
          position: 'relative'
        }}
      >
        <ContactDock />
      </div>


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

