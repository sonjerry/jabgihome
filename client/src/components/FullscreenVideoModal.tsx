import React from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  onClose: () => void
  /** 비디오 소스 (필요 시 교체) */
  src?: string
}

export default function FullscreenVideoModal({ open, onClose, src }: Props) {
  if (!open) return null

  // 포털 대상
  const portalTarget = typeof document !== 'undefined' ? document.body : null
  if (!portalTarget) return null

  const handleClose = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onClose()
  }

  return createPortal(
    <div
      className="
        fixed inset-0 z-[4000]
        flex items-center justify-center
        pointer-events-auto
      "
      role="dialog"
      aria-modal="true"
    >
      {/* 백드롭 (탭/클릭 시 닫힘) */}
      <button
        onClick={handleClose}
        onTouchEnd={handleClose}
        aria-label="닫기"
        className="
          absolute inset-0
          bg-black/70 backdrop-blur-sm
          cursor-default
        "
        // 버튼이지만 시각적으로는 오버레이처럼 동작
      />

      {/* 컨텐츠 */}
      <div
        className="
          relative z-10
          w-[min(92vw,1000px)]
          aspect-video
          bg-black rounded-2xl overflow-hidden
          shadow-2xl
        "
        // 컨텐츠 영역 클릭은 닫히지 않도록
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼: 터치 타겟 크게 */}
        <button
          onClick={handleClose}
          onTouchEnd={handleClose}
          aria-label="닫기"
          type="button"
          className="
            absolute top-3 right-3
            h-12 w-12 md:h-10 md:w-10
            rounded-full
            bg-white/90 hover:bg-white
            text-black
            flex items-center justify-center
            shadow-lg
            active:scale-[0.98]
          "
        >
          <svg
            width="22" height="22" viewBox="0 0 24 24" fill="none"
            xmlns="http://www.w3.org/2000/svg" aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* 비디오 (예시) */}
        <video
          src={src || '/intro.mp4'}
          autoPlay
          controls
          playsInline
          // iOS
          // @ts-ignore
          webkit-playsinline="true"
          disablePictureInPicture
          className="h-full w-full object-cover"
        />
      </div>
    </div>,
    portalTarget
  )
}
