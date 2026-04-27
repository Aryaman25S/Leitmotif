/**
 * DELETE /api/mock-cues/[cueId]
 *
 * Removes a mock cue row and its audio file. Approved cues return 409 until unapproved.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockCue, deleteMockCue } from '@/lib/store'
import { requireApiSession, assertCanDirectScene } from '@/lib/api-auth'
import { deleteStorageObject } from '@/lib/storage'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ cueId: string }> }
) {
  const { cueId } = await params
  const user = await requireApiSession(_req)
  if (user instanceof NextResponse) return user

  const cue = await getMockCue(cueId)
  if (!cue) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const denied = await assertCanDirectScene(user, cue.scene_card_id)
  if (denied) return denied

  if (cue.is_approved) {
    return NextResponse.json(
      {
        error:
          'This cue is approved for the composer brief. Withdraw approval first, then you can delete it.',
      },
      { status: 409 }
    )
  }

  const fileKey = cue.file_key
  const ok = await deleteMockCue(cueId)
  if (!ok) return NextResponse.json({ error: 'Failed to delete cue' }, { status: 500 })

  await deleteStorageObject(fileKey)

  return NextResponse.json({ ok: true })
}
