import { NextRequest, NextResponse } from 'next/server'
import { createSceneCard } from '@/lib/store'
import { prisma } from '@/lib/prisma'
import { requireApiSession, assertCanDirectProject } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user

  const { project_id, reel_id, label, cue_number, sort_order } = await req.json()

  if (!project_id || !label?.trim()) {
    return NextResponse.json({ error: 'project_id and label required' }, { status: 400 })
  }

  const denied = await assertCanDirectProject(user, project_id)
  if (denied) return denied

  // If no reel_id is supplied, append to the last (highest cue_position) reel.
  // The default Reel 1 always exists post-migration, so we don't need a
  // create-on-demand path here.
  let targetReelId: string
  if (reel_id) {
    const reel = await prisma.reel.findFirst({
      where: { id: reel_id, project_id },
      select: { id: true },
    })
    if (!reel) {
      return NextResponse.json({ error: 'Reel not found in this project' }, { status: 404 })
    }
    targetReelId = reel.id
  } else {
    const last = await prisma.reel.findFirst({
      where: { project_id },
      orderBy: { cue_position: 'desc' },
      select: { id: true },
    })
    if (!last) {
      return NextResponse.json({ error: 'Project has no reels' }, { status: 500 })
    }
    targetReelId = last.id
  }

  const scene = await createSceneCard({
    project_id,
    reel_id: targetReelId,
    label: label.trim(),
    cue_number: cue_number ?? null,
    sort_order: sort_order ?? 0,
    tc_in_smpte: null,
    tc_out_smpte: null,
    picture_version_label: null,
    video_file_key: null,
    video_duration_sec: null,
    status: 'untagged',
    director_note: null,
    created_by: user.id,
  })

  return NextResponse.json({ scene })
}
