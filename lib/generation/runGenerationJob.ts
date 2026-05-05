import {
  updateJob,
  createMockCue,
  getMockCues,
  updateSceneCard,
  uid,
  now,
} from '@/lib/store'
import { generateWithStableAudio } from '@/lib/generation/stableAudio'
import { generateWithLyria } from '@/lib/generation/lyria'
import { saveFile } from '@/lib/storage'

export interface GenerationJobPayload {
  jobId: string
  sceneId: string
  positivePrompt: string
  negativePrompt: string
  durationSec: number
  sceneLabel: string
  intentVersionId: string
  modelProvider?: string
  /** Single combined prompt for Lyria (includes exclusions). */
  lyriaPrompt?: string
}

export async function runGenerationJob(payload: GenerationJobPayload): Promise<void> {
  const {
    jobId,
    sceneId,
    positivePrompt,
    negativePrompt,
    durationSec,
    sceneLabel,
    intentVersionId,
    modelProvider = 'lyria',
    lyriaPrompt,
  } = payload

  await updateJob(jobId, { status: 'processing', started_at: now() })
  console.info('[leitmotif:generate] start', { jobId, sceneId, intentVersionId, durationSec, modelProvider })

  try {
    let audioBuffer: Buffer
    let isMock = false

    if (modelProvider === 'lyria' && lyriaPrompt) {
      const result = await generateWithLyria(lyriaPrompt, durationSec)
      audioBuffer = result.buffer
      isMock = result.source === 'silent_mock'
    } else {
      const result = await generateWithStableAudio(positivePrompt, negativePrompt, durationSec)
      audioBuffer = result.buffer
      isMock = result.source === 'silent_mock'
    }

    const existingCues = await getMockCues(sceneId)
    const maxVersion = existingCues.reduce((m, c) => Math.max(m, c.version_number), 0)
    const versionNumber = maxVersion + 1
    const safeLabel = sceneLabel.replace(/[^a-zA-Z0-9_\-]/g, '_')

    const isWav = audioBuffer.length >= 12 &&
      audioBuffer.toString('ascii', 0, 4) === 'RIFF' &&
      audioBuffer.toString('ascii', 8, 12) === 'WAVE'
    const ext = isWav ? 'wav' : 'mp3'

    const fileName = `${safeLabel}_mock_v${versionNumber}_REFERENCE_ONLY.${ext}`
    const fileKey = await saveFile('mock-cues', `${sceneId}_${uid()}.${ext}`, audioBuffer)

    await createMockCue({
      generation_job_id: jobId,
      scene_card_id: sceneId,
      intent_version_id: intentVersionId,
      version_number: versionNumber,
      file_key: fileKey,
      file_name: fileName,
      duration_sec: durationSec,
      is_mock: isMock,
      is_approved: false,
      approved_by: null,
      approved_at: null,
      composer_acknowledged: false,
      composer_acknowledged_at: null,
      composer_notes: null,
      scored_at: null,
      scored_by: null,
    })

    await updateJob(jobId, { status: 'completed', completed_at: now() })
    await updateSceneCard(sceneId, { status: 'awaiting_approval' })
    console.info('[leitmotif:generate] completed', { jobId, sceneId, modelProvider })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    await updateJob(jobId, { status: 'failed', error_message: message })
    await updateSceneCard(sceneId, { status: 'tagged' })
    console.error('[leitmotif:generate] failed', { jobId, sceneId, message })
  }
}
