/**
 * PATCH /api/scenes/[sceneId]/poster
 *
 * Records a poster image (a single still frame "stripped" from the scene's
 * video clip via the cue editor's Strip frame affordance) on the scene card.
 * Pass `fileKey: null` to detach the poster — the prior R2 object is cleaned
 * up best-effort after the row is updated.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSceneCard, updateSceneCard } from '@/lib/store'
import { requireApiSession, assertCanDirectScene } from '@/lib/api-auth'
import { deleteStorageObject } from '@/lib/storage'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const { sceneId } = await params
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const denied = await assertCanDirectScene(profile, sceneId)
  if (denied) return denied

  const { fileKey } = (await req.json().catch(() => ({}))) as { fileKey?: string | null }

  if (fileKey === undefined) {
    return NextResponse.json({ error: 'fileKey required' }, { status: 400 })
  }

  const existing = await getSceneCard(sceneId)
  const priorKey = existing?.poster_file_key ?? null

  await updateSceneCard(sceneId, { poster_file_key: fileKey })

  // Best-effort cleanup of the prior poster once the row no longer points at it.
  if (priorKey && priorKey !== fileKey) {
    deleteStorageObject(priorKey).catch(() => { /* best-effort */ })
  }

  return NextResponse.json({ ok: true })
}
