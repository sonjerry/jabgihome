import { useLayoutEffect, useRef, useState } from 'react'
import PageShell from '../components/PageShell'
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack'

type Project = {
  title: string
  desc: string
  href?: string
  tags?: string[]
  image?: string
}

const PROJECTS: Project[] = [
  {
    title: '심레이싱 조종 RC카',
    desc: '라즈베리파이 기반,',
    href: 'https://leegaeulblog.onrender.com',
    
  },
  {
    title: 'openapi 튜링 테스트',
    desc: '사람과 ai를 구별할 수 있을까요',
   
  },
  {
    title: '3',
    desc: '3번',
    
  },
]

export default function Projects() {
  const headerRef = useRef<HTMLDivElement | null>(null)
  const [pinTopPx, setPinTopPx] = useState(112)      // 타이틀 바로 아래 고정점
  const [vh, setVh] = useState(640)                  // 카드 높이(=뷰포트 내 가용 높이)

  useLayoutEffect(() => {
    const measure = () => {
      const topPad = 96 /* pt-24 */
      const h = headerRef.current?.getBoundingClientRect().height ?? 0
      const pin = Math.round(topPad + h + 16)         // 타이틀과 약간 간격
      const usable = Math.max(360, window.innerHeight - pin - 16)
      setPinTopPx(pin)
      setVh(usable)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <PageShell>
      <main className="pt-24 mx-auto w-full max-w-[1400px] px-3 md:px-6">
        {/* 타이틀 */}
        <div ref={headerRef} className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold">프로젝트</h1>
          <p className="text-sm text-cream/70 mt-1">개인 토이 프로젝트들</p>
        </div>

        {/* 모바일: 단순 리스트 */}
        <section className="md:hidden space-y-3">
          {PROJECTS.map((p, i) => (
            <article key={i} className="glass rounded-2xl p-4">
              <h2 className="text-lg font-semibold">{p.title}</h2>
              <p className="text-sm text-cream/80 mt-1">{p.desc}</p>
              {p.tags?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-white/10">#{t}</span>
                  ))}
                </div>
              ) : null}
              {p.href ? (
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm underline decoration-dotted"
                >
                  열기
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              ) : (
                <span className="mt-3 inline-block text-xs opacity-60">링크 준비 중</span>
              )}
            </article>
          ))}
        </section>

        {/* 데스크톱: ScrollStack */}
        <section className="hidden md:block">
          <ScrollStack
            pinTopPx={pinTopPx}
            viewportHeight={vh}
            stackGap={24}
            perCardScroll={Math.max(0.6 * vh, 360)}
            baseScale={0.92}
            itemScale={0.04}
            rotationAmount={0.4}
          >
            {PROJECTS.map((p, i) => (
              <ScrollStackItem key={i} itemClassName="glass">
                <div className="h-full w-full grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {/* 텍스트 */}
                  <div className="lg:col-span-3 flex flex-col h-full">
                    <h2 className="text-xl md:text-2xl font-semibold">{p.title}</h2>
                    <p className="text-sm md:text-base text-cream/80 mt-2 flex-1">{p.desc}</p>
                    {p.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.tags.map((t) => (
                          <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-white/10">#{t}</span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4">
                      {p.href ? (
                        <a
                          href={p.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm underline decoration-dotted"
                        >
                          열기
                          <svg width="14" height="14" viewBox="0 0 24 24">
                            <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </a>
                      ) : (
                        <span className="text-xs opacity-60">링크 준비 중</span>
                      )}
                    </div>
                  </div>

                  {/* 이미지/프리뷰 */}
                  <div className="lg:col-span-2">
                    <div className="h-full w-full rounded-2xl overflow-hidden bg-white/5">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={`${p.title} preview`}
                          className="block w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full grid place-items-center">
                          <span className="text-6xl">🧩</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </section>
      </main>
    </PageShell>
  )
}
