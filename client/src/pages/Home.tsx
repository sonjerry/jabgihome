// client/src/pages/Home.tsx
import { useEffect, useState } from 'react'
import FullscreenVideoModal from '../components/FullscreenVideoModal'
import Stickers from '../components/StickerPeel'
import ModelViewer from '../components/ModelViewer'

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
    <main className="relative min-h-screen overflow-x-hidden">
      <FullscreenVideoModal open={showVideo} onClose={closeVideo} />

      <section
        className="
          absolute inset-x-0 bottom-0 top-16
          px-3 md:px-16
          z-0
        "
      >
        <div className="grid h-full grid-rows-[auto,1fr]">
          <header className="row-start-1 row-end-2 pt-0 pb-2">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none">
              이가을 블로그
            </h1>
          </header>

          {/* 중앙에 크게 모델 뷰어 */}
          <div className="row-start-2 row-end-3 w-full h-full">
            <div
              className="
                relative mx-auto
                w-full max-w-6xl
                h-[62vh] md:h-[72vh]
                rounded-3xl border border-white/10 bg-white/5 backdrop-blur
                shadow-[0_0_40px_rgba(0,0,0,0.25)]
                overflow-hidden
              "
            >
              <ModelViewer
                url="/models/aira.glb"          // 준비된 GLB 경로로 교체
                width="100%"
                height="100%"
                environmentPreset="studio"
                autoFrame
                autoRotate
                autoRotateSpeed={0.25}
                enableManualRotation
                enableManualZoom
                enableHoverRotation
                placeholderSrc="/icons/model-placeholder.png" // 옵션
                showScreenshotButton={false}
                ambientIntensity={0.4}
                keyLightIntensity={1}
                fillLightIntensity={0.6}
                rimLightIntensity={0.8}
                defaultZoom={1.2}
                minZoomDistance={0.6}
                maxZoomDistance={6}
              />
            </div>
          </div>
        </div>

        {!showVideo && <Stickers />}
      </section>
    </main>
  )
}
