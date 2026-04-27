/**
 * POST /api/mock-cues/[cueId]/unapprove
 *
 * Clears approval so the brief link is no longer active for this cue and the cue can be deleted.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockCue, updateMockCue, updateSceneCard } from '@/lib/store'
import { requireApiSession, assertCanApproveCue } from '@/lib/api-auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ cueId: string }> }
) {
  const { cueId } = await params
  const user = await requireApiSession(_req)
  if (user instanceof NextResponse) return user

  const denied = await assertCanApproveCue(user, cueId)
  if (denied) return denied

  const cue = await getMockCue(cueId)
  if (!cue) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!cue.is_approved) {
    return NextResponse.json({ error: 'Cue is not approved' }, { status: 400 })
  }

  await updateMockCue(cueId, {
    is_approved: false,
    approved_by: null,
    approved_at: null,
  })
  await updateSceneCard(cue.scene_card_id, { status: 'awaiting_approval' })

  return NextResponse.json({ ok: true })
}
