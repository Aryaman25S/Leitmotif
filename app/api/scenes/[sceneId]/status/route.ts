import { NextRequest, NextResponse } from 'next/server'
import { getLatestJob, getMockCues } from '@/lib/store'
import { requireApiSession, assertSceneAccess } from '@/lib/api-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const { sceneId } = await params
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const denied = await assertSceneAccess(profile, sceneId)
  if (denied) return denied

  const latestJob = await getLatestJob(sceneId)
  const mockCues = await getMockCues(sceneId)

  return NextResponse.json({
    jobStatus: latestJob?.status ?? null,
    mockCues,
  })
}
