'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Film, X } from 'lucide-react'
import { toast } from 'sonner'

interface SceneVideoUploadProps {
  sceneId: string
  videoUrl: string | null
  durationSec: number | null
  readOnly?: boolean
}

export default function SceneVideoUpload({
  sceneId,
  videoUrl: initialUrl,
  durationSec: initialDuration,
  readOnly = false,
}: SceneVideoUploadProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(initialUrl)
  const [durationSec, setDurationSec] = useState<number | null>(initialDuration)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()

  async function handleUpload(file: File) {
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file')
      return
    }

    setUploading(true)
    setProgress(10)

    // Step 1: Get upload credentials
    const initRes = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sceneId,
        fileName: file.name,
        contentType: file.type,
      }),
    })

    if (!initRes.ok) {
      toast.error('Failed to initialize upload')
      setUploading(false)
      return
    }

    const init = await initRes.json()
    const { fileKey, uploadMode, putUrl, uploadUrl } = init as {
      fileKey: string
      uploadMode?: string
      putUrl?: string
      uploadUrl?: string
    }
    setProgress(30)

    // Step 2: Upload — direct to R2 (presigned) or through our API (multipart / local disk)
    if (uploadMode === 'presigned' && putUrl) {
      const uploadRes = await fetch(putUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      })
      if (!uploadRes.ok) {
        toast.error('Upload failed (check R2 CORS allows PUT from this origin)')
        setUploading(false)
        return
      }
    } else if (uploadUrl) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileKey', fileKey)
      const uploadRes = await fetch(uploadUrl, { method: 'POST', body: formData })
      if (!uploadRes.ok) {
        toast.error('Upload failed')
        setUploading(false)
        return
      }
    } else {
      toast.error('Invalid upload response')
      setUploading(false)
      return
    }

    setProgress(80)

    // Step 3: Get client-side duration from the video element
    const localObjectUrl = URL.createObjectURL(file)
    const duration = await getVideoDuration(localObjectUrl)
    URL.revokeObjectURL(localObjectUrl)

    // Step 4: Update scene with file key + duration
    await fetch(`/api/scenes/${sceneId}/video`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey, durationSec: duration }),
    })

    setProgress(100)
    setVideoUrl(`/api/files/${fileKey}`)
    setDurationSec(duration)
    setUploading(false)
    toast.success('Video uploaded')
    router.refresh()
  }

  function getVideoDuration(url: string): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => resolve(Math.round(video.duration))
      video.onerror = () => resolve(60) // fallback
      video.src = url
    })
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleUpload(file)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sceneId]
  )

  async function handleRemove() {
    setVideoUrl(null)
    setDurationSec(null)
    if (fileRef.current) fileRef.current.value = ''

    // Persist removal to server so the video doesn't reappear on refresh
    await fetch(`/api/scenes/${sceneId}/video`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey: null, durationSec: null }),
    })
    router.refresh()
  }

  if (videoUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black group aspect-video ring-1 ring-white/5 panel-inset">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-full object-contain"
          preload="metadata"
        />
        {!readOnly && (
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove video"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {durationSec && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono tabular-nums">
            {Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, '0')}
          </span>
        )}
      </div>
    )
  }

  if (readOnly) {
    return (
      <div className="relative aspect-video rounded-xl border border-border bg-card/30 flex flex-col items-center justify-center gap-3">
        <Film className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No video uploaded</p>
      </div>
    )
  }

  return (
    <div
      onClick={() => fileRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'relative aspect-video rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-3 transition-all duration-300',
        dragging
          ? 'border-primary bg-primary/5 shadow-[0_0_20px_-5px] shadow-primary/30'
          : 'border-border hover:border-foreground/30 bg-card/30'
      )}
    >
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
      />

      {uploading ? (
        <div className="text-center px-8 w-full">
          <Film className="h-6 w-6 mx-auto text-muted-foreground mb-3" />
          <div className="w-full bg-secondary rounded-full h-1.5 mb-2">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Uploading…{progress}%</p>
        </div>
      ) : (
        <div className="text-center">
          <Film className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">Drop scene clip or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">MP4, MOV, WebM accepted</p>
        </div>
      )}
    </div>
  )
}
