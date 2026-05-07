/**
 * /api/projects/[projectId]/reels/[reelId]
 *
 *   PATCH  — rename the reel ({ name }).
 *   DELETE — remove the reel. Blocks when the reel still contains scenes
 *           (move them out first) and when it's the project's last reel
 *           (the binder requires at least one). Renumbers subsequent reels
 *           to close the position gap.
 *
 * Director-only on all methods.
 */

import { NextRequest, NextResponse } from 'next/server'
import { renameReel, deleteReel } from '@/lib/store'
import { requireApiSession, assertCanDirectProject } from '@/lib/api-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; reelId: string }> }
) {
  const { projectId, reelId } = await params
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user

  const denied = await assertCanDirectProject(user, projectId)
  if (denied) return denied

  const body = (await req.json().catch(() => ({}))) as { name?: string }

  if (typeof body.name === 'string') {
    const reel = await renameReel(projectId, reelId, body.name)
    if (!reel) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; reelId: string }> }
) {
  const { projectId, reelId } = await params
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user

  const denied = await assertCanDirectProject(user, projectId)
  if (denied) return denied

  const result = await deleteReel(projectId, reelId)
  if (result.ok) return NextResponse.json({ ok: true })

  if (result.code === 'has_scenes') {
    return NextResponse.json(
      {
        error: `Move ${result.sceneCount} ${result.sceneCount === 1 ? 'cue' : 'cues'} out of this reel before deleting it.`,
        code: 'has_scenes',
        sceneCount: result.sceneCount,
      },
      { status: 409 },
    )
  }
  if (result.code === 'last_reel') {
    return NextResponse.json(
      { error: 'A project keeps at least one reel.', code: 'last_reel' },
      { status: 409 },
    )
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
