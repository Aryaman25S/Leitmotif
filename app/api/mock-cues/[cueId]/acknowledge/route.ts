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
  const body = await req.json().catch(() => ({}))
  const notes: string | null = typeof body.notes === 'string' ? body.notes : null
  const signedName: string | null =
    typeof body.signed_name === 'string' ? body.signed_name : null
  const signedInitials: string | null =
    typeof body.signed_initials === 'string' ? body.signed_initials : null

  const cue = await getMockCue(cueId)
  if (!cue || !cue.is_approved) {
    return NextResponse.json({ error: 'Not found or not approved' }, { status: 404 })
  }

  const profile = await getSessionProfileFromRequest(req)
  if (profile) {
    const denied = await assertCanAcknowledgeCue(profile, cueId)
    if (denied) return denied
  }

  // Trim and bound the signature inputs server-side so a paste of a wall of
  // text can't sneak past the small-text input. Initials cap at 6 to mirror
  // the receipt's `maxLength`.
  await updateMockCue(cueId, {
    composer_acknowledged: true,
    composer_acknowledged_at: now(),
    composer_notes: notes?.trim() || null,
    composer_signed_name: signedName?.trim().slice(0, 80) || null,
    composer_signed_initials: signedInitials?.trim().slice(0, 6) || null,
  })

  return NextResponse.json({ ok: true })
}
