import { useMemo } from 'react'
import { loadGallery } from '../lib/gallery'

export default function GalleryGrid() {
  const data = useMemo(() => loadGallery(), [])

  return (
    <>
      <div className="glass rounded-2xl px-5 py-4 mb-6">
        <h1 className="text-xl md:text-2xl font-semibold">Gallery</h1>
        <p className="text-white/70 text-sm mt-1">
          JPG 이미지를 한 폴더에 넣으면 자동으로 나열됩니다. (클릭 동작 없음)
        </p>
      </div>

      {/* 뮤지엄 느낌: Masonry-like(열 기반) 레이아웃 */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
        {data.map((item) => (
          <figure
            key={item.src}
            className="mb-5 break-inside-avoid rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-glass select-none cursor-default"
          >
            <img
              src={item.src}
              alt={item.name}
              loading="lazy"
              className="w-full h-auto object-cover block"
              draggable={false}
            />
            {item.name && (
              <figcaption className="px-3 py-2 text-sm text-white/70">
                {item.name}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </>
  )
}
