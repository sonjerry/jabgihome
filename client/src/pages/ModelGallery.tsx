// client/src/pages/ModelGallery.tsx
import { useMemo, useState, useEffect, useCallback } from 'react'
import GlassCard from '../components/GlassCard'
import ModelViewer from '../components/ModelViewer'
import { useAuth } from '../state/auth'

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
  const { role } = useAuth()
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

  // 페이지 마운트 시 Canvas 렌더링 강제 트리거 (페이지 전환 애니메이션 이슈 해결)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Canvas들을 강제로 다시 렌더링
      window.dispatchEvent(new Event('resize'))
    }, 350) // 페이지 전환 애니메이션(280ms) 후
    return () => clearTimeout(timer)
  }, [])

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

  // ── modal state for enlarged viewer and comments ─────────
  const [open, setOpen] = useState(false)
  const [entering, setEntering] = useState(false)
  const [idx, setIdx] = useState(0)

  const openAt = useCallback((i: number) => {
    setIdx(i)
    setOpen(true)
  }, [])
  const close = useCallback(() => {
    setEntering(false)
    setTimeout(() => setOpen(false), 200)
  }, [])
  const next = useCallback(() => setIdx(i => (i + 1) % visible.length), [visible.length])
  const prev = useCallback(() => setIdx(i => (i - 1 + visible.length) % visible.length), [visible.length])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [open])

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setEntering(true))
      return () => cancelAnimationFrame(id)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, next, prev])

  // comments per model url
  type Comment = { id: string; author: string; text: string; time: number }
  const currentKey = visible[idx]?.url ?? ''
  const [comments, setComments] = useState<Comment[]>([])
  const [draft, setDraft] = useState('')

  const loadComments = useCallback((key: string): Comment[] => {
    try {
      const raw = localStorage.getItem('comments:' + key)
      return raw ? (JSON.parse(raw) as Comment[]) : []
    } catch {
      return []
    }
  }, [])
  const saveComments = useCallback((key: string, list: Comment[]) => {
    localStorage.setItem('comments:' + key, JSON.stringify(list))
  }, [])
  useEffect(() => {
    if (open && currentKey) {
      setComments(loadComments(currentKey))
      setDraft('')
    }
  }, [open, currentKey, loadComments])
  const handleAddComment = useCallback(() => {
    const text = draft.trim()
    if (!text || !currentKey) return
    const existing = loadComments(currentKey)
    const nextIdx = existing.length + 1
    const newItem: Comment = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      author: `익명${nextIdx}`,
      text,
      time: Date.now(),
    }
    const updated = [...existing, newItem]
    saveComments(currentKey, updated)
    setComments(updated)
    setDraft('')
  }, [draft, currentKey, loadComments, saveComments])

  const handleDeleteComment = useCallback((id: string) => {
    if (role !== 'admin' || !currentKey) return
    const updated = comments.filter(c => c.id !== id)
    saveComments(currentKey, updated)
    setComments(updated)
  }, [role, currentKey, comments, saveComments])

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
          {visible.map((m, i) => (
            <GlassCard
              key={m.url}
              className="relative p-0 overflow-hidden rounded-2xl bg-white/10 backdrop-blur border border-white/10"
            >
              {/* 3:4 비율 박스 */}
              <div className="relative w-full">
                <div className="pt-[133.333%]" /> {/* 3:4 */}
                <div className="absolute inset-0 glass-viewer flex items-center justify-center">
                  <button onClick={() => openAt(i)} className="w-full h-full">
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
                  </button>
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
      {open && visible[idx] && (
        <div
          className={[
            'fixed inset-0 z-50 flex items-center justify-center',
            entering ? 'bg-black/90' : 'bg-black/0',
            'transition-[background-color] duration-200 ease-out'
          ].join(' ')}
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-[30%] top-1/2 -translate-y-1/2 rounded-full px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white"
            aria-label="이전"
          >
            ◀
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-[30%] top-1/2 -translate-y-1/2 rounded-full px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white"
            aria-label="다음"
          >
            ▶
          </button>

          <div
            className="relative w-[92vw] max-w-5xl max-h-[86vh] rounded-xl overflow-hidden bg-black/30 backdrop-blur border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={[
                'transition-all duration-200 ease-out',
                entering ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              ].join(' ')}
            >
              {/* enlarged model viewer */}
              <div className="w-full h-[60vh]">
                <ModelViewer
                  url={visible[idx].url}
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
                />
              </div>

              {/* comments */}
              <div className="px-4 py-3 space-y-3">
                <h3 className="text-sm font-semibold text-white/80">댓글</h3>
                <div className="max-h-[18vh] overflow-y-auto space-y-2 pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-white/50">첫 댓글을 남겨보세요.</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="text-sm flex items-start gap-2">
                        <div className="flex-1">
                          <span className="text-white/70 mr-2">{c.author}</span>
                          <span className="text-white/90 break-words align-middle">{c.text}</span>
                        </div>
                        {role === 'admin' && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="shrink-0 text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200"
                          >삭제</button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment() } }}
                    placeholder="텍스트만 입력..."
                    className="flex-1 rounded-md bg-white/10 text-white placeholder:text-white/40 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <button
                    onClick={handleAddComment}
                    className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm"
                  >
                    남기기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
