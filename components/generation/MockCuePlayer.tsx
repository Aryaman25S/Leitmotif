'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, Volume2 } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'

export interface MockCuePlayerProps {
  src: string
  label?: string
  durationSec?: number
  approved?: boolean
}

export default function MockCuePlayer({ src, label, durationSec, approved = false }: MockCuePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [hoverX, setHoverX] = useState(0)

  function handlePlayPause() {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause() } else { a.play() }
    setPlaying(!playing)
  }

  function handleScrub(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current
    if (!a) return
    const rect = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration
  }

  function handleHover(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverX(((e.clientX - rect.left) / rect.width) * 100)
  }

  return (
    <div className="space-y-2">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={() => {
          const a = audioRef.current
          if (!a) return
          setCurrentTime(a.currentTime)
          setProgress((a.currentTime / a.duration) * 100)
        }}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0) }}
      />

      {label && (
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      )}

      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="outline"
          onClick={handlePlayPause}
          className={cn('h-9 w-9 shrink-0', approved && 'border-status-complete/30')}
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>

        <div className="flex-1 space-y-1">
          <div
            className="relative h-2 bg-secondary rounded-full cursor-pointer overflow-hidden group"
            onClick={handleScrub}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onMouseMove={handleHover}
          >
            {/* Waveform hint */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 4px)',
              }}
            />
            {/* Hover indicator */}
            {hovering && (
              <div
                className="absolute top-0 bottom-0 bg-foreground/10 rounded-full transition-none"
                style={{ width: `${hoverX}%` }}
              />
            )}
            {/* Progress fill */}
            <div
              className={cn('relative h-full rounded-full transition-all', approved ? 'bg-status-complete' : 'bg-primary')}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono tabular-nums">
            <span>{formatTime(currentTime)}</span>
            {durationSec != null && <span>{formatTime(durationSec)}</span>}
          </div>
        </div>

        <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </div>
    </div>
  )
}
