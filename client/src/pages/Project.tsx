// client/src/pages/Projects.tsx
import { useRef, useLayoutEffect, useState } from 'react'
import GlassCard from '../components/GlassCard'
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack'

type Project = {
  title: string
  subtitle?: string
  body?: string
}

const PROJECT_CARDS: Project[] = [
  { title: 'React 블로그', subtitle: 'Vite · React · Render', body: '본 홈페이지를 만드는 프로젝트' },
  { title: 'Openai 튜링 테스트', subtitle: 'Openapi · js', body: 'gpt5를 이용하여 사람과 구별할 수 없는 채팅봇' },
  { title: '심레이싱 RC카', subtitle: 'Raspberry pi · Embedded · WebRTC ', body: '심레이싱 장비로 조종하는 RC카 (알리에서 부품 공수)' },
  { title: 'ScrollStack 실험', subtitle: 'Lenis', body: '카드 스택 스크롤 인터랙션.' },
  { title: 'ScrollStack 실험', subtitle: 'Lenis', body: '카드 스택 스크롤 인터랙션.' },
  { title: 'ScrollStack 실험', subtitle: 'Lenis', body: '카드 스택 스크롤 인터랙션.' },
]

export default function Projects() {
  const headerRef = useRef<HTMLDivElement | null>(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useLayoutEffect(() => {
    const measure = () => {
      const h = headerRef.current?.getBoundingClientRect().height ?? 0
      setHeaderHeight(h)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* 스크롤 영역 */}
      <section
        className="
          absolute inset-x-0 bottom-0 top-6
          px-3 md:px-8 lg:px-12
          z-0 overflow-y-auto
        "
      >
        {/* 헤더 카드 */}
        <div ref={headerRef}>
          <GlassCard className="mb-6">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">프로젝트</h1>
            <p className="text-sm md:text-base text-white/70 mt-4">요즘 내가 하고있는 것들</p>
          </GlassCard>
        </div>

        {/* 헤더 높이만큼 여백을 살짝 추가해 스택이 겹치지 않게 함 */}
        <div style={{ height: Math.max(8, Math.floor(headerHeight * 0.05)) }} />

        {/* ScrollStack */}
        <ScrollStack className="max-w-10xl mx-auto">
          {PROJECT_CARDS.map((p, i) => (
            <ScrollStackItem
              key={i}
                itemClassName="
                  w-[95%] sm:w-[95%] md:w-[95%]  /* 화면 크기에 따라 가로폭 확장 */
                  h-96 md:h-[28rem]
                  p-10 md:p-16
                  bg-white/10 backdrop-blur
                  border border-white/10
                  text-white text-lg md:text-xl
                  mx-auto                         /* 가운데 정렬 */
                  hover:scale-[1.01] transition-transform
                "

            >
              <h2 className="text-4xl md:text-4xl font-bold">{p.title}</h2>
              {p.subtitle && <p className="mt-2 text-white/60">{p.subtitle}</p>}
              {p.body && <p className="mt-4 text-white/80 leading-relaxed">{p.body}</p>}
            </ScrollStackItem>
          ))}
        </ScrollStack>

        {/* 바닥 여백 */}
        <div className="h-20" />
      </section>
    </main>
  )
}
