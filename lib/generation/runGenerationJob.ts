import {
  updateJob,
  createMockCue,
  getMockCues,
  updateSceneCard,
  uid,
  now,
} from '@/lib/store'
import { generateWithStableAudio } from '@/lib/generation/stableAudio'
import { saveFile } from '@/lib/storage'

export interface GenerationJobPayload {
  jobId: string
  sceneId: string
  positivePrompt: string
  negativePrompt: string
  durationSec: number
  sceneLabel: string
  intentVersionId: string
}

/** Runs Stable Audio (or silent mock), writes audio to storage, updates DB. */
export async function runGenerationJob(payload: GenerationJobPayload): Promise<void> {
  const {
    jobId,
    sceneId,
    positivePrompt,
    negativePrompt,
    durationSec,
    sceneLabel,
    intentVersionId,
  } = payload

  await updateJob(jobId, { status: 'processing', started_at: now() })
  console.info('[leitmotif:generate] start', { jobId, sceneId, intentVersionId, durationSec })

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
    console.info('[leitmotif:generate] completed', { jobId, sceneId })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    await updateJob(jobId, { status: 'failed', error_message: message })
    await updateSceneCard(sceneId, { status: 'tagged' })
    console.error('[leitmotif:generate] failed', { jobId, sceneId, message })
  }
}
