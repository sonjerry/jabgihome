// client/src/page/gallery.tsx
import { useMemo, useState, useEffect, useCallback } from 'react'

type ImgItem = {
  title: string
  url: string
}

// ✅ Vite 글롭으로 src/assets/gallery 안의 이미지 자동 수집
// png, jpg, jpeg, gif, webp, avif 모두 대응
const IMAGE_MODULES = import.meta.glob('./src/assets/gallery/*.{png,jpg,jpeg,gif,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function filenameToTitle(path: string) {
  const base = decodeURIComponent(path.split('/').pop() || '')
  const name = base.replace(/\.[^/.]+$/, '')
  return name.replace(/[_-]+/g, ' ').trim()
}

export default function Gallery() {
  // 이미지 목록을 정렬된 배열로 만들기
  const images: ImgItem[] = useMemo(() => {
    return Object.entries(IMAGE_MODULES)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([p, url]) => ({ title: filenameToTitle(p), url }))
  }, [])

  // 라이트박스(풀스크린 미리보기) 상태
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)

  const openAt = useCallback((i: number) => {
    setIdx(i)
    setOpen(true)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  const next = useCallback(() => {
    setIdx((i) => (i + 1) % images.length)
  }, [images.length])

  const prev = useCallback(() => {
    setIdx((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  // 라이트박스 열려 있을 때만 body 스크롤 잠금
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // 키보드 네비게이션
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, next, prev])

  return (
    // 상단 글로벌 헤더 높이(6rem = top-24)를 피하고,
    // 데스크톱에서는 왼쪽 사이드바 280px을 비우는 레이아웃(프로젝트 구조에 맞춤)
    <main className="relative min-h-screen overflow-x-hidden">
      <section
        className="
          absolute inset-x-0 bottom-0 top-24
          lg:left-[280px]
          px-3 md:px-8 lg:px-12
          z-0
          overflow-y-auto
        "
      >
        <header className="sticky top-0 bg-transparent pt-2 pb-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">
            갤러리
          </h1>
          <p className="text-sm md:text-base text-black/50 mt-2">
            총 {images.length}장
          </p>
        </header>

        {/* Masonry 느낌의 반응형 그리드 */}
        <div
          className="
            mt-4
            grid gap-3 md:gap-4 lg:gap-6
            grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5
          "
        >
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => openAt(i)}
              className="
                group relative overflow-hidden rounded-2xl
                shadow-[0_2px_14px_rgba(0,0,0,0.08)]
                focus:outline-none focus:ring-2 focus:ring-black/30
                transition-transform hover:scale-[1.01]
              "
              title={img.title}
            >
              {/* 실제 이미지 */}
              <img
                src={img.url}
                alt={img.title}
                loading="lazy"
                className="block w-full h-full object-cover"
              />
              {/* 하단 타이틀 오버레이 */}
              <div
                className="
                  absolute inset-x-0 bottom-0
                  translate-y-3 opacity-0
                  group-hover:translate-y-0 group-hover:opacity-100
                  transition-all
                  bg-gradient-to-t from-black/60 to-transparent
                  text-white text-[12px] md:text-sm px-3 py-2
                "
              >
                {img.title}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 라이트박스(풀스크린 이미지 뷰어) */}
      {open && images[idx] && (
        <div
          className="
            fixed inset-0 z-50 bg-black/90
            flex items-center justify-center
          "
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          {/* 이미지 컨테이너: 내부 클릭 전파 방지 */}
          <div
            className="relative max-w-[92vw] max-h-[86vh] rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[idx].url}
              alt={images[idx].title}
              className="block max-w-[92vw] max-h-[86vh] object-contain"
            />
            <div className="absolute left-0 right-0 bottom-0 text-white/90 text-sm md:text-base bg-gradient-to-t from-black/60 to-transparent p-3">
              {images[idx].title}
            </div>

            {/* 이전/다음 버튼 */}
            <button
              onClick={prev}
              className="
                absolute left-2 top-1/2 -translate-y-1/2
                rounded-full px-3 py-2 bg-white/10 hover:bg-white/20
                backdrop-blur text-white
              "
              aria-label="이전"
            >
              ◀
            </button>
            <button
              onClick={next}
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                rounded-full px-3 py-2 bg-white/10 hover:bg-white/20
                backdrop-blur text-white
              "
              aria-label="다음"
            >
              ▶
            </button>

            {/* 닫기 버튼 */}
            <button
              onClick={close}
              className="
                absolute top-2 right-2
                rounded-full px-3 py-1.5
                bg-white/10 hover:bg-white/20 backdrop-blur
                text-white text-sm
              "
              aria-label="닫기"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
