'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause } from 'lucide-react'
import { formatTime } from '@/lib/utils'

export interface MockCuePlayerStaticProps {
  src: string
  label?: string
}

export default function MockCuePlayerStatic({ src, label }: MockCuePlayerStaticProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [hoverX, setHoverX] = useState(0)

  function handleHover(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverX(((e.clientX - rect.left) / rect.width) * 100)
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onTimeUpdate={() => {
          const a = audioRef.current
          if (!a) return
          setCurrentTime(a.currentTime)
          setProgress((a.currentTime / a.duration) * 100)
        }}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0) }}
      />

      <Button
        size="icon"
        variant="outline"
        onClick={() => {
          const a = audioRef.current
          if (!a) return
          playing ? a.pause() : a.play()
          setPlaying(!playing)
        }}
        className="h-9 w-9 shrink-0"
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>

      <div className="flex-1 space-y-1 min-w-0">
        {label && <p className="text-xs text-muted-foreground truncate mb-1">{label}</p>}
        <div
          className="relative h-2 bg-secondary rounded-full cursor-pointer overflow-hidden group"
          onClick={(e) => {
            const a = audioRef.current
            if (!a) return
            const rect = e.currentTarget.getBoundingClientRect()
            a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration
          }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onMouseMove={handleHover}
        >
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 4px)',
            }}
          />
          {hovering && (
            <div
              className="absolute top-0 bottom-0 bg-foreground/10 rounded-full transition-none"
              style={{ width: `${hoverX}%` }}
            />
          )}
          <div
            className="relative h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground font-mono tabular-nums">
          <span>{formatTime(currentTime)}</span>
          {duration > 0 && <span>{formatTime(duration)}</span>}
        </div>
      </div>
    </div>
  )
}
