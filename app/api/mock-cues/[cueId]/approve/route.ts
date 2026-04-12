/**
 * POST /api/mock-cues/[cueId]/approve
 *
 * Marks the cue as approved and exposes /brief/[cueId]. Delivery is link-based only —
 * add email/Slack notification here for production.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockCue, getMockCues, updateMockCue, updateSceneCard, now } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ cueId: string }> }
) {
  const { cueId } = await params
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cue = await getMockCue(cueId, user.id)
  if (!cue) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Un-approve any previously approved cues for this scene so there is always
  // exactly one active brief at a time
  const siblings = await getMockCues(cue.scene_card_id, user.id)
  await Promise.all(
    siblings
      .filter((c) => c.is_approved && c.id !== cueId)
      .map((c) => updateMockCue(c.id, { is_approved: false, approved_by: null, approved_at: null }))
  )

  await updateMockCue(cueId, {
    is_approved: true,
    approved_by: user.id,
    approved_at: now(),
  })

  await updateSceneCard(cue.scene_card_id, { status: 'brief_sent' })

  // TODO: production — notify composer (e.g. Resend) with brief URL; optional Slack webhook.

  return NextResponse.json({ ok: true })
}
