import React, {
  createContext, useContext, useEffect, useMemo,
  useRef, useState
} from 'react'

export type Track = { title: string; src: string }

type AudioCtx = {
  playlist: Track[]
  idx: number
  playing: boolean
  duration: number
  currentTime: number
  volume: number
  muted: boolean
  setPlaylist: (pl: Track[], startIndex?: number) => void
  play: (index?: number) => void
  pause: () => void
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (time: number) => void
  setVolume: (v: number) => void
  setMuted: (m: boolean) => void
}

const Ctx = createContext<AudioCtx | null>(null)

export function useAudio() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAudio must be used within <AudioProvider>')
  return v
}

export default function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [playlist, setPlaylistState] = useState<Track[]>([])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [muted, setMutedState] = useState(false)

  // 최신 값을 참조하기 위한 ref들 (이벤트 리스너의 stale closure 방지)
  const playlistRef = useRef<Track[]>([])
  const idxRef = useRef(0)

  useEffect(() => { playlistRef.current = playlist }, [playlist])
  useEffect(() => { idxRef.current = idx }, [idx])

  // 오디오 엘리먼트 1회 생성 + 이벤트 바인딩
  useEffect(() => {
    const el = document.createElement('audio')
    el.preload = 'metadata'
    el.crossOrigin = 'anonymous'
    el.style.display = 'none'
    document.body.appendChild(el)
    audioRef.current = el

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => setCurrentTime(el.currentTime || 0)
    const onDur = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0)
    const onEnded = () => {
      const list = playlistRef.current
      if (list.length === 0) return
      const ni = (idxRef.current + 1) % list.length
      setIdx(ni)
      el.src = list[ni].src
      el.load()
      void el.play().catch(() => {})
    }

    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('durationchange', onDur)
    el.addEventListener('ended', onEnded)

    return () => {
      el.pause()
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('durationchange', onDur)
      el.removeEventListener('ended', onEnded)
      el.remove()
    }
  }, [])

  const load = (i: number) => {
    const el = audioRef.current
    const list = playlistRef.current
    if (!el || !list[i]) return
    setIdx(i)
    el.src = list[i].src
    el.load()
  }

  const play = (index?: number) => {
    const el = audioRef.current
    if (!el) return
    if (typeof index === 'number') load(index)
    void el.play().catch(() => {})
  }

  const pause = () => audioRef.current?.pause()

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) void el.play().catch(() => {})
    else el.pause()
  }

  const next = () => {
    const list = playlistRef.current
    if (list.length === 0) return
    const ni = (idxRef.current + 1) % list.length
    load(ni)
    play()
  }

  const prev = () => {
    const list = playlistRef.current
    if (list.length === 0) return
    const pi = (idxRef.current - 1 + list.length) % list.length
    load(pi)
    play()
  }

  const seek = (time: number) => {
    const el = audioRef.current
    if (!el) return
    el.currentTime = Math.max(0, Math.min(time, duration || 0))
  }

  const setVolume = (v: number) => {
    const el = audioRef.current
    if (!el) return
    const nv = Math.max(0, Math.min(v, 1))
    el.volume = nv
    setVolumeState(nv)
  }

  const setMuted = (m: boolean) => {
    const el = audioRef.current
    if (!el) return
    el.muted = m
    setMutedState(m)
  }

  const setPlaylist = (pl: Track[], startIndex = 0) => {
    setPlaylistState(pl)
    playlistRef.current = pl
    if (pl.length > 0) {
      const si = Math.max(0, Math.min(startIndex, pl.length - 1))
      const el = audioRef.current
      if (el) {
        setIdx(si)
        el.src = pl[si].src
        el.load()
      }
    }
  }

  const value = useMemo<AudioCtx>(() => ({
    playlist, idx, playing, duration, currentTime, volume, muted,
    setPlaylist, play, pause, toggle, next, prev, seek, setVolume, setMuted
  }), [playlist, idx, playing, duration, currentTime, volume, muted])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}