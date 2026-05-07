/**
 * POST /api/projects/[projectId]/invite
 *
 * Invite a collaborator to a project. Creates the pending `project_member` row.
 * When `RESEND_API_KEY` and `RESEND_FROM` are set, sends an invite email with the accept link.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getProject, createProjectMember, getProjectMembers, uid } from '@/lib/store'
import { requireApiSession, assertProjectAccess } from '@/lib/api-auth'
import { buildAppUrl } from '@/lib/public-url'
import { isResendConfigured, sendProjectInviteEmail } from '@/lib/mail/resend'
import { isValidProjectRole, formatRoleLabel } from '@/lib/roles'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user

  const { email, role, note } = await req.json()
  if (!email || !role) {
    return NextResponse.json({ error: 'email and role required' }, { status: 400 })
  }
  if (!isValidProjectRole(role)) {
    return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 })
  }
  const trimmedNote = typeof note === 'string' ? note.trim().slice(0, 800) : null

  const denied = await assertProjectAccess(user, projectId)
  if (denied) return denied

  const project = await getProject(projectId)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (project.owner_id !== user.id) {
    return NextResponse.json({ error: 'Only the project owner can invite' }, { status: 403 })
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
    accepted_at: null,
  })

  const invitePath = member.magic_token ? `/invite/${member.magic_token}` : null
  const inviteUrl = invitePath ? buildAppUrl(invitePath, req) : null

  let emailSent = false
  let emailWarning: string | undefined

  if (isResendConfigured()) {
    if (!inviteUrl) {
      emailWarning =
        'Invite saved but email not sent: set NEXT_PUBLIC_APP_URL or BETTER_AUTH_URL (or rely on VERCEL_URL) so the accept link can be included.'
    } else {
      const inviterDisplay = (user.name?.trim() || user.email).trim()
      const send = await sendProjectInviteEmail({
        to: email.trim(),
        projectTitle: project.title,
        inviterDisplay,
        inviterEmail: user.email,
        inviteUrl,
        roleLabel: formatRoleLabel(role),
        note: trimmedNote,
      })
      if (send.ok) {
        emailSent = true
      } else {
        emailWarning = `Invite saved but email failed: ${send.message}`
        console.warn('[invite] Resend:', send.message)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    inviteToken: member.magic_token,
    invitePath,
    inviteUrl: inviteUrl ?? null,
    projectId,
    emailSent,
    ...(emailWarning ? { emailWarning } : {}),
  })
}
