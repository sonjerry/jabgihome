import { useEffect, useMemo, useRef, useState } from 'react'
import StickerPeel from './StickerPeel'

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

  // 1) src/assets/sticker/*.png 자동 수집 (빌드타임)
  const urls = useMemo(() => {
    const mods = import.meta.glob('../assets/sticker/*.png', { eager: true, query: '?url', import: 'default' })
    return Object.values(mods) as string[]
  }, [])

  // 2) 컨테이너 사이즈 추적 (좌/우 x 계산, y 범위용)
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

  // 3) 랜덤 배치 파라미터
  const margin = 8
  const minW = 140
  const maxW = 260
  const rotMin = -12
  const rotMax = 12

  const items: StickerItem[] = useMemo(() => {
    if (!box.h || urls.length === 0) return []

    // 좌/우 번갈아 + 약간 랜덤
    const res: StickerItem[] = []
    urls.forEach((url, i) => {
      const width = rand(minW, maxW)
      const leftSide = (i % 2 === 0) === (Math.random() < 0.6) // 좌우 균형 + 가벼운 랜덤성
      const x = leftSide ? margin : Math.max(margin, box.w - width - margin)
      const y = clamp(rand(0, box.h - width), 0, Math.max(0, box.h - Math.min(maxW, box.h)))
      const rotate = rand(rotMin, rotMax)
      const peelDirection = leftSide ? 0 : 0 // 필요 시 좌/우에 따라 각도 줄 수 있음

      res.push({ url, width, rotate, x, y, peelDirection })
    })

    // 가까운 y끼리 간단한 간격 벌리기
    res.sort((a, b) => a.y - b.y)
    for (let i = 1; i < res.length; i++) {
      const prev = res[i - 1]
      const cur = res[i]
      if (Math.abs(cur.y - prev.y) < 56) {
        cur.y = clamp(prev.y + 64, 0, Math.max(0, box.h - cur.width))
      }
    }

    return res
  }, [box.w, box.h, urls])

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-visible z-[2000]">
      {items.map((it, idx) => (
        <StickerPeel
          key={`${it.url}-${idx}`}
          imageSrc={it.url}
          width={it.width}
          rotate={it.rotate}
          peelBackHoverPct={20}
          peelBackActivePct={40}
          shadowIntensity={0.6}
          lightingIntensity={0.12}
          initialPosition={{ x: it.x, y: it.y }}
          peelDirection={it.peelDirection}
          className="pointer-events-auto z-[2100]"
        />
      ))}
    </div>
  )
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}
