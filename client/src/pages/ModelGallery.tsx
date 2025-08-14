// client/src/pages/ModelGallery.tsx
import { useMemo, useState, useEffect } from 'react'
import GlassCard from '../components/GlassCard'
import ModelViewer from '../components/ModelViewer'

type ModelItem = {
  title: string
  url: string
  category: string
}

/* ── 폴더의 모델(.glb/.gltf) 자동 수집 ───────────────────── */
const MODEL_FILES = import.meta.glob('../assets/models/**/*.{glb,gltf}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/* ── utils ──────────────────────────────────────────────── */
function filenameToTitle(p: string) {
  const base = decodeURIComponent(p.split('/').pop() || '')
  const name = base.replace(/\.[^/.]+$/, '')
  return name.replace(/[_-]+/g, ' ').trim()
}
function pathToCategory(p: string) {
  const marker = '/models/'
  const i = p.indexOf(marker)
  if (i === -1) return '미분류'
  const rest = p.slice(i + marker.length)
  const first = rest.split('/')[0]
  return first && !first.includes('.') ? first : '미분류'
}

export default function ModelGallery() {
  const allModels: ModelItem[] = useMemo(
    () =>
      Object.entries(MODEL_FILES)
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([p, url]) => ({
          title: filenameToTitle(p),
          url,
          category: pathToCategory(p),
        })),
    []
  )

  const categories = useMemo(() => {
    const s = new Set<string>()
    for (const m of allModels) s.add(m.category)
    return ['전체', ...Array.from(s).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))]
  }, [allModels])

  const byCategory = useMemo(() => {
    const map = new Map<string, ModelItem[]>()
    for (const c of categories) map.set(c, [])
    for (const m of allModels) map.get(m.category)?.push(m)
    map.set('전체', allModels)
    return map
  }, [allModels, categories])

  const [cat, setCat] = useState<string>(categories[0] ?? '전체')
  const visible = byCategory.get(cat) ?? []

  // 카테고리 바뀌면 상단으로 스크롤
  useEffect(() => {
    const el = document.querySelector('main')
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' })
  }, [cat])

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* 캔버스 배경 투명화 (글래스카드와 자연스레 어울리게) */}
      <style>{`.glass-viewer canvas{background:transparent!important}`}</style>

      <section className="absolute inset-x-0 bottom-0 top-6 px-3 md:px-8 lg:px-12 z-0 overflow-y-auto">
        {/* 헤더 */}
        <GlassCard className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">3D 모델 갤러리</h1>
          <p className="text-sm md:text-base text-white/70 mt-4">
            사진을 기반으로 생성한 3D 모델
          </p>
        </GlassCard>

        {/* 태그(카테고리) 버튼 */}
        <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
          {categories.map(c => {
            const count = byCategory.get(c)?.length ?? 0
            const active = c === cat
            return (
              <GlassCard key={c} className="p-0 rounded-full">
                <button
                  onClick={() => setCat(c)}
                  className={[
                    'rounded-full px-2 py-1 text-[15px] leading-none whitespace-nowrap',
                    active ? 'bg-white/10 text-white' : 'bg-transparent text-white/90 hover:bg-white/10',
                  ].join(' ')}
                  aria-pressed={active}
                >
                  {c} <span className="opacity-60">({count})</span>
                </button>
              </GlassCard>
            )
          })}
        </div>

        {/* 모바일 2열 · md 3열 · lg 4열 / 전신 3:4 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {visible.map(m => (
            <GlassCard
              key={m.url}
              className="relative p-0 overflow-hidden rounded-2xl bg-white/10 backdrop-blur border border-white/10"
            >
              {/* 3:4 비율 박스 */}
              <div className="relative w-full">
                <div className="pt-[133.333%]" /> {/* 3:4 */}
                <div className="absolute inset-0 glass-viewer flex items-center justify-center">
                  <ModelViewer
                    url={m.url}
                    width="100%"
                    height="100%"
                    environmentPreset="studio"
                    autoFrame
                    autoRotate
                    autoRotateSpeed={0.25}
                    enableManualRotation
                    enableManualZoom
                    enableHoverRotation
                    placeholderSrc="/icons/model-placeholder.png"
                    showScreenshotButton={false}
                    ambientIntensity={0.45}
                    keyLightIntensity={1}
                    fillLightIntensity={0.65}
                    rimLightIntensity={0.85}
                    defaultZoom={1.56}   // 전신이 카드에 알맞게
                    minZoomDistance={0.5}
                    maxZoomDistance={6}
                  />
                </div>
              </div>

              {/* 좌하 캡션 */}
              <figcaption className="absolute left-2 bottom-2 px-2 py-1 rounded-lg bg-black/40 backdrop-blur border border-white/10 text-xs text-white/90">
                {m.title}
              </figcaption>
            </GlassCard>
          ))}
        </div>
      </section>
    </main>
  )
}
