// AutoStickersWithPeel.tsx
import { useEffect, useMemo, useRef, useState, CSSProperties } from 'react'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'

gsap.registerPlugin(Draggable)

/* ───────────────────── StickerPeel ───────────────────── */

interface StickerPeelProps {
  imageSrc: string
  rotate?: number
  peelBackHoverPct?: number
  peelBackActivePct?: number
  peelEasing?: string
  peelHoverEasing?: string
  width?: number
  shadowIntensity?: number
  lightingIntensity?: number
  initialPosition?: 'center' | { x: number; y: number }
  peelDirection?: number
  className?: string
  onAnyDragStart?: () => void
  showNudge?: boolean
  nudgeText?: string
}

interface CSSVars extends CSSProperties {
  '--sticker-rotate'?: string
  '--sticker-p'?: string
  '--sticker-peelback-hover'?: string
  '--sticker-peelback-active'?: string
  '--sticker-peel-easing'?: string
  '--sticker-peel-hover-easing'?: string
  '--sticker-width'?: string
  '--sticker-shadow-opacity'?: number
  '--sticker-lighting-constant'?: number
  '--peel-direction'?: string
  '--sticker-start'?: string
  '--sticker-end'?: string
}

export const StickerPeel: React.FC<StickerPeelProps> = ({
  imageSrc,
  rotate = 30,
  peelBackHoverPct = 30,
  peelBackActivePct = 40,
  peelEasing = 'power3.out',
  peelHoverEasing = 'power2.out',
  width = 200,
  shadowIntensity = 0.6,
  lightingIntensity = 0.1,
  initialPosition = 'center',
  peelDirection = 0,
  className = '',
  onAnyDragStart,
  showNudge = false,
  nudgeText = '끌어서 이동하세요',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragTargetRef = useRef<HTMLDivElement>(null)
  const pointLightRef = useRef<SVGFEPointLightElement>(null)
  const pointLightFlippedRef = useRef<SVGFEPointLightElement>(null)
  const draggableInstanceRef = useRef<Draggable | null>(null)
  const notifiedDragStartRef = useRef(false)
  const [localNudge, setLocalNudge] = useState(showNudge)

  const defaultPadding = 12

  // 초기 위치
  useEffect(() => {
    const target = dragTargetRef.current
    if (!target) return

    if (initialPosition === 'center') return

    if (
      typeof initialPosition === 'object' &&
      initialPosition.x !== undefined &&
      initialPosition.y !== undefined
    ) {
      const { x, y } = initialPosition
      gsap.set(target, { x, y })
    }
  }, [initialPosition])

  // 드래그
  useEffect(() => {
    const target = dragTargetRef.current
    if (!target) return

    const boundsEl = target.parentNode as HTMLElement

    const draggable = Draggable.create(target, {
      type: 'x,y',
      bounds: boundsEl,
      inertia: true,
      onDragStart() {
        if (!notifiedDragStartRef.current) {
          notifiedDragStartRef.current = true
          try { onAnyDragStart?.() } catch {}
        }
        if (localNudge) setLocalNudge(false)
      },
      onDrag(this: Draggable) {
        const rot = gsap.utils.clamp(-24, 24, this.deltaX * 0.4)
        gsap.to(target, { rotation: rot, duration: 0.15, ease: 'power1.out' })
      },
      onDragEnd() {
        const rotationEase = 'power2.out'
        const duration = 0.8
        gsap.to(target, { rotation: 0, duration, ease: rotationEase })
      },
    })

    draggableInstanceRef.current = draggable[0]

    const handleResize = () => {
      if (draggableInstanceRef.current) {
        draggableInstanceRef.current.update()

        const currentX = Number(gsap.getProperty(target, 'x'))
        const currentY = Number(gsap.getProperty(target, 'y'))

        const boundsRect = boundsEl.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()

        const maxX = boundsRect.width - targetRect.width
        const maxY = boundsRect.height - targetRect.height

        const newX = Math.max(0, Math.min(currentX, maxX))
        const newY = Math.max(0, Math.min(currentY, maxY))

        if (newX !== currentX || newY !== currentY) {
          gsap.to(target, {
            x: newX,
            y: newY,
            duration: 0.3,
            ease: 'power2.out',
          })
        }
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if (draggableInstanceRef.current) {
        draggableInstanceRef.current.kill()
      }
    }
  }, [])

  // 마우스 라이트
  useEffect(() => {
    const updateLight = (e: Event) => {
      const mouseEvent = e as MouseEvent
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = mouseEvent.clientX - rect.left
      const y = mouseEvent.clientY - rect.top

      if (pointLightRef.current) {
        gsap.set(pointLightRef.current, { attr: { x, y } })
      }

      const normalizedAngle = Math.abs(peelDirection % 360)
      if (pointLightFlippedRef.current) {
        if (normalizedAngle !== 180) {
          gsap.set(pointLightFlippedRef.current, {
            attr: { x, y: rect.height - y },
          })
        } else {
          gsap.set(pointLightFlippedRef.current, {
            attr: { x: -1000, y: -1000 },
          })
        }
      }
    }

    const container = containerRef.current
    if (!container) return
    container.addEventListener('mousemove', updateLight)
    return () => container.removeEventListener('mousemove', updateLight)
  }, [peelDirection])

  // 터치 상태
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = () => container.classList.add('touch-active')
    const handleTouchEnd = () => container.classList.remove('touch-active')

    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchend', handleTouchEnd)
    container.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [])

  const cssVars: CSSVars = useMemo(
    () => ({
      '--sticker-rotate': `${rotate}deg`,
      '--sticker-p': `${defaultPadding}px`,
      '--sticker-peelback-hover': `${peelBackHoverPct}%`,
      '--sticker-peelback-active': `${peelBackActivePct}%`,
      '--sticker-peel-easing': peelEasing,
      '--sticker-peel-hover-easing': peelHoverEasing,
      '--sticker-width': `${width}px`,
      '--sticker-shadow-opacity': shadowIntensity,
      '--sticker-lighting-constant': lightingIntensity,
      '--peel-direction': `${peelDirection}deg`,
      '--sticker-start': `calc(-1 * ${defaultPadding}px)`,
      '--sticker-end': `calc(100% + ${defaultPadding}px)`,
    }),
    [
      rotate,
      peelBackHoverPct,
      peelBackActivePct,
      peelEasing,
      peelHoverEasing,
      width,
      shadowIntensity,
      lightingIntensity,
      peelDirection,
      defaultPadding,
    ]
  )

  const stickerMainStyle: CSSProperties = {
    clipPath:
      'polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end))',
    transition: 'clip-path 0.6s ease-out',
    filter: 'url(#dropShadow)',
    willChange: 'clip-path, transform',
  }

  const flapStyle: CSSProperties = {
    clipPath:
      'polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-start) var(--sticker-start))',
    top: 'calc(-100% - var(--sticker-p) - var(--sticker-p))',
    transform: 'scaleY(-1)',
    transition: 'all 0.6s ease-out',
    willChange: 'clip-path, transform',
  }

  const imageStyle: CSSProperties = {
    transform: `rotate(calc(${rotate}deg - ${peelDirection}deg))`,
    width: `${width}px`,
  }

  const shadowImageStyle: CSSProperties = {
    ...imageStyle,
    filter: 'url(#expandAndFill)',
  }

  return (
    <div
      className={`absolute cursor-grab active:cursor-grabbing transform-gpu ${className}`}
      ref={dragTargetRef}
      style={cssVars}
    >
      {/* 상태 스타일 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .sticker-container:hover .sticker-main,
          .sticker-container.touch-active .sticker-main {
            clip-path: polygon(var(--sticker-start) var(--sticker-peelback-hover), var(--sticker-end) var(--sticker-peelback-hover), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end)) !important;
          }
          .sticker-container:hover .sticker-flap,
          .sticker-container.touch-active .sticker-flap {
            clip-path: polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-peelback-hover), var(--sticker-start) var(--sticker-peelback-hover)) !important;
            top: calc(-100% + 2 * var(--sticker-peelback-hover) - 1px) !important;
          }
          .sticker-container:active .sticker-main {
            clip-path: polygon(var(--sticker-start) var(--sticker-peelback-active), var(--sticker-end) var(--sticker-peelback-active), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end)) !important;
          }
          .sticker-container:active .sticker-flap {
            clip-path: polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-peelback-active), var(--sticker-start) var(--sticker-peelback-active)) !important;
            top: calc(-100% + 2 * var(--sticker-peelback-active) - 1px) !important;
          }
        `,
        }}
      />

      {/* 필터 defs */}
      <svg width="0" height="0">
        <defs>
          <filter id="pointLight">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feSpecularLighting
              result="spec"
              in="blur"
              specularExponent="100"
              specularConstant={lightingIntensity}
              lightingColor="white"
            >
              <fePointLight ref={pointLightRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>

          <filter id="pointLightFlipped">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feSpecularLighting
              result="spec"
              in="blur"
              specularExponent="100"
              specularConstant={lightingIntensity * 7}
              lightingColor="white"
            >
              <fePointLight ref={pointLightFlippedRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>

          <filter id="dropShadow">
            <feDropShadow
              dx="2"
              dy="4"
              stdDeviation={3 * shadowIntensity}
              floodColor="black"
              floodOpacity={shadowIntensity}
            />
          </filter>

          <filter id="expandAndFill">
            <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
            <feFlood floodColor="rgb(179,179,179)" result="flood" />
            <feComposite operator="in" in="flood" in2="shape" />
          </filter>
        </defs>
      </svg>

      {/* 본체 */}
      <div
        className="sticker-container relative select-none touch-none sm:touch-auto"
        ref={containerRef}
        style={{
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          transform: `rotate(${peelDirection}deg)`,
          transformOrigin: 'center',
        }}
      >
        {localNudge && (
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 z-[90] rounded-2xl border border-black/10 bg-white/95 backdrop-blur-xl px-3.5 py-1.5 text-[12px] font-semibold text-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
            style={{ animation: 'nudgePop 900ms ease-in-out infinite alternate, nudgeFloat 2.2s ease-in-out infinite, nudgeGlow 2.4s ease-in-out infinite' }}
          >
            {nudgeText}
            <div className="absolute left-1/2 -bottom-1 w-3 h-3 rotate-45 bg-white/95 border-b border-r border-black/10" />
          </div>
        )}
        <div className="sticker-main" style={stickerMainStyle}>
          <div style={{ filter: 'url(#pointLight)' }}>
            <img
              src={imageSrc}
              alt=""
              className="block"
              style={imageStyle}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>

        {/* 그림자 플랩 배경 */}
        <div
          className="absolute top-4 left-2 w-full h-full opacity-40"
          style={{ filter: 'brightness(0) blur(8px)' }}
        >
          <div className="sticker-flap" style={flapStyle}>
            <img
              src={imageSrc}
              alt=""
              className="block"
              style={shadowImageStyle}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>

        {/* 반사 플랩 */}
        <div className="sticker-flap absolute w-full h-full left-0" style={flapStyle}>
          <div style={{ filter: 'url(#pointLightFlipped)' }}>
            <img
              src={imageSrc}
              alt=""
              className="block"
              style={shadowImageStyle}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────── AutoStickers ───────────────────── */

type StickerItem = {
  url: string
  width: number
  rotate: number
  x: number
  y: number
  peelDirection: number
}

export default function AutoStickers() {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [nudgeIdx] = useState<number>(() => Math.floor(Math.random() * 7))
  const [nudgeGone, setNudgeGone] = useState<boolean>(() => {
    try { return localStorage.getItem('stickerNudgeDismissed') === '1' } catch { return false }
  })

  // 스티커 png 자동 수집
  const urls = useMemo(() => {
    const mods = import.meta.glob('../assets/sticker/*.png', {
      eager: true,
      query: '?url',
      import: 'default',
    })
    return Object.values(mods) as string[]
  }, [])

  // 컨테이너 사이즈 추적
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect
      setBox({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 배치 파라미터 (가장자리 고정 배치) + 모바일 대응
  const margin = 8
  const isMobile = box.w > 0 && box.w <= 640
  // 전체 크기를 50%로 축소
  const minW = isMobile ? 55 : 70
  const maxW = isMobile ? 90 : 130
  const safeTopHeight = isMobile ? 120 : 80
  const safeBottomHeight = isMobile ? 280 : 220 // 하단 UI(사운드 버튼 등) 안전 영역 높이
  const safeLeftWidth = isMobile ? 16 : 420 // 좌측 콘텐츠 폭 근처 회피 (모바일에서는 가장자리만 사용)

  const items: StickerItem[] = useMemo(() => {
    if (!box.h || urls.length === 0) return []

    const patternWidths = isMobile
      ? [75, 65, 85, 60, 80, 70]
      : [100, 80, 110, 90, 120, 75, 105, 85]
    const patternRot = isMobile
      ? [-6, 5, -3, 7, -4, 4]
      : [-8, 6, -4, 10, -6, 4, 0, 8]
    const baseSlotSize = isMobile ? 95 : 80
    const minSlots = isMobile ? 3 : 4
    const slots = Math.min(urls.length, Math.max(minSlots, Math.floor(box.h / baseSlotSize)))
    const usableHeight = Math.max(0, box.h - safeBottomHeight - margin)
    const edgeYOffset = isMobile ? 28 : 40

    const slotYs: number[] = []
    for (let i = 0; i < slots; i++) {
      const t = (i + 1) / (slots + 1)
      const y = clamp(edgeYOffset + t * (usableHeight - edgeYOffset), 0, usableHeight)
      slotYs.push(y)
    }

    const res: StickerItem[] = []
    urls.forEach((url, i) => {
      const width = patternWidths[i % patternWidths.length]
      const rotate = patternRot[i % patternRot.length]
      const leftSide = isMobile ? (i % 2 === 0) : (i % 2 === 0)
      const x = leftSide ? margin : Math.max(margin, box.w - width - margin)
      let y = slotYs[i % slotYs.length] - width / 2

      // 상단 안전영역
      if (y < safeTopHeight) {
        y = safeTopHeight
      }

      // 하단 안전영역 침범 방지
      if (y + width > box.h - safeBottomHeight) {
        y = Math.max(0, box.h - safeBottomHeight - width - margin)
      }

      // 좌측 콘텐츠 폭 영역은 가능한 피하기 (데스크톱만 적용)
      if (!isMobile && leftSide && x < safeLeftWidth) {
        // 좌측 가장자리에 붙이되, y만 유지
      }

      const peelDirection = 0
      res.push({ url, width, rotate, x, y, peelDirection })
    })

    return res
  }, [box.w, box.h, urls])

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 overflow-visible z-[250]">
      {items.map((it, idx) => (
        <div key={`${it.url}-${idx}`} className="absolute" style={{ left: 0, top: 0 }}>
          <StickerPeel
            imageSrc={it.url}
            width={it.width}
            rotate={it.rotate}
            peelBackHoverPct={20}
            peelBackActivePct={40}
            shadowIntensity={0.6}
            lightingIntensity={0.12}
            initialPosition={{ x: it.x, y: it.y }}
            peelDirection={it.peelDirection}
            className="pointer-events-auto z-[251]"
            onAnyDragStart={() => { if (!nudgeGone) { setNudgeGone(true); try { localStorage.setItem('stickerNudgeDismissed','1') } catch {} } }}
            showNudge={!nudgeGone && idx === (nudgeIdx % Math.max(1, items.length))}
            nudgeText="끌어서 이동"
          />
        </div>
      ))}
    </div>
  )
}

/* ───────────────────── utils ───────────────────── */

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}
