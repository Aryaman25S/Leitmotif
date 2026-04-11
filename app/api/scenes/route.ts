import { NextRequest, NextResponse } from 'next/server'
import { createSceneCard } from '@/lib/store'
import { getMockUser } from '@/lib/mock-auth'

export async function POST(req: NextRequest) {
  const user = getMockUser()
  const { project_id, label, cue_number, sort_order } = await req.json()

  if (!project_id || !label?.trim()) {
    return NextResponse.json({ error: 'project_id and label required' }, { status: 400 })
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
