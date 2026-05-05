'use client'

import { useMemo, useRef, useState } from 'react'

interface BriefSheetPlayerProps {
  src: string
  /** Hint for the total length used while metadata loads. */
  durationHint?: number | null
}

function formatTc(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

// Deterministic waveform — gentle arc with a swell ~78% across, mirrored top/bottom.
// Matches the design's reference cue feel without depending on real audio analysis.
function buildWavePath(): string {
  const W = 1000
  const H = 56
  const mid = H / 2
  const N = 220
  let seed = 7421
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  const env = (t: number) =>
    0.18 +
    0.30 * Math.sin(Math.PI * t) * 0.5 +
    0.62 * Math.exp(-Math.pow((t - 0.78) / 0.07, 2))
  const amp = (t: number) => {
    const noise = (rand() - 0.5) * 0.55 + (rand() - 0.5) * 0.25
    return Math.max(0.04, Math.min(0.95, env(t) + noise * 0.35)) * (mid - 4)
  }
  let d = ''
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    const x = ((i / (N - 1)) * W).toFixed(1)
    d += `${i === 0 ? 'M' : 'L'}${x} ${(mid - amp(t)).toFixed(1)} `
  }
  for (let i = N - 1; i >= 0; i--) {
    const t = i / (N - 1)
    const x = ((i / (N - 1)) * W).toFixed(1)
    d += `L${x} ${(mid + amp(t)).toFixed(1)} `
  }
  return d + 'Z'
}

export default function BriefSheetPlayer({ src, durationHint }: BriefSheetPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(durationHint && Number.isFinite(durationHint) ? durationHint : 0)
  const wavePath = useMemo(() => buildWavePath(), [])

  const total = duration > 0 ? duration : durationHint || 0
  const pct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0

  return (
    <div className={`bd-player${playing ? ' playing' : ''}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => {
          const a = audioRef.current
          if (a && Number.isFinite(a.duration) && a.duration > 0) setDuration(a.duration)
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => {
          const a = audioRef.current
          if (a) setElapsed(a.currentTime)
        }}
        onEnded={() => {
          setPlaying(false)
          setElapsed(0)
        }}
      />
      <button
        type="button"
        className="play"
        aria-label={playing ? 'Pause reference cue' : 'Play reference cue'}
        onClick={async () => {
          const a = audioRef.current
          if (!a) return
          if (a.paused) {
            try { await a.play() } catch { /* ignore */ }
          } else {
            a.pause()
          }
        }}
      >
        <span className="icon" aria-hidden />
      </button>
      <div className="bd-wave">
        <svg preserveAspectRatio="none" viewBox="0 0 1000 56" aria-hidden>
          <path d={wavePath} fill="currentColor" opacity="0.55" />
          <line x1="0" y1="28" x2="1000" y2="28" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
        </svg>
        <div className="progress" style={{ width: `${pct}%` }} />
        <button
          type="button"
          className="scrub"
          aria-label="Seek"
          onClick={(e) => {
            const a = audioRef.current
            if (!a || total <= 0) return
            const rect = e.currentTarget.getBoundingClientRect()
            const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
            a.currentTime = t * total
            setElapsed(a.currentTime)
          }}
        />
      </div>
      <div className="tc">
        <span className="now">{formatTc(elapsed)}</span>
        <span className="sep">/</span>
        <span>{formatTc(total)}</span>
      </div>
    </div>
  )
}
