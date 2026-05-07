/**
 * PATCH /api/scenes/[sceneId]/video
 *
 * Updates the scene card with the uploaded video file key and duration.
 * When the file is readable from storage, duration is re-checked server-side
 * (music-metadata — no ffprobe binary; works on Vercel).
 *
 * When the scene already has a video_file_key, the prior object in storage is
 * cleaned up best-effort after the row is updated. Pass `fileKey: null` to
 * detach the clip entirely (also cleans up the old object).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSceneCard, updateSceneCard } from '@/lib/store'
import { requireApiSession, assertCanDirectScene } from '@/lib/api-auth'
import { deleteStorageObject, readFileBuffer } from '@/lib/storage'
import { probeVideoDurationSec } from '@/lib/videoDuration'

export const maxDuration = 60

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const { sceneId } = await params
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const denied = await assertCanDirectScene(profile, sceneId)
  if (denied) return denied

  const { fileKey, durationSec: clientDurationSec } = await req.json()

  if (fileKey === undefined) return NextResponse.json({ error: 'fileKey required' }, { status: 400 })

  const existing = await getSceneCard(sceneId)
  const priorKey = existing?.video_file_key ?? null

  let durationSec: number | null =
    typeof clientDurationSec === 'number' && Number.isFinite(clientDurationSec)
      ? clientDurationSec
      : null

  if (fileKey) {
    const buf = await readFileBuffer(fileKey)
    if (buf) {
      const probed = await probeVideoDurationSec(buf)
      if (probed != null && probed > 0) {
        durationSec = probed
      }
    }
  } else {
    durationSec = null
  }

  await updateSceneCard(sceneId, {
    video_file_key: fileKey,
    video_duration_sec: durationSec,
  })

  // Best-effort cleanup of the prior object once the row no longer points at it.
  if (priorKey && priorKey !== fileKey) {
    deleteStorageObject(priorKey).catch(() => { /* best-effort */ })
  }

  return NextResponse.json({ ok: true, durationSec })
}
