// client/src/pages/Home.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FullscreenVideoModal from '../components/FullscreenVideoModal'
import Stickers from '../components/StickerPeel'
import ModelViewer from '../components/ModelViewer'
import GlassCard from '../components/GlassCard'

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

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <FullscreenVideoModal open={showVideo} onClose={closeVideo} />

      <section className="absolute inset-x-0 bottom-0 top-16 px-3 md:px-16 z-0">
        <div className="grid h-full grid-rows-[auto,1fr] gap-3 md:gap-12">
          {/* 제목 */}
          <header className="pt-0">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none">
              이가을 블로그
            </h1>
          </header>

          {/* 본문 레이아웃 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 min-h-0">
            {/* 좌측 카드 스택 */}
            <div className="lg:col-span-5 space-y-3 md:space-y-4">
              {/* 소개 카드: 더 작고 컴팩트, 여백 최소화 */}
              <GlassCard className="max-w-xl bg-white/10 backdrop-blur border border-white/15 text-white px-5 py-4">
                <h2 className="text-lg md:text-xl text-amber-400 font-semibold">홈페이지 소개</h2>
                <p className="mt-2 text-[11px] md:text-xl leading-relaxed text-white/90">
                  AI 친화적인 소프트웨어 전공생 이가을입니다. 
                </p>
                <p className="mt-2 text-[11px] md:text-xl leading-relaxed text-white/90">
                  블로그, 개인프로젝트, 그림을 전시한 갤러리를 간단히 소개합니다.
                </p>
              </GlassCard>

              {/* 추가 카드 */}
              <GlassCard className="w-[10%] md:w-[56%] lg:w-[100%] h-[67%] bg-white/10 backdrop-blur border border-white/15 text-white px-5 py-4">
                <h3 className="text-base md:text-lg font-semibold">바로가기</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    to="/blog"
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition"
                  >
                    블로그
                  </Link>
                  <Link
                    to="/projects"
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition"
                  >
                    프로젝트
                  </Link>
                  <Link
                    to="/gallery"
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition"
                  >
                    갤러리
                  </Link>
                  <Link
                    to="/chat"
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition"
                  >
                    챗봇
                  </Link>
                </div>
              </GlassCard>
            </div>

            {/* 우측 모델 전시: 우측 배치, 내부 여백 제거 */}
            <div className="lg:col-span-7 w-[10%] md:w-[56%] lg:w-[100%] h-[67%]">
              <div
                className="
                  relative mx-auto  
                  rounded-3xl border border-white/10 bg-white/5 backdrop-blur
                  shadow-[0_0_40px_rgba(0,0,0,0.25)]
                  overflow-hidden
                  flex items-center justify-end
                "
              >
                {/* 모델 컨테이너: 우측으로, 살짝 작게 */}
                <div className="w-[30%] md:w-[56%] lg:w-[100%] h-[100%]">
                  <ModelViewer
                    url="/models/aira.glb"
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
                    ambientIntensity={0.4}
                    keyLightIntensity={1}
                    fillLightIntensity={0.6}
                    rimLightIntensity={0.8}
                    defaultZoom={1.18}
                    minZoomDistance={0.6}
                    maxZoomDistance={6}
                  />
                </div>

                {/* 캡션: 모델 하단 우측 */}
                <div className="absolute right-3 bottom-3">
                  <div className="rounded-full border border-white/15 bg-black/30 backdrop-blur px-3 py-1 text-[12px] text-white/90">
                    AI로 만든 모델
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!showVideo && <Stickers />}
      </section>
    </main>
  )
}
