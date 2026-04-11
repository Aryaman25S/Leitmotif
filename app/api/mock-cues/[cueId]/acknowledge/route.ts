/**
 * POST /api/mock-cues/[cueId]/acknowledge
 *
 * Called by the composer from the /brief page.
 * Records that the composer has received and reviewed the brief.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockCue, updateMockCue, now } from '@/lib/store'

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

  await updateMockCue(cueId, {
    composer_acknowledged: true,
    composer_acknowledged_at: now(),
    composer_notes: notes?.trim() || null,
  })

  return NextResponse.json({ ok: true })
}
