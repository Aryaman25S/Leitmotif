import { NextRequest, NextResponse } from 'next/server'
import { getLatestJob, getMockCues, getSceneCard } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sceneId } = await params
  const scene = await getSceneCard(sceneId, user.id)
  if (!scene) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const latestJob = await getLatestJob(sceneId, user.id)
  const mockCues = await getMockCues(sceneId, user.id)

  return NextResponse.json({
    jobStatus: latestJob?.status ?? null,
    mockCues,
  })
}
