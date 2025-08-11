// client/src/pages/Gallery.tsx
import { useMemo, useState, useEffect, useCallback } from 'react'
import GlassCard from '../components/GlassCard'

type ImgItem = {
  title: string
  url: string
  category: string
}

/** 하위 폴더까지 이미지 자동 수집 */
const IMAGE_MODULES = import.meta.glob('../assets/gallery/**/*.{png,jpg,jpeg,gif,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function filenameToTitle(p: string) {
  const base = decodeURIComponent(p.split('/').pop() || '')
  const name = base.replace(/\.[^/.]+$/, '')
  return name.replace(/[_-]+/g, ' ').trim()
}

/** 최상위 폴더명을 카테고리로 사용 (루트 파일은 '미분류') */
function pathToCategory(p: string) {
  const marker = '/gallery/'
  const i = p.indexOf(marker)
  if (i === -1) return '미분류'
  const rest = p.slice(i + marker.length) // e.g. "여행/부산/b1.jpg" or "root.jpg"
  const first = rest.split('/')[0]
  return first && !first.includes('.') ? first : '미분류'
}

export default function Gallery() {
  // 전체 이미지 수집/정렬
  const allImages: ImgItem[] = useMemo(
    () =>
      Object.entries(IMAGE_MODULES)
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([p, url]) => ({
          title: filenameToTitle(p),
          url,
          category: pathToCategory(p),
        })),
    []
  )

  // 카테고리 목록: 전체 + 사전순
  const categories = useMemo(() => {
    const s = new Set<string>()
    for (const img of allImages) s.add(img.category)
    return ['전체', ...Array.from(s).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))]
  }, [allImages])

  // 카테고리별 매핑
  const byCategory = useMemo(() => {
    const map = new Map<string, ImgItem[]>()
    for (const c of categories) map.set(c, [])
    for (const img of allImages) map.get(img.category)?.push(img)
    map.set('전체', allImages)
    return map
  }, [allImages, categories])

  // 현재 선택 카테고리
  const [cat, setCat] = useState<string>(categories[0] ?? '전체')
  const visible = byCategory.get(cat) ?? []

  // 라이트박스 상태
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)
  const openAt = useCallback((i: number) => {
    setIdx(i)
    setOpen(true)
  }, [])
  const close = useCallback(() => setOpen(false), [])
  const next = useCallback(() => setIdx(i => (i + 1) % visible.length), [visible.length])
  const prev = useCallback(() => setIdx(i => (i - 1 + visible.length) % visible.length), [visible.length])

  // 카테고리 전환 시 라이트박스 초기화
  useEffect(() => {
    setIdx(0)
    setOpen(false)
  }, [cat])

  // 라이트박스 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // 키보드 네비게이션
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

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* 상단 글로벌 헤더 높이(top-24) 피하고, 데스크톱 좌측 사이드바(280px) 여백 확보 */}
      <section
        className="
          absolute inset-x-0 bottom-0 top-6
          
          px-3 md:px-8 lg:px-12
          z-0 overflow-y-auto
        "
      >
        {/* 헤더 카드 */}
        <GlassCard className="mb-45 md:mb-6">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">갤러리</h1>
          <p className="text-sm md:text-base text-white/70 mt-4">
            AI를 이용하여 만든 사진들입니다.
          </p>
        </GlassCard>

        {/* 카테고리 탭 바 */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
          {categories.map(c => {
            const count = byCategory.get(c)?.length ?? 0
            const active = c === cat
            return (
              <GlassCard key={c} className="p-0 rounded-full">
                <button
                  onClick={() => setCat(c)}
                  className={[
                    'rounded-full px-1.5 py-[1px] text-[15px] leading-none  whitespace-nowrap',
                    active
                      ? 'bg-white/10 text-white'
                      : 'bg-transparent text-white/90 hover:bg-white/10'
                  ].join(' ')}
                  aria-pressed={active}
                >
                  {c} <span className="opacity-60">({count})</span>
                </button>
              </GlassCard>
            )
          })}
        </div>

        {/* Masonry-like 열 기반 레이아웃 */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
          {visible.map((img, i) => (
            <figure
              key={img.url}
              className="mb-5 break-inside-avoid relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-glass select-none"
            >
           

              <button onClick={() => openAt(i)} className="block w-full text-left">
                <img
                  src={img.url}
                  alt={img.title}
                  loading="lazy"
                  className="w-full h-auto object-cover block"
                  draggable={false}
                />
              </button>

              
            </figure>
          ))}
        </div>
      </section>
      {/* 라이트박스 */}
      {open && visible[idx] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          {/* 이전 버튼 */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-[30%] top-1/2 -translate-y-1/2 rounded-full px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white"
            aria-label="이전"
          >
            ◀
          </button>

          {/* 다음 버튼 */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-[30%] top-1/2 -translate-y-1/2 rounded-full px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white"
            aria-label="다음"
          >
            ▶
          </button>

         
          {/* 이미지 컨테이너 */}
          <div
            className="relative max-w-[92vw] max-h-[86vh] rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={visible[idx].url}
              alt={visible[idx].title}
              className="block max-w-[92vw] max-h-[86vh] object-contain"
            />
            
          </div>
        </div>
      )}



     
    </main>
  )
}
