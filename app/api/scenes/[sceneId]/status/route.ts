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

  // Surface the failure reason when a job has failed so the cue editor can
  // show it instead of a silent dead-end. error_message is only meaningful
  // when status is 'failed'; null otherwise.
  const jobError =
    latestJob?.status === 'failed' ? latestJob.error_message ?? null : null

  return NextResponse.json({
    jobStatus: latestJob?.status ?? null,
    jobError,
    mockCues: cuesWithProvider,
  })
}
