/**
 * POST /api/mock-cues/[cueId]/score
 *
 * Marks a brief as scored — the composer (or director) has finished writing
 * the real music for this cue. Records the timestamp + actor on MockCue.
 * The cue editor's status vocabulary already reads from these fields and
 * promotes the row to `scored` state on the production binder.
 *
 * DELETE on the same path clears the marker (un-score) — useful if marked
 * by accident or if the cue is re-opened.
 *
 * Auth: signed-in project member, any role. Same posture as acknowledge —
 * marking-as-scored is a low-stakes "this is done" signal, not a privileged
 * action. The "should we surface the score-it action to this user?" question
 * is a separate UI decision (today we surface it on the brief receipt to
 * the composer + director; the API doesn't gate further).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockCue, updateMockCue, now } from '@/lib/store'
import { requireApiSession, assertCanAcknowledgeCue } from '@/lib/api-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cueId: string }> }
) {
  const { cueId } = await params
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const cue = await getMockCue(cueId)
  if (!cue || !cue.is_approved) {
    return NextResponse.json({ error: 'Not found or not approved' }, { status: 404 })
  }

  const denied = await assertCanAcknowledgeCue(profile, cueId)
  if (denied) return denied

  await updateMockCue(cueId, {
    scored_at: now(),
    scored_by: profile.id,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ cueId: string }> }
) {
  const { cueId } = await params
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const cue = await getMockCue(cueId)
  if (!cue) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const denied = await assertCanAcknowledgeCue(profile, cueId)
  if (denied) return denied

  await updateMockCue(cueId, {
    scored_at: null,
    scored_by: null,
  })

  return NextResponse.json({ ok: true })
}
