import { NextRequest, NextResponse } from 'next/server'
import { getProject, updateProject, getGenerationSettings, upsertGenerationSettings } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await params
  const project = await getProject(projectId, user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const settings = await getGenerationSettings(projectId, user.id)

  return NextResponse.json({ project, settings, members: [] })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await params
  const body = await req.json()

  const existing = await getProject(projectId, user.id)
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const project = await updateProject(projectId, {
    title: body.title,
    tone_brief: body.tone_brief,
    format: body.format,
  })

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.settings) {
    await upsertGenerationSettings({
      project_id: projectId,
      ...body.settings,
      model_provider: 'stable_audio',
    })
  }

  return NextResponse.json({ ok: true, project })
}
