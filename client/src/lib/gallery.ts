
/// <reference types="vite/client" />

// import.meta.glob 타입 확장
interface ImportMeta {
  glob: (pattern: string, options?: { eager?: boolean; as?: string }) => Record<string, unknown>;
}

// src/assets/gallery 폴더의 jpg/jpeg만 자동 수집
const modules = import.meta.glob('../assets/gallery/*.{jpg,jpeg,png}', {
  eager: true,
  query: '?url', import: 'default',
}) as Record<string, string>

export type GalleryItem = { src: string; name: string }

export function loadGallery(): GalleryItem[] {
  const items = Object.entries(modules).map(([path, url]) => {
    const file = path.split('/').pop() || ''
    const name = file.replace(/\.(jpg|jpeg)$/i, '')
    return { src: url, name }
  })
  return items.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  )
}
