import { useRef, useEffect, useMemo } from 'react'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import './StickerPeel.css'

gsap.registerPlugin(Draggable)

type Pos = { x: number; y: number } | 'center'

type Props = {
  imageSrc: string
  rotate?: number
  peelBackHoverPct?: number
  peelBackActivePct?: number
  peelEasing?: string
  peelHoverEasing?: string
  width?: number
  shadowIntensity?: number
  lightingIntensity?: number
  initialPosition?: Pos
  peelDirection?: number
  className?: string
}

export default function StickerPeel({
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
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragTargetRef = useRef<HTMLDivElement | null>(null)
  const pointLightRef = useRef<SVGFEPointLightElement | null>(null)
  const pointLightFlippedRef = useRef<SVGFEPointLightElement | null>(null)
  const defaultPadding = 10

  // 초기 위치
  useEffect(() => {
    const target = dragTargetRef.current
    if (!target) return

    if (initialPosition === 'center') return
    if (typeof initialPosition === 'object') {
      const { x, y } = initialPosition
      gsap.set(target, { x, y })
    }
  }, [initialPosition])

  // 드래그
  useEffect(() => {
    const target = dragTargetRef.current
    if (!target) return
    const boundsEl = target.parentElement as HTMLElement

    const draggable = Draggable.create(target, {
      type: 'x,y',
      bounds: boundsEl,
      inertia: true,
      onDrag() {
        const rot = gsap.utils.clamp(-24, 24, this.deltaX * 0.4)
        gsap.to(target, { rotation: rot, duration: 0.15, ease: 'power1.out' })
      },
      onDragEnd() {
        gsap.to(target, { rotation: 0, duration: 0.8, ease: 'power2.out' })
      },
    })[0]

    const handleResize = () => {
      draggable.update()
      const currentX = Number(gsap.getProperty(target, 'x'))
      const currentY = Number(gsap.getProperty(target, 'y'))
      const b = boundsEl.getBoundingClientRect()
      const t = target.getBoundingClientRect()
      const maxX = b.width - t.width
      const maxY = b.height - t.height
      const newX = Math.max(0, Math.min(currentX, maxX))
      const newY = Math.max(0, Math.min(currentY, maxY))
      if (newX !== currentX || newY !== currentY) {
        gsap.to(target, { x: newX, y: newY, duration: 0.3, ease: 'power2.out' })
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      draggable.kill()
    }
  }, [])

  // 마우스 포인트 라이트
  useEffect(() => {
    const updateLight = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      gsap.set(pointLightRef.current, { attr: { x, y } })
      const normalized = Math.abs((peelDirection % 360))
      if (normalized !== 180) {
        gsap.set(pointLightFlippedRef.current, { attr: { x, y: rect.height - y } })
      } else {
        gsap.set(pointLightFlippedRef.current, { attr: { x: -1000, y: -1000 } })
      }
    }
    const el = containerRef.current
    if (!el) return
    el.addEventListener('mousemove', updateLight)
    return () => el.removeEventListener('mousemove', updateLight)
  }, [peelDirection])

  // 터치 상태 클래스
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onStart = () => el.classList.add('touch-active')
    const onEnd = () => el.classList.remove('touch-active')
    el.addEventListener('touchstart', onStart)
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  const cssVars = useMemo(() => ({
    ['--sticker-rotate' as any]: `${rotate}deg`,
    ['--sticker-p' as any]: `${defaultPadding}px`,
    ['--sticker-peelback-hover' as any]: `${peelBackHoverPct}%`,
    ['--sticker-peelback-active' as any]: `${peelBackActivePct}%`,
    ['--sticker-peel-easing' as any]: peelEasing,
    ['--sticker-peel-hover-easing' as any]: peelHoverEasing,
    ['--sticker-width' as any]: `${width}px`,
    ['--sticker-shadow-opacity' as any]: shadowIntensity,
    ['--sticker-lighting-constant' as any]: lightingIntensity,
    ['--peel-direction' as any]: `${peelDirection}deg`,
  }), [
    rotate, peelBackHoverPct, peelBackActivePct, peelEasing, peelHoverEasing,
    width, shadowIntensity, lightingIntensity, peelDirection
  ])

  return (
    <div className={`draggable ${className}`} ref={dragTargetRef} style={cssVars as React.CSSProperties}>
      <svg width="0" height="0">
        <defs>
          <filter id="pointLight">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feSpecularLighting result="spec" in="blur" specularExponent="100"
              specularConstant={lightingIntensity} lightingColor="white">
              <fePointLight ref={pointLightRef as any} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>

          <filter id="pointLightFlipped">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feSpecularLighting result="spec" in="blur" specularExponent="100"
              specularConstant={lightingIntensity * 7} lightingColor="white">
              <fePointLight ref={pointLightFlippedRef as any} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>

          <filter id="dropShadow">
            <feDropShadow dx="2" dy="4" stdDeviation={3 * shadowIntensity}
              floodColor="black" floodOpacity={shadowIntensity} />
          </filter>

          <filter id="expandAndFill">
            <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
            <feFlood floodColor="rgb(179,179,179)" result="flood" />
            <feComposite operator="in" in="flood" in2="shape" />
          </filter>
        </defs>
      </svg>

      <div className="sticker-container" ref={containerRef}>
        <div className="sticker-main">
          <div className="sticker-lighting">
            <img
              src={imageSrc}
              alt=""
              className="sticker-image"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>

        <div className="flap">
          <div className="flap-lighting">
            <img
              src={imageSrc}
              alt=""
              className="flap-image"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
