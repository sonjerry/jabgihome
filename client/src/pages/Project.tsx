import { useEffect, useLayoutEffect, useRef, useState } from "react"
import GlassCard from "../components/GlassCard"
import ScrollStack, { ScrollStackItem } from "../components/ScrollStack"

type Project = { title: string; subtitle?: string; body?: string }

const PROJECT_CARDS: Project[] = [
  { title: "블로그 리뉴얼", subtitle: "Vite · React · Render", body: "정적 에셋 파이프라인 정비 및 CORS 안정화." },
  { title: "갤러리 시스템", subtitle: "Lazy/Virtual List", body: "이미지 프리로드와 라이트박스 접근성 개선." },
  { title: "오디오 Dock", subtitle: "import.meta.glob()", body: "MP3 자동 수집과 재생 상태 동기화." },
  { title: "ScrollStack 실험", subtitle: "Lenis", body: "카드 스택 스크롤 인터랙션." },
]

export default function Projects() {
  const headerRef = useRef<HTMLDivElement | null>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const scrollSectionRef = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const h = headerRef.current?.getBoundingClientRect().height ?? 0
      setHeaderHeight(h)
    }
    measure()
    window.addEventListener("resize", measure, { passive: true })
    return () => window.removeEventListener("resize", measure)
  }, [])

  // 가시 카드에만 will-change
  const cardRefs = useRef<HTMLDivElement[]>([])
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          const el = e.target as HTMLElement
          el.style.willChange = e.isIntersecting ? "transform" : "auto"
        }
      },
      { root: scrollSectionRef.current ?? null, rootMargin: "200px 0px", threshold: 0.01 },
    )
    cardRefs.current.forEach(el => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* 내부 스크롤 섹션 */}
      <section
        ref={scrollSectionRef}
        data-lenis-prevent
        className="
          absolute inset-x-0 bottom-0 top-6
          px-2 sm:px-4 md:px-8
          z-0 overflow-y-auto overscroll-contain
        "
      >
        {/* 헤더 */}
        <div ref={headerRef}>
          <GlassCard className="mb-6">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">프로젝트</h1>
            <p className="text-sm md:text-base opacity-80 mt-2">진행 중인 작업을 정리합니다.</p>
          </GlassCard>
        </div>

        {/* 스택 */}
        <ScrollStack
          className="pb-16">
          {PROJECT_CARDS.map((p, i) => (
            <ScrollStackItem
              key={p.title}
              
              itemClassName="
                h-[22rem] md:h-[28rem]
                p-6 sm:p-8 md:p-12
                bg-white/10 sm:backdrop-blur
                border border-white/10
                shadow-sm md:shadow-xl
                text-white text-[15px] md:text-lg
                hover:md:scale-[1.01] transition-transform
              "
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">{p.title}</h2>
                  {p.subtitle && <p className="mt-1 opacity-80">{p.subtitle}</p>}
                </div>
                {p.body && <p className="opacity-90">{p.body}</p>}
              </div>
            </ScrollStackItem>
          ))}
        </ScrollStack>
      </section>
    </main>
  )
}
