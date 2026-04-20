import { NextRequest, NextResponse } from 'next/server'
import { getLatestJob, getMockCues } from '@/lib/store'
import { requireApiSession, assertSceneAccess } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

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

  const jobIds = [...new Set(mockCues.map((c) => c.generation_job_id))]
  const jobs = jobIds.length
    ? await prisma.generationJob.findMany({
        where: { id: { in: jobIds } },
        select: { id: true, model_provider: true },
      })
    : []
  const providerByJob = Object.fromEntries(jobs.map((j) => [j.id, j.model_provider]))

  const cuesWithProvider = mockCues.map((c) => ({
    ...c,
    model_provider: providerByJob[c.generation_job_id] ?? null,
  }))

  return NextResponse.json({
    jobStatus: latestJob?.status ?? null,
    mockCues: cuesWithProvider,
  })
}
