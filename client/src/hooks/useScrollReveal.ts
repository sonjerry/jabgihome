// client/src/hooks/useScrollReveal.ts
import { useState, useEffect, useRef } from 'react'

/**
 * 스크롤 기반 reveal 상태 관리 훅
 * 네비바와는 독립적으로 카드 애니메이션만을 위한 훅
 */
export function useScrollReveal(threshold = 10) {
  const [reveal, setReveal] = useState(0)
  const revealRef = useRef(0)
  const targetRef = useRef(0)

  useEffect(() => {
    let rafId: number

    const handleScroll = () => {
      const y = window.scrollY
      // 0~threshold 구간에서 0→1로 선형 증가, 이후 1 고정
      const t = Math.max(0, Math.min(1, y / threshold))
      targetRef.current = t
    }

    const animate = () => {
      const current = revealRef.current
      const target = targetRef.current
      const next = current + (target - current) * 0.2
      if (Math.abs(next - current) > 0.001) {
        revealRef.current = next
        setReveal(next)
      }
      rafId = requestAnimationFrame(animate)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [threshold])

  return reveal
}
