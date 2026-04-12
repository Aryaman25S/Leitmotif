import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/invite/accept
 * Body: { token: string } — magic token from project invite.
 */
export async function POST(req: NextRequest) {
  void req
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
