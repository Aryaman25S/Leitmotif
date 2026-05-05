import { NextRequest, NextResponse } from 'next/server'
import { createReel } from '@/lib/store'
import { requireApiSession, assertCanDirectProject } from '@/lib/api-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user

  const denied = await assertCanDirectProject(user, projectId)
  if (denied) return denied

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name : undefined

  const reel = await createReel(projectId, name)
  return NextResponse.json({ reel })
}

// TODO: PATCH (rename) and DELETE on /api/projects/[projectId]/reels/[reelId].
// TODO: PATCH for cue_position reordering — needs a transactional swap so
// unique (project_id, cue_position) holds throughout.
