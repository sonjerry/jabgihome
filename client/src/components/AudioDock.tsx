// client/src/components/AudioDock.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import clsx from 'clsx'

type Track = { title: string; src: string }

// ✅ Vite 글롭으로 src/media 안 mp3 전부 가져오기
const MP3_MODULES = import.meta.glob('../assets/media/*.mp3', {
  eager: true,
  query: '?url', import: 'default'
}) as Record<string, string>

// 파일명 → 제목 변환
function filenameToTitle(path: string) {
  const base = decodeURIComponent(path.split('/').pop() || '')
  const name = base.replace(/\.[^/.]+$/, '')
  return name.replace(/[_-]+/g, ' ').trim()
}

// 플레이리스트 생성
const PLAYLIST: Track[] = Object.entries(MP3_MODULES)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, url]) => ({
    title: filenameToTitle(path),
    src: url,
  }))

/** 공통 오디오 로직 */
function useAudioCore() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('audioVolume')
    return saved ? Math.min(1, Math.max(0, Number(saved))) : 0.5
  })
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)

  const hasList = PLAYLIST.length > 0
  const safeIdx = hasList ? Math.min(idx, PLAYLIST.length - 1) : 0

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onLoaded = () => setDuration(a.duration || 0)
    const onTime = () => setCurrent(a.currentTime || 0)
    const onEnd = () => next()
    a.addEventListener('loadedmetadata', onLoaded)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnd)
    return () => {
      a.removeEventListener('loadedmetadata', onLoaded)
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('ended', onEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx])

  useEffect(() => {
    const a = audioRef.current
    if (a) {
      a.volume = volume
      localStorage.setItem('audioVolume', String(volume))
    }
  }, [volume])

  const toggle = async () => {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      try {
        await a.play()
        setPlaying(true)
      } catch {}
    }
  }

  const playIdx = async (i: number) => {
    if (!hasList) return
    const a = audioRef.current
    if (!a) return
    const nextIdx = ((i % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length
    setIdx(nextIdx)
    a.src = PLAYLIST[nextIdx].src
    a.currentTime = 0
    try {
      await a.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  const next = () => hasList && playIdx((safeIdx + 1) % PLAYLIST.length)
  const prev = () => hasList && playIdx((safeIdx - 1 + PLAYLIST.length) % PLAYLIST.length)

  const seekAtPercent = (p: number) => {
    const a = audioRef.current
    if (!a || !duration) return
    a.currentTime = Math.max(0, Math.min(duration, duration * p))
    setCurrent(a.currentTime)
  }

  return {
    audioRef,
    idx: safeIdx,
    playing,
    volume,
    setVolume,
    duration,
    current,
    toggle,
    playIdx,
    next,
    prev,
    seekAtPercent,
    track: hasList ? PLAYLIST[safeIdx] : { title: 'No tracks', src: '' },
    hasList,
  }
}

/** 공용 바(시크/볼륨) - 색상 props 지원 */
function Bar({
  value,
  onChange,
  thickness = 8,
  knob = 14,
  ariaLabel,
  fillColor = 'bg-white',
  knobColor = 'bg-white',
  knobRing = 'ring-white/60',
}: {
  value: number
  onChange: (v: number) => void
  thickness?: number
  knob?: number
  ariaLabel?: string
  fillColor?: string
  knobColor?: string
  knobRing?: string
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const pct = Math.max(0, Math.min(1, value)) * 100

  const calc = useCallback((clientX: number) => {
    const el = rootRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const x = Math.min(rect.right, Math.max(rect.left, clientX))
    return (x - rect.left) / rect.width
  }, [])

  const start = (e: React.PointerEvent<HTMLDivElement>) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    onChange(calc(e.clientX))
  }
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!(e.buttons & 1)) return
    onChange(calc(e.clientX))
  }

  const pad = Math.round(knob / 2)

  return (
    <div
      ref={rootRef}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className="relative w-full cursor-pointer select-none rounded-full bg-white/10 overflow-hidden"
      style={{ height: thickness, paddingLeft: pad, paddingRight: pad }}
      onPointerDown={start}
      onPointerMove={move}
    >
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${fillColor}`}
        style={{ width: `${pct}%` }}
      />
      <div
        className={`absolute top-1/2 -translate-y-1/2 rounded-full ${knobColor} ring-2 ${knobRing} pointer-events-none`}
        style={{ left: `${pct}%`, width: knob, height: knob }}
      />
    </div>
  )
}

/** 사이드바 오디오 플레이어 */
export default function SidebarAudio() {
  const {
    audioRef,
    track,
    idx,
    playing,
    volume,
    setVolume,
    duration,
    current,
    toggle,
    next,
    prev,
    playIdx,
    seekAtPercent,
    hasList,
  } = useAudioCore()

  const progress = duration ? current / duration : 0

  return (
    <div className="w-full">
      <div
        className={clsx(
          'backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-md',
          'px-5 py-4',
          'w-full min-h-[17rem] h-auto box-border overflow-visible flex flex-col'
        )}
      >
        {/* 제목 */}
        <div className="min-w-0">
          <h3 className="text-cream/90 text-base font-semibold break-words">
            {track.title}
          </h3>
          <p className="text-brown-900 text-xs mt-0.5">레전드 명곡 플레이리스트</p>
        </div>

        {/* 컨트롤 */}
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40"
            onClick={prev}
            aria-label="Previous"
            disabled={!hasList}
          >
            ‹‹
          </button>
          <button
            className="w-12 h-12 rounded-2xl bg-amber-400/90 hover:bg-amber-400 text-brown-900 font-bold text-xl disabled:opacity-40"
            onClick={toggle}
            aria-label={playing ? 'Pause' : 'Play'}
            disabled={!hasList}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <button
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40"
            onClick={next}
            aria-label="Next"
            disabled={!hasList}
          >
            ››
          </button>
        </div>

        {/* 재생바 */}
        <div className="mt-4">
          <Bar
            value={progress}
            onChange={seekAtPercent}
            thickness={8}
            knob={14}
            ariaLabel="Seek"
            fillColor="bg-amber-400/90"
            knobColor="bg-amber-300"
            knobRing="ring-amber-200"
          />
        </div>

        {/* 볼륨 */}
        <div className="mt-4 pt-3 border-t border-white/10 grid gap-2.5">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="grid grid-cols-[auto,1fr] items-center gap-5 min-w-0">
              <span className=" text-lg w-2 text-right select-none -ml-1">
                {volume === 0 ? '🔇' : '🔊'}
              </span>
              <div className="min-w-0">
                <Bar
                  value={volume}
                  onChange={setVolume}
                  thickness={6}
                  knob={12}
                  ariaLabel="Volume"
                  fillColor="bg-white"
                  knobColor="bg-gray-200"
                  knobRing="ring-gray-400/50"
                />
              </div>
            </div>
          </div>

          <PlaylistPopover currentIdx={idx} onSelect={playIdx} />
        </div>
      </div>

      <audio ref={audioRef} src={track.src} preload="auto" />
    </div>
  )
}

/** 플레이리스트 팝오버 */
function PlaylistPopover({
  currentIdx,
  onSelect,
}: {
  currentIdx: number
  onSelect: (i: number) => void
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative w-full">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="w-full h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center gap-2"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="playlist-popover"
        title="Playlist"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-90">
          <path
            fill="currentColor"
            d="M4 6h16v2H4V6m0 5h10v2H4v-2m0 5h7v2H4v-2Z"
          />
        </svg>
        <span className="text-sm">Playlist</span>
      </button>

      <div
        id="playlist-popover"
        ref={panelRef}
        className={clsx(
          'absolute top-1/2 left-full ml-2 -translate-y-1/2 z-50',
          'w-56 max-h-60 overflow-auto',
          'rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-xl',
          'transition-all duration-150 origin-left',
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        <ul className="py-1">
          {PLAYLIST.length === 0 && (
            <li className="px-3 py-2 text-cream/70 text-sm">No mp3 files</li>
          )}
          {PLAYLIST.map((t, i) => (
            <li key={t.src}>
              <button
                onClick={() => {
                  onSelect(i)
                  setOpen(false)
                }}
                className={clsx(
                  'w-full text-left px-3 py-2 hover:bg-white/10',
                  i === currentIdx && 'bg-white/10 text-amber-400'
                )}
                title={t.title}
              >
                {t.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
