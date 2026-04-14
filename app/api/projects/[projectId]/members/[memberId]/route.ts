/**
 * DELETE /api/projects/[projectId]/members/[memberId]
 *
 * Remove a collaborator (pending invite or accepted member). Project owner only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getProject, deleteProjectMember } from '@/lib/store'
import { requireApiSession, assertProjectAccess } from '@/lib/api-auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; memberId: string }> }
) {
  const { projectId, memberId } = await params
  const profile = await requireApiSession(_req)
  if (profile instanceof NextResponse) return profile

  const denied = await assertProjectAccess(profile, projectId)
  if (denied) return denied

  const project = await getProject(projectId)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (project.owner_id !== profile.id) {
    return NextResponse.json({ error: 'Only the project owner can remove collaborators' }, { status: 403 })
  }

  const removed = await deleteProjectMember(memberId, projectId)
  if (!removed) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
