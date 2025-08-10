import React, { useLayoutEffect, useRef, useCallback } from 'react'

type ScrollStackItemProps = {
  children?: React.ReactNode
  itemClassName?: string
}
export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({
  children,
  itemClassName = '',
}) => (
  <div
    className={[
      'scroll-stack-card',
      'absolute left-0 right-0 top-0',
      'rounded-[32px] p-6 md:p-8',
      'shadow-[0_0_30px_rgba(0,0,0,0.1)]',
      'box-border will-change-transform',
      itemClassName,
    ].join(' ')}
    style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d' }}
  >
    {children}
  </div>
)

type ScrollStackProps = {
  /** 타이틀 바로 아래 sticky 위치(px). Home에서 타이틀 하단값을 넘깁니다. */
  pinTopPx: number
  /** 카드 한 장 높이(px) = 타이틀 제외 화면 높이 */
  viewportHeight: number
  /** 포개진 뒤 카드 간 최종 간격(px) */
  stackGap?: number
  /** 카드 하나가 포개되는 데 필요한 ‘가상’ 스크롤 길이(px) */
  perCardScroll?: number
  /** 스케일 감도 */
  baseScale?: number
  itemScale?: number
  /** 살짝 회전(원치 않으면 0) */
  rotationAmount?: number
  className?: string
  children: React.ReactNode
  /** 모든 카드가 포개짐 완료 시 한 번 호출 */
  onStackComplete?: () => void
}

function clamp01(x: number) { return x < 0 ? 0 : x > 1 ? 1 : x }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

