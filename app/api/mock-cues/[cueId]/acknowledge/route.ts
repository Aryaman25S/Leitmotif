/**
 * POST /api/mock-cues/[cueId]/acknowledge
 *
 * Called by the composer from the /brief page.
 * Records that the composer has received and reviewed the brief.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cueId: string }> }
) {
  void req
  await params
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
