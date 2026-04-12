import { NextRequest, NextResponse } from 'next/server'
import { createSceneCard, getProject } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { project_id, label, cue_number, sort_order } = await req.json()

  if (!project_id || !label?.trim()) {
    return NextResponse.json({ error: 'project_id and label required' }, { status: 400 })
  }

  const project = await getProject(project_id, user.id)
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const scene = await createSceneCard({
    project_id,
    label: label.trim(),
    cue_number: cue_number ?? null,
    sort_order: sort_order ?? 0,
    tc_in_smpte: null,
    tc_out_smpte: null,
    picture_version_label: null,
    video_file_key: null,
    video_duration_sec: null,
    status: 'untagged',
    created_by: user.id,
  })

  return NextResponse.json({ scene })
}
