/**
 * POST /api/scenes/[sceneId]/generate
 *
 * Creates a GenerationJob and kicks off background generation.
 * Uses Next.js after() to keep the serverless function alive after responding.
 */

import { NextRequest, NextResponse, after } from 'next/server'
import {
  getIntent,
  getSceneCard,
  createJob,
  updateJob,
  createMockCue,
  getMockCues,
  updateSceneCard,
  uid,
  now,
} from '@/lib/store'
import { generateWithStableAudio } from '@/lib/generation/stableAudio'
import { saveFile } from '@/lib/storage'
import { getMockUser } from '@/lib/mock-auth'

export const maxDuration = 60

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const { sceneId } = await params
  const user = getMockUser()

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

  after(async () => {
    await runGenerationAsync(
      job.id, sceneId, intent.positive_prompt!, intent.negative_prompt ?? '',
      durationSec, scene?.label ?? 'scene', intentVersionId, user.id
    )
  })

  return NextResponse.json({ jobId: job.id })
}

async function runGenerationAsync(
  jobId: string,
  sceneId: string,
  positivePrompt: string,
  negativePrompt: string,
  durationSec: number,
  sceneLabel: string,
  intentVersionId: string,
  userId: string
) {
  await updateJob(jobId, { status: 'processing', started_at: now() })

  try {
    const { buffer: audioBuffer, source: audioSource } = await generateWithStableAudio(
      positivePrompt,
      negativePrompt,
      durationSec
    )

    const existingCues = await getMockCues(sceneId)
    const versionNumber = existingCues.length + 1
    const safeLabel = sceneLabel.replace(/[^a-zA-Z0-9_\-]/g, '_')
    const fileName = `${safeLabel}_mock_v${versionNumber}_REFERENCE_ONLY.wav`
    const fileKey = await saveFile('mock-cues', `${sceneId}_${uid()}.wav`, audioBuffer)

    await createMockCue({
      generation_job_id: jobId,
      scene_card_id: sceneId,
      intent_version_id: intentVersionId,
      version_number: versionNumber,
      file_key: fileKey,
      file_name: fileName,
      duration_sec: durationSec,
      is_mock: audioSource === 'silent_mock',
      is_approved: false,
      approved_by: null,
      approved_at: null,
      composer_acknowledged: false,
      composer_acknowledged_at: null,
      composer_notes: null,
    })

    await updateJob(jobId, { status: 'completed', completed_at: now() })
    await updateSceneCard(sceneId, { status: 'awaiting_approval' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    await updateJob(jobId, { status: 'failed', error_message: message })
    await updateSceneCard(sceneId, { status: 'tagged' })
    console.error('[generate] Failed:', message)
  }
}