const ScrollStack: React.FC<ScrollStackProps> = ({
  pinTopPx,
  viewportHeight,
  stackGap = 32,
  perCardScroll,
  baseScale = 0.92,
  itemScale = 0.035,
  rotationAmount = 0,
  className = '',
  children,
  onStackComplete,
}) => {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])

  // 잠금/가상 스크롤 상태
  const lockedRef = useRef(false)
  const lockYRef = useRef(0)
  const vLocalRef = useRef(0)
  const minLocalRef = useRef(0)
  const touchStartYRef = useRef(0)

  // 완료 콜백 1회 호출 보장
  const firedRef = useRef(false)
  const fireCompleteOnce = useCallback(() => {
    if (!firedRef.current) {
      firedRef.current = true
      onStackComplete?.()
    }
  }, [onStackComplete])

  const count = React.Children.count(children)
  const step = perCardScroll ?? Math.max(0.6 * viewportHeight, 360)
  const lastAssemble = (count - 1) * step
  const tail = Math.max(0.4 * viewportHeight, 320) // sticky 해제 후 자연스러운 스크롤 여유
  const sectionHeight = count * step + viewportHeight + tail

  // 카드 변환 적용 (local: 섹션 내 진행도 px)
  const applyAt = useCallback((local: number) => {
    const L = Math.max(minLocalRef.current, Math.max(0, Math.min(local, lastAssemble)))
    cardsRef.current.forEach((card, i) => {
      const start = i * step
      const end = (i + 1) * step
      const t = clamp01((L - start) / (end - start))

      const startY = i === 0 ? 0 : viewportHeight + i * 60
      const endY = i * stackGap
      const y = Math.round(lerp(startY, endY, t))

      const s0 = 1
      const s1 = baseScale + i * itemScale
      const s = Math.round(lerp(s0, s1, t) * 1000) / 1000

      const r = Math.round((rotationAmount ? rotationAmount * i * t : 0) * 100) / 100

      card.style.transform = `translate3d(0, ${y}px, 0) scale(${s}) rotate(${r}deg)`
    })
  }, [baseScale, itemScale, rotationAmount, stackGap, step, viewportHeight, lastAssemble])

  // 잠금 모드에서 휠/터치로 가상 진행도만 업데이트
  const updateVirtual = useCallback((delta: number) => {
    vLocalRef.current = Math.max(0, Math.min(vLocalRef.current + delta, lastAssemble))
    applyAt(vLocalRef.current)

    // 조립 완료 → 잠금 해제 + 콜백 1회 호출
    if (vLocalRef.current >= lastAssemble && delta > 0) {
      fireCompleteOnce()
      lockedRef.current = false
      minLocalRef.current = lastAssemble
      window.scrollTo({ top: lockYRef.current + 1 })
      removeLockListeners()
    }
  }, [applyAt, lastAssemble, fireCompleteOnce])

  const onWheelLock = useCallback((e: WheelEvent) => {
    e.preventDefault()
    updateVirtual(e.deltaY)
  }, [updateVirtual])

  const onTouchStartLock = useCallback((e: TouchEvent) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? 0
  }, [])

  const onTouchMoveLock = useCallback((e: TouchEvent) => {
    const y = e.touches[0]?.clientY ?? 0
    const dy = (touchStartYRef.current || 0) - y
    if (Math.abs(dy) > 0) {
      e.preventDefault()
      updateVirtual(dy)
    }
  }, [updateVirtual])

  const addLockListeners = useCallback(() => {
    window.addEventListener('wheel', onWheelLock, { passive: false } as any)
    window.addEventListener('touchstart', onTouchStartLock, { passive: true } as any)
    window.addEventListener('touchmove', onTouchMoveLock, { passive: false } as any)
  }, [onWheelLock, onTouchStartLock, onTouchMoveLock])

  const removeLockListeners = useCallback(() => {
    window.removeEventListener('wheel', onWheelLock as any)
    window.removeEventListener('touchstart', onTouchStartLock as any)
    window.removeEventListener('touchmove', onTouchMoveLock as any)
  }, [onWheelLock, onTouchStartLock, onTouchMoveLock])

  const onScroll = useCallback(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    if (!section || !stage) return

    // 잠금 상태면 window 스크롤을 고정 유지 + 가상 진행만 적용
    if (lockedRef.current) {
      window.scrollTo({ top: lockYRef.current })
      applyAt(vLocalRef.current)
      return
    }

    // 섹션 내 실제 진행도(local) 계산
    const sectionTop = section.getBoundingClientRect().top + window.scrollY
    const local = window.scrollY - sectionTop

    // sticky 진입 여부: stage가 pinTopPx에 달라붙는 순간 잠금 시작
    const rect = stage.getBoundingClientRect()
    const isPinned = Math.abs(rect.top - pinTopPx) <= 0.5

    // 아직 조립 완료 전이라면 잠금 모드 진입
    if (isPinned && minLocalRef.current < lastAssemble) {
      lockedRef.current = true
      lockYRef.current = window.scrollY
      vLocalRef.current = Math.max(minLocalRef.current, Math.max(0, Math.min(local, lastAssemble)))
      applyAt(vLocalRef.current)
      addLockListeners()
      return
    }

    // 잠금이 아니면 실제 스크롤에 맞춰 적용(단, 조립 완료 후 되돌림 방지)
    applyAt(local)

    // 잠금 모드가 아니더라도 실제 스크롤로 마지막 지점에 도달했으면 콜백 1회 호출
    if (local >= lastAssemble) {
      minLocalRef.current = lastAssemble
      fireCompleteOnce()
    }
  }, [applyAt, pinTopPx, addLockListeners, lastAssemble, fireCompleteOnce])

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    // 카드 수집 + 초기 스타일
    cardsRef.current = Array.from(stage.querySelectorAll<HTMLDivElement>('.scroll-stack-card'))
    cardsRef.current.forEach((el, i) => {
      el.style.position = 'absolute'
      el.style.top = '0'
      el.style.left = '0'
      el.style.right = '0'
      el.style.height = `${viewportHeight}px`
      el.style.zIndex = String(1000 + i)
      el.style.transformOrigin = 'top center'
      el.style.transform = 'translate3d(0,0,0)'
    })

    const onResize = () => onScroll()
    // 초기 프레임
    firedRef.current = false
    applyAt(0)
    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true } as any)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize as any)
      removeLockListeners()
      cardsRef.current = []
    }
  }, [viewportHeight, onScroll, applyAt, removeLockListeners])

  return (
    <section
      ref={sectionRef}
      className={['relative w-full', className].join(' ')}
      style={{ height: `${sectionHeight}px` }}
    >
      {/* 타이틀 아래에 고정되는 sticky 무대 */}
      <div
        ref={stageRef}
        className="sticky overflow-hidden rounded-[32px]"
        style={{ top: `${pinTopPx}px`, height: `${viewportHeight}px` }}
      >
        <div className="relative w-full h-full">
          {children}
        </div>
      </div>
    </section>
  )
}

export default ScrollStack
