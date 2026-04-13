import { NextRequest, NextResponse } from 'next/server'
import { createProject, upsertGenerationSettings } from '@/lib/store'
import { requireApiSession } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user
  const { title, format, tone_brief } = await req.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }

  const project = await createProject({
    title: title.trim(),
    format: format ?? 'feature',
    tone_brief: tone_brief ?? null,
    owner_id: user.id,
  })

  // Create default generation settings for this project
  await upsertGenerationSettings({
    project_id: project.id,
    instrumentation_families: [],
    era_reference: null,
    budget_reality: 'hybrid',
    do_not_generate: null,
    model_provider: 'stable_audio',
  })

  return NextResponse.json({ project })
}
