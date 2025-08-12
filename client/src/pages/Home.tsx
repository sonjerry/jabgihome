import { useEffect, useState } from 'react'
import FullscreenVideoModal from '../components/FullscreenVideoModal'
import Stickers from '../components/StickerPeel'

export default function Home() {
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem('videoShown')
    if (!seen) setShowVideo(true)
  }, [])

  const closeVideo = () => {
    sessionStorage.setItem('videoShown', '1')
    setShowVideo(false)
  }

  // 이 페이지에 있는 동안만 세로 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    // 뷰포트 고정 + 넘침 숨김 → 페이지 스크롤 없음
    <main className="relative min-h-screen overflow-x-hidden">
      <FullscreenVideoModal open={showVideo} onClose={closeVideo} />

      {/* 글로벌 헤더(6rem=top-24) 아래부터 바닥까지. 데스크톱은 사이드바 폭 만큼 비움 */}
      <section
        className="
          absolute inset-x-0 bottom-0 top-16
          
          px-3 md:px-16
          z-0
        "
      >
        {/* 상단 타이틀 + 아래 영역 1fr로 꽉 채움 */}
        <div className="grid h-full grid-rows-[auto,1fr]">
          {/* 타이틀을 최대한 위로 */}
          <header className="row-start-1 row-end-2 pt-0 pb-1">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none">
              이가을 블로그
            </h1>
          </header>

        </div>
        {/* 모달 열리면 스티커 숨김(기존 동작) */}
        {!showVideo && <Stickers />}
      </section>
    </main>
  )
}
