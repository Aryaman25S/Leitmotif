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
  getGenerationSettings,
} from '@/lib/store'
import { requireApiSession, assertCanDirectScene } from '@/lib/api-auth'
import { runGenerationJob } from '@/lib/generation/runGenerationJob'
import { inngest } from '@/inngest/client'
import { buildLyriaPrompt } from '@/lib/prompts/buildGenerationPrompt'
import type { IntentInput, GlobalSettings } from '@/lib/prompts/buildGenerationPrompt'

export const maxDuration = 60

const useInngestQueue = Boolean(process.env.INNGEST_EVENT_KEY?.trim())

function intentToInput(intent: Record<string, unknown>): IntentInput {
  return {
    emotionalAtmospheres: (intent.emotional_atmospheres as string[]) ?? [],
    narrativeFunction: (intent.narrative_function as string) ?? null,
    density: (intent.density as string) ?? null,
    whatWouldBeWrong: (intent.what_would_be_wrong as string) ?? null,
    handoffSetting: (intent.handoff_setting as string) ?? null,
    frequencyNote: (intent.frequency_note as string) ?? null,
    directorWords: (intent.director_words as string) ?? null,
    diegeticStatus: (intent.diegetic_status as string) ?? null,
    targetBpm: (intent.target_bpm as number) ?? null,
    keySignature: (intent.key_signature as string) ?? null,
    featuredInstruments: (intent.featured_instruments as string) ?? null,
    recordingQuality: (intent.recording_quality as string) ?? null,
    workingTitle: (intent.working_title as string) ?? null,
    formatTag: (intent.format_tag as string) ?? null,
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const { sceneId } = await params
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user

  const denied = await assertCanDirectScene(user, sceneId)
  if (denied) return denied

  const body = await req.json()
  const { intentVersionId } = body
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

  const settings = scene?.project_id
    ? await getGenerationSettings(scene.project_id)
    : undefined

  const validProviders = ['stable_audio', 'lyria'] as const
  const requestedProvider = body.modelProvider as string | undefined
  const modelProvider =
    requestedProvider && validProviders.includes(requestedProvider as typeof validProviders[number])
      ? requestedProvider
      : (settings?.model_provider ?? 'lyria')

  let lyriaPrompt: string | undefined
  if (modelProvider === 'lyria') {
    const intentInput = intentToInput(intent as unknown as Record<string, unknown>)
    const globalSettings: GlobalSettings = {
      instrumentationFamilies: settings?.instrumentation_families ?? [],
      eraReference: settings?.era_reference ?? null,
      doNotGenerate: settings?.do_not_generate ?? null,
      budgetReality: settings?.budget_reality ?? null,
      toneBrief: null,
    }
    lyriaPrompt = buildLyriaPrompt(intentInput, globalSettings, durationSec)
  }

  const job = await createJob({
    scene_card_id: sceneId,
    intent_version_id: intentVersionId,
    model_provider: modelProvider,
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
    modelProvider,
    lyriaPrompt,
  }

  if (useInngestQueue) {
    await inngest.send({
      name: 'leitmotif/generation.requested',
      data: payload,
    })
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[leitmotif] INNGEST_EVENT_KEY unset: generation runs via after(); set Inngest for reliable long jobs.'
      )
    }
    after(async () => {
      await runGenerationJob(payload)
    })
  }

  return NextResponse.json({ jobId: job.id })
}
