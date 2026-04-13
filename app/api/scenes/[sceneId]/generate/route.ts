/**
 * POST /api/scenes/[sceneId]/generate
 *
 * Creates a GenerationJob and kicks off background generation.
 * When INNGEST_EVENT_KEY is set, work is queued on Inngest; otherwise uses Next.js after().
 */

import { NextRequest, NextResponse, after } from 'next/server'
import {
  getIntent,
  getSceneCard,
  createJob,
  updateSceneCard,
} from '@/lib/store'
import { requireApiSession, assertSceneAccess } from '@/lib/api-auth'
import { runGenerationJob } from '@/lib/generation/runGenerationJob'
import { inngest } from '@/inngest/client'

export const maxDuration = 60

const useInngestQueue = Boolean(process.env.INNGEST_EVENT_KEY?.trim())

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const { sceneId } = await params
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user

  const denied = await assertSceneAccess(user, sceneId)
  if (denied) return denied

  const { intentVersionId } = await req.json()
  if (!intentVersionId) {
    return NextResponse.json({ error: 'intentVersionId required' }, { status: 400 })
  }

  const intent = await getIntent(intentVersionId)
  if (!intent || intent.scene_card_id !== sceneId) {
    return NextResponse.json({ error: 'Intent not found' }, { status: 404 })
  }

  if (!intent.positive_prompt) {
    return NextResponse.json({ error: 'Intent has no generation prompt. Save intent first.' }, { status: 400 })
  }

  const scene = await getSceneCard(sceneId)
  const durationSec = Math.min(Math.max(scene?.video_duration_sec ?? 60, 5), 190)

  const job = await createJob({
    scene_card_id: sceneId,
    intent_version_id: intentVersionId,
    model_provider: 'stable_audio',
    positive_prompt: intent.positive_prompt,
    negative_prompt: intent.negative_prompt,
    duration_sec: durationSec,
    status: 'queued',
    error_message: null,
    started_at: null,
    completed_at: null,
    created_by: user.id,
  })

  await updateSceneCard(sceneId, { status: 'generating' })

  const payload = {
    jobId: job.id,
    sceneId,
    positivePrompt: intent.positive_prompt,
    negativePrompt: intent.negative_prompt ?? '',
    durationSec,
    sceneLabel: scene?.label ?? 'scene',
    intentVersionId,
  }

  if (useInngestQueue) {
    await inngest.send({
      name: 'leitmotif/generation.requested',
      data: payload,
    })
  } else {
    after(async () => {
      await runGenerationJob(payload)
    })
  }

  return NextResponse.json({ jobId: job.id })
}
