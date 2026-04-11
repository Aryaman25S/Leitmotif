/**
 * POST /api/projects/[projectId]/invite
 *
 * Invite a collaborator to a project.
 * In local dev, just creates the project_member record — no email is sent.
 *
 * TODO: In production, send invite email via Resend.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getProject, createProjectMember, getProjectMembers, uid } from '@/lib/store'
import { getMockUser } from '@/lib/mock-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const user = getMockUser()

  const { email, role } = await req.json()
  if (!email || !role) {
    return NextResponse.json({ error: 'email and role required' }, { status: 400 })
  }

  const project = await getProject(projectId)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const existing = await getProjectMembers(projectId)
  if (existing.some((m) => m.invite_email === email)) {
    return NextResponse.json({ error: 'Already invited' }, { status: 409 })
  }

  const member = await createProjectMember({
    project_id: projectId,
    user_id: null,
    invite_email: email,
    role_on_project: role,
    magic_token: uid(),
    can_edit: role !== 'viewer',
    accepted_at: null,
  })

  // TODO: In production, send invite email here (Resend or similar) with magic link.
  console.log(`[invite] ${user.email} invited ${email} as ${role} to "${project.title}"`)

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (typeof process.env.VERCEL_URL === 'string' ? `https://${process.env.VERCEL_URL}` : '')

  const invitePath = member.magic_token ? `/invite/${member.magic_token}` : null
  const inviteUrl = base && invitePath ? `${base}${invitePath}` : invitePath

  return NextResponse.json({
    ok: true,
    inviteToken: member.magic_token,
    invitePath,
    inviteUrl: inviteUrl ?? null,
    projectId,
  })
}
