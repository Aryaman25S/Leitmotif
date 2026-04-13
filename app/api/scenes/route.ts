import { NextRequest, NextResponse } from 'next/server'
import { createSceneCard } from '@/lib/store'
import { requireApiSession, assertProjectAccess } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user

  const { project_id, label, cue_number, sort_order } = await req.json()

  if (!project_id || !label?.trim()) {
    return NextResponse.json({ error: 'project_id and label required' }, { status: 400 })
  }

  const denied = await assertProjectAccess(user, project_id)
  if (denied) return denied

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
