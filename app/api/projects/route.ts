import { NextRequest, NextResponse } from 'next/server'
import { createProject, upsertGenerationSettings } from '@/lib/store'
import { requireApiSession } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user
  const { title, format, tone_brief, runtime_minutes, slate, model_provider } = await req.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }

  const runtime = Number.isFinite(runtime_minutes) && runtime_minutes > 0
    ? Math.round(runtime_minutes)
    : null
  const slateClean = typeof slate === 'string' && slate.trim()
    ? slate.trim().slice(0, 16)
    : null
  const provider = model_provider === 'stable_audio' || model_provider === 'lyria'
    ? model_provider
    : 'lyria'

  // createProject creates the default Reel 1 in the same transaction so the
  // binder UI never sees a project without at least one reel.
  const project = await createProject({
    title: title.trim(),
    format: format ?? 'feature',
    tone_brief: tone_brief ?? null,
    runtime_minutes: runtime,
    slate: slateClean,
    owner_id: user.id,
  })

  // Create default generation settings for this project
  await upsertGenerationSettings({
    project_id: project.id,
    instrumentation_families: [],
    era_reference: null,
    budget_reality: 'hybrid',
    do_not_generate: null,
    model_provider: provider,
  })

  return NextResponse.json({ project })
}
