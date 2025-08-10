import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FullscreenVideoModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    if (!open) return
    const v = videoRef.current
    if (!v) return
    v.muted = true // 처음엔 무음
    v.playsInline = true
    v.autoplay = true
    v.loop = true
    v.play()
      .then(() => {
        setPlaying(true)
        setBlocked(false)
      })
      .catch(() => setBlocked(true))
  }, [open])

  const togglePlay = async () => {
    const v = videoRef.current
    if (!v) return

    try {
      // 재생 중일 때는 일시정지
      if (!v.paused) {
        v.pause()
        setPlaying(false)
        return
      }

      // 재생 버튼 클릭 → 소리 켜고 재생
      v.muted = false
      setMuted(false)
      await v.play()
      setPlaying(true)
      setBlocked(false)
    } catch {
      setBlocked(true)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-lg flex items-center justify-center"
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
          onClick={onClose}
        >
          <div
            className="relative w-[96vw] h-[86vh] max-w-[1400px] glass rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(233,178,77,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center"
              aria-label="close video"
            >
              ✕
            </button>

            <video
              ref={videoRef}
              src="../media/dj.mp4"
              className="w-full h-full object-cover"
            />

            {/* 중앙 재생 버튼 (자동재생 차단시/일시정지시/음소거 상태에서 노출) */}
            {(!playing || blocked || muted) && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-black/50 hover:bg-black/70 text-white text-2xl flex items-center justify-center"
              >
                ▶
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
