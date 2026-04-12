/**
 * PATCH /api/scenes/[sceneId]/video
 *
 * Updates the scene card with the uploaded video file key and duration.
 * When the file is readable from storage, duration is re-checked server-side
 * (music-metadata — no ffprobe binary; works on Vercel).
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateSceneCard } from '@/lib/store'
import { readFileBuffer } from '@/lib/storage'
import { probeVideoDurationSec } from '@/lib/videoDuration'

export const maxDuration = 60

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const { sceneId } = await params
  const { fileKey, durationSec: clientDurationSec } = await req.json()

  if (fileKey === undefined) return NextResponse.json({ error: 'fileKey required' }, { status: 400 })

  let durationSec: number | null =
    typeof clientDurationSec === 'number' && Number.isFinite(clientDurationSec)
      ? clientDurationSec
      : null

  const buf = await readFileBuffer(fileKey)
  if (buf) {
    const probed = await probeVideoDurationSec(buf)
    if (probed != null && probed > 0) {
      durationSec = probed
    }
  }

  await updateSceneCard(sceneId, {
    video_file_key: fileKey,
    video_duration_sec: durationSec,
  })

  return NextResponse.json({ ok: true, durationSec })
}
