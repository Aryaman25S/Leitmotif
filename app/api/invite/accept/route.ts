import { NextRequest, NextResponse } from 'next/server'
import { acceptProjectInviteByToken } from '@/lib/store'
import { getMockUser } from '@/lib/mock-auth'

/**
 * POST /api/invite/accept
 * Body: { token: string } — magic token from project invite.
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }

  const user = getMockUser()
  const result = await acceptProjectInviteByToken(token, user.id)
  if (!result) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, projectId: result.project_id })
}
