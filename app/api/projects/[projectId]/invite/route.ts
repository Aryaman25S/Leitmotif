/**
 * POST /api/projects/[projectId]/invite
 *
 * Invite a collaborator to a project.
 * In local dev, just creates the project_member record — no email is sent.
 *
 * TODO: In production, send invite email via Resend.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  await params
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
