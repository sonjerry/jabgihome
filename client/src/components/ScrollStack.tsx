// client/src/components/ScrollStack.tsx
import React, { useLayoutEffect, useRef, useCallback, useEffect } from 'react'
import Lenis from 'lenis'

type TransformState = {
  translateY: number
  scale: number
  rotation: number
  blur: number
}

type ScrollStackItemProps = {
  children: React.ReactNode
  itemClassName?: string
  /** 카드 높이 커스터마이징하려면 Tailwind로 넘기세요 (예: h-96). 기본은 h-80. */
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({
  children,
  itemClassName = '',
}) => (
  <div
    className={[
      'scroll-stack-card relative',
      'h-[35rem]',   // 세로 약 120px (글씨 높이와 비슷)
      'w-[100%]',      // 가로 폭 넓게 (전체의 90%)
      'my-8',
      'p-8',
      'rounded-[24px]',
      'shadow-[0_0_30px_rgba(0,0,0,0.1)]',
      'box-border origin-top will-change-transform',
      itemClassName,
    ].join(' ')}
    style={{
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d',
    }}
  >
    {children}
  </div>
)

type ScrollStackProps = {
  children: React.ReactNode
  className?: string
  /** 카드 사이 간격(px, margin-bottom) */
  itemDistance?: number
  /** 카드마다 추가되는 축소 스케일량(작을수록 덜 줄어듦) */
  itemScale?: number
  /** 스택 위로 포개질 때 카드 간 간격(px) */
  itemStackDistance?: number
  /** 스택이 고정(pinned)되는 기준 위치(px 또는 '%') */
  stackPosition?: number | string
  /** 스케일 변화가 끝나는 기준 위치(px 또는 '%') */
  scaleEndPosition?: number | string
  /** 기본 스케일(스택 진입 전) */
  baseScale?: number
  /** 카드 회전(각도, 카드 index * rotationAmount * progress) */
  rotationAmount?: number
  /** 스택 뒤쪽 카드 블러 강도(px 단위/단계) */
  blurAmount?: number
  /** 마지막 카드가 뷰포트 내 핀 상태에 들어오면 1회 호출 */
  onStackComplete?: () => void
}

const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = '20%',
  scaleEndPosition = '10%',
  baseScale = 0.85,
  rotationAmount = 0,
  blurAmount = 0,
  onStackComplete,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const stackCompletedRef = useRef(false)
  const animationFrameRef = useRef<number | null>(null)
  const lenisRef = useRef<InstanceType<typeof Lenis> | null>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])
  const lastTransformsRef = useRef<Map<number, TransformState>>(new Map())
  const isUpdatingRef = useRef(false)

  const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
    if (scrollTop < start) return 0
    if (scrollTop > end) return 1
    return (scrollTop - start) / (end - start)
  }, [])

  const parsePercentage = useCallback((value: number | string, containerHeight: number) => {
    if (typeof value === 'string' && value.includes('%')) {
      const n = parseFloat(value)
      return (n / 100) * containerHeight
    }
    return Number(value)
  }, [])

  const updateCardTransforms = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller || !cardsRef.current.length || isUpdatingRef.current) return

    isUpdatingRef.current = true

    const scrollTop = scroller.scrollTop
    const containerHeight = scroller.clientHeight
    const stackPositionPx = parsePercentage(stackPosition, containerHeight)
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight)
    const endElement = scroller.querySelector('.scroll-stack-end') as HTMLElement | null
    const endElementTop = endElement ? endElement.offsetTop : 0

    cardsRef.current.forEach((card, i) => {
      const cardTop = card.offsetTop
      const triggerStart = cardTop - stackPositionPx - itemStackDistance * i
      const triggerEnd = cardTop - scaleEndPositionPx
      const pinStart = cardTop - stackPositionPx - itemStackDistance * i
      const pinEnd = endElementTop - containerHeight / 2

      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd)
      const targetScale = baseScale + i * itemScale
      const scale = 1 - scaleProgress * (1 - targetScale)
      const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0

      // Blur: 현재 가장 위 카드(topCardIndex)보다 뒤에 있는 카드에만 블러
      let blur = 0
      if (blurAmount) {
        let topCardIndex = 0
        for (let j = 0; j < cardsRef.current.length; j++) {
          const jCard = cardsRef.current[j]
          const jCardTop = jCard.offsetTop
          const jTriggerStart = jCardTop - stackPositionPx - itemStackDistance * j
          if (scrollTop >= jTriggerStart) {
            topCardIndex = j
          }
        }
        if (i < topCardIndex) {
          const depthInStack = topCardIndex - i
          blur = Math.max(0, depthInStack * blurAmount)
        }
      }

      let translateY = 0
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd

      if (isPinned) {
        translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * i
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * i
      }

      const newTransform: TransformState = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100,
      }

      const lastTransform = lastTransformsRef.current.get(i)
      const hasChanged =
        !lastTransform ||
        Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
        Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
        Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1 ||
        Math.abs(lastTransform.blur - newTransform.blur) > 0.1

      if (hasChanged) {
        const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`
        const filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : ''
        card.style.transform = transform
        card.style.filter = filter
        lastTransformsRef.current.set(i, newTransform)
      }

      // 마지막 카드가 뷰포트 내에 핀 상태로 들어오면 onStackComplete 1회 호출
      if (i === cardsRef.current.length - 1) {
        const isInView = scrollTop >= pinStart && scrollTop <= pinEnd
        if (isInView && !stackCompletedRef.current) {
          stackCompletedRef.current = true
          onStackComplete?.()
        } else if (!isInView && stackCompletedRef.current) {
          stackCompletedRef.current = false
        }
      }
    })

    isUpdatingRef.current = false
  }, [
    baseScale,
    blurAmount,
    calculateProgress,
    itemScale,
    itemStackDistance,
    onStackComplete,
    parsePercentage,
    rotationAmount,
    scaleEndPosition,
    stackPosition,
  ])

  const handleScroll = useCallback(() => {
    // Lenis의 scroll 이벤트에서 호출됨
    updateCardTransforms()
  }, [updateCardTransforms])

  const setupLenis = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return null

    const content = scroller.querySelector('.scroll-stack-inner') as HTMLElement | null
    if (!content) return null

    const lenis = new Lenis({
      wrapper: scroller,
      content,
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      syncTouch: true,
    } as any) // lenis 타입 선언이 프로젝트 버전에 따라 달라서 안전하게 any 캐스팅

    lenis.on('scroll', handleScroll)

    const raf = (time: number) => {
      lenis.raf(time)
      animationFrameRef.current = requestAnimationFrame(raf)
    }
    animationFrameRef.current = requestAnimationFrame(raf)

    lenisRef.current = lenis
    return lenis
  }, [handleScroll])

  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    // 카드 노드 수집 + 초기 스타일
    const cards = Array.from(
      scroller.querySelectorAll<HTMLDivElement>('.scroll-stack-card')
    )
    cardsRef.current = cards
    const transformsCache = lastTransformsRef.current

    cards.forEach((card, i) => {
      if (i < cards.length - 1) {
        card.style.marginBottom = `${itemDistance}px`
      }
      card.style.willChange = 'transform, filter'
      card.style.transformOrigin = 'top center'
      card.style.transform = 'translateZ(0)'
      card.style.perspective = '1000px'
    })

    const lenis = setupLenis()
    // 첫 프레임 업데이트
    updateCardTransforms()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (lenisRef.current) {
        // 이벤트 해제 및 파괴
        try {
          lenisRef.current.off('scroll', handleScroll as any)
        } catch {}
        lenisRef.current.destroy()
        lenisRef.current = null
      }
      stackCompletedRef.current = false
      cardsRef.current = []
      transformsCache.clear()
      isUpdatingRef.current = false
    }
  }, [
    itemDistance,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    onStackComplete,
    setupLenis,
    updateCardTransforms,
  ])

  // 혹시 Lenis가 실패했을 때 기본 스크롤 이벤트로도 업데이트 (폴백)
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const onScroll = () => updateCardTransforms()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [updateCardTransforms])

  return (
    <div
      className={['relative w-full h-full overflow-y-auto overflow-x-visible', 
        'scrollbar-none',
        className,
    ].join(' ').trim()}
      ref={scrollerRef}
      style={{
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
        transform: 'translateZ(0)',
        willChange: 'scroll-position',
      }}
    >
      <div className="scroll-stack-inner pt-[20vh] px-20 pb-[50rem] min-h-screen">
        {children}
        {/* Spacer so the last pin can release cleanly */}
        <div className="scroll-stack-end w-full h-px" />
      </div>
    </div>
  )
}

export default ScrollStack
