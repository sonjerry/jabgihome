// client/src/pages/Home.tsx
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import djVideo from '../assets/media/dj.mp4'
import { Link } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import ContactDock from '../components/ContactDock'
import BlurText from "../components/BlurText"
import CircularText from '../components/CircularText'
import { useScrollReveal } from '../hooks/useScrollReveal'
 


export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [hasUnmuted, setHasUnmuted] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const revealProgress = useScrollReveal(10)
  

  const handleUnmute = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    setHasUnmuted(true)
    setIsMuted(false)
    if (v) {
      try { v.removeAttribute('muted') } catch {}
      v.muted = false
      v.volume = 1
      try { void v.play() } catch {}
    }
  }

  return (
    <>
      {/* 고정된 배경 비디오 - 스크롤과 완전히 독립 (body 포털) */}
      <BodyPortal>
      <section
        className="video-container overflow-hidden"
        style={{ 
          overscrollBehavior: 'none',
          background: 'transparent'
        }}
      >
        {/* 스타일: 슬로우 줌 키프레임 */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes heroSlowZoom { 0% { transform: scale(1) } 100% { transform: scale(1.03) } }
            @keyframes homeArrowBlink { 0%, 80%, 100% { opacity: .2 } 40% { opacity: 1 } }
            @keyframes homeArrowFloat { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(2px) } }
            
            /* 영상 완전 고정을 위한 강제 스타일 */
            .video-container {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              z-index: 0 !important;
              transform: translateZ(0) !important;
            }
            
            .video-element {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              transform: translateZ(0) !important;
            }
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
        {/* 배경 비디오 - 완전 고정 */}
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
          onCanPlay={() => setIsVideoReady(true)}
          onPlaying={() => setIsVideoReady(true)}
          className="video-element"
          style={{
            objectPosition: 'center center',
            animation: 'heroSlowZoom 28s linear infinite alternate',
            filter: 'brightness(0.9) saturate(0.9) contrast(1.05)',
            backfaceVisibility: 'hidden',
            willChange: 'transform'
          }}
        />


        {/* 로딩 오버레이 */}
        {!isVideoReady && (
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



        {/* 히어로 콘텐츠 (제목/서브타이틀/언뮤트) */}
        {isVideoReady && (
          <div className="absolute inset-0 z-10 px-4 md:px-8 flex items-center justify-center" style={{ transform: 'translateY(-15vh)' }}>
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
              {!hasUnmuted && (
                <button
                  type="button"
                  role="button"
                  tabIndex={0}
                  onClick={handleUnmute}
                  onMouseDown={handleUnmute}
                  className="mt-6 pointer-events-auto inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 transition-all duration-200 backdrop-blur-xl px-6 py-3 shadow-glass transform hover:scale-105 active:scale-95"
                  style={{ animation: 'bounceIn 0.8s ease-out 0.3s both' }}
                >
                  <span className="opacity-90 text-sm md:text-base font-medium whitespace-nowrap">음소거 해제</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 스크롤 힌트 - 음소거 해제 후 표시 */}
        {hasUnmuted && revealProgress < 0.1 && (
          <div
            className="absolute inset-x-0 bottom-[20vh] z-20 flex items-center justify-center"
            style={{
              opacity: 1 - revealProgress * 10,
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

        {/* 중앙 음소거 버튼 블록은 로딩 오버레이에서 처리하므로 별도 노출 없음 */}

      </section>
      </BodyPortal>

      {/* 스크롤 가능한 메인 컨테이너 */}
      <main 
        className="relative z-10 text-white"
        style={{ 
          minHeight: '160vh',
          background: 'transparent'
        }}
      >
        {/* 카드 등장 트리거 공간 */}
        <div style={{ height: '70vh' }} />
        <div style={{ height: '90vh' }} />
      </main>

      {/* 스크롤 시 나타나는 카드들 - 영상 위에 포개짐 (언뮤트 이후 + 스크롤 임계값 충족, BodyPortal) */}
      <BodyPortal>
      {hasUnmuted && revealProgress >= 0.1 && (
      <div className="fixed inset-0 z-30 pointer-events-none" style={{ pointerEvents: 'none' }}>
        {/* 왼쪽 상단 카드 - 왼쪽 위에서 슬라이드 */}
        <div 
          className="absolute top-4 left-4 md:top-8 md:left-8"
          style={{
            opacity: Math.max(0, Math.min(1, revealProgress)),
            transform: `translate(${-100 * (1 - revealProgress)}px, ${-50 * (1 - revealProgress)}px)`,
            transition: 'opacity 600ms ease-out, transform 600ms ease-out'
          }}
        >
          <GlassCard className="p-0 w-48 md:w-64 overflow-hidden relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-white/15 via-white/5 to-white/0 rounded-2xl blur-xl" aria-hidden="true" />
            <div className="relative p-4 md:p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-white/90">
                <div className="size-7 md:size-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur">🏷️</div>
                <h3 className="text-base md:text-lg font-semibold">블로그</h3>
              </div>
              <p className="text-white/70 text-xs md:text-sm leading-relaxed">쓸데없는 생각 정리</p>
              <div className="pt-1"><CTA to="/blog" title="보러가기" /></div>
            </div>
          </GlassCard>
        </div>

        {/* 오른쪽 상단 카드 - 오른쪽 위에서 슬라이드 */}
        <div 
          className="absolute top-4 right-4 md:top-8 md:right-8"
          style={{
            opacity: Math.max(0, Math.min(1, revealProgress)),
            transform: `translate(${100 * (1 - revealProgress)}px, ${-50 * (1 - revealProgress)}px)`,
            transition: 'opacity 600ms ease-out, transform 600ms ease-out',
            transitionDelay: '100ms'
          }}
        >
          <GlassCard className="p-0 w-48 md:w-64 overflow-hidden relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-white/15 via-white/5 to-white/0 rounded-2xl blur-xl" aria-hidden="true" />
            <div className="relative p-4 md:p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-white/90">
                <div className="size-7 md:size-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur">🧩</div>
                <h3 className="text-base md:text-lg font-semibold">프로젝트</h3>
              </div>
              <p className="text-white/70 text-xs md:text-sm leading-relaxed">토이 프로젝트 정리</p>
              <div className="pt-1"><CTA to="/projects" title="보러가기" /></div>
            </div>
          </GlassCard>
        </div>

        {/* 왼쪽 하단 카드 - 왼쪽 아래에서 슬라이드 */}
        <div 
          className="absolute bottom-20 left-4 md:bottom-8 md:left-8"
          style={{
            opacity: Math.max(0, Math.min(1, revealProgress)),
            transform: `translate(${-100 * (1 - revealProgress)}px, ${50 * (1 - revealProgress)}px)`,
            transition: 'opacity 600ms ease-out, transform 600ms ease-out',
            transitionDelay: '200ms'
          }}
        >
          <GlassCard className="p-0 w-48 md:w-64 overflow-hidden relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-white/15 via-white/5 to-white/0 rounded-2xl blur-xl" aria-hidden="true" />
            <div className="relative p-4 md:p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-white/90">
                <div className="size-7 md:size-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur">🎨</div>
                <h3 className="text-base md:text-lg font-semibold">AI 갤러리</h3>
              </div>
              <p className="text-white/70 text-xs md:text-sm leading-relaxed">AI로 만든 애니 캐릭터 갤러리 </p>
              <div className="pt-1"><CTA to="/gallery" title="보러가기" /></div>
            </div>
          </GlassCard>
        </div>

        {/* 오른쪽 하단 카드 - 오른쪽 아래에서 슬라이드 */}
        <div 
          className="absolute bottom-20 right-4 md:bottom-8 md:right-8"
          style={{
            opacity: Math.max(0, Math.min(1, revealProgress)),
            transform: `translate(${100 * (1 - revealProgress)}px, ${50 * (1 - revealProgress)}px)`,
            transition: 'opacity 600ms ease-out, transform 600ms ease-out',
            transitionDelay: '300ms'
          }}
        >
          <GlassCard className="p-0 w-48 md:w-64 overflow-hidden relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-white/15 via-white/5 to-white/0 rounded-2xl blur-xl" aria-hidden="true" />
            <div className="relative p-4 md:p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-white/90">
                <div className="size-7 md:size-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur">📦</div>
                <h3 className="text-base md:text-lg font-semibold">3D 모델 갤러리리</h3>
              </div>
              <p className="text-white/70 text-xs md:text-sm leading-relaxed">AI로 만든 3D 모델 갤러리 </p>
              <div className="pt-1"><CTA to="/modelgallery" title="보러가기" /></div>
            </div>
          </GlassCard>
        </div>
      </div>
      )}
      </BodyPortal>

      {/* Contact Dock: 언뮤트 전에는 포인터 이벤트 차단하여 버튼과 충돌 방지 */}
      <div
        style={{
          pointerEvents: (isVideoReady && !hasUnmuted) ? 'none' : undefined,
          zIndex: (isVideoReady && !hasUnmuted) ? 10 as any : undefined,
          position: 'fixed',
          bottom: 0,
          right: 0
        }}
      >
        <ContactDock />
      </div>
    </>
  )
}

/* ───────────────────── 보조 컴포넌트 ───────────────────── */

// body 포털: 변환(transform)된 조상 컨텍스트의 영향을 피하기 위해 직접 body로 렌더링
function BodyPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null as any
  return createPortal(children, document.body)
}

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

