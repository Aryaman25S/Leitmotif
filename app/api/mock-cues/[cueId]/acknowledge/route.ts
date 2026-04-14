/**
 * POST /api/mock-cues/[cueId]/acknowledge
 *
 * Called by the composer from the /brief page.
 * Records that the composer has received and reviewed the brief.
 *
 * Allowed for:
 * - Logged-in project members with composer/sound_designer role
 * - Unauthenticated callers (public brief link IS the access control for
 *   external composers who aren't in the system)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockCue, updateMockCue, now } from '@/lib/store'
import { getSessionProfileFromRequest } from '@/lib/session'
import { assertCanAcknowledgeCue } from '@/lib/api-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cueId: string }> }
) {
  const { cueId } = await params
  const { notes } = await req.json().catch(() => ({ notes: null }))

  const cue = await getMockCue(cueId)
  if (!cue || !cue.is_approved) {
    return NextResponse.json({ error: 'Not found or not approved' }, { status: 404 })
  }

  const profile = await getSessionProfileFromRequest(req)
  if (profile) {
    const denied = await assertCanAcknowledgeCue(profile, cueId)
    if (denied) return denied
  }

  await updateMockCue(cueId, {
    composer_acknowledged: true,
    composer_acknowledged_at: now(),
    composer_notes: notes?.trim() || null,
  })

  return NextResponse.json({ ok: true })
}
