import { NextRequest, NextResponse } from 'next/server'
import { getLatestJob, getMockCues } from '@/lib/store'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const { sceneId } = await params

  const latestJob = await getLatestJob(sceneId)
  const mockCues = await getMockCues(sceneId)

  return NextResponse.json({
    jobStatus: latestJob?.status ?? null,
    mockCues,
  })
}
