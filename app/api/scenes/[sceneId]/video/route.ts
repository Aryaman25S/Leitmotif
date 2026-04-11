/**
 * PATCH /api/scenes/[sceneId]/video
 *
 * Updates the scene card with the uploaded video file key and duration.
 * Duration is read from a client-provided value (from the HTML video element).
 *
 * TODO: For production, extract duration server-side via ffprobe.
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateSceneCard } from '@/lib/store'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const { sceneId } = await params
  const { fileKey, durationSec } = await req.json()

  if (fileKey === undefined) return NextResponse.json({ error: 'fileKey required' }, { status: 400 })

  await updateSceneCard(sceneId, {
    video_file_key: fileKey,
    video_duration_sec: durationSec ?? null,
  })

  return NextResponse.json({ ok: true })
}
