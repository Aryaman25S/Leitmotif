import { NextRequest, NextResponse } from 'next/server'
import { getProject, updateProject, getGenerationSettings, upsertGenerationSettings, getProjectMembers } from '@/lib/store'
import { requireApiSession, assertProjectAccess, assertCanDirectProject, getProjectRole } from '@/lib/api-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const denied = await assertProjectAccess(profile, projectId)
  if (denied) return denied

  const project = await getProject(projectId)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const settings = await getGenerationSettings(projectId)
  const members = await getProjectMembers(projectId)
  const viewerRole = await getProjectRole(profile, projectId)

  return NextResponse.json({
    project,
    settings,
    members,
    viewerIsOwner: project.owner_id === profile.id,
    viewerRole,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const denied = await assertCanDirectProject(profile, projectId)
  if (denied) return denied

  const body = await req.json()

  const project = await updateProject(projectId, {
    title: body.title,
    tone_brief: body.tone_brief,
    format: body.format,
  })

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.settings) {
    const validProviders = ['stable_audio', 'lyria']
    const provider = validProviders.includes(body.settings.model_provider)
      ? body.settings.model_provider
      : 'lyria'
    await upsertGenerationSettings({
      project_id: projectId,
      ...body.settings,
      model_provider: provider,
    })
  }

  return NextResponse.json({ ok: true, project })
}
