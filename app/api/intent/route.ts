import { NextRequest, NextResponse } from 'next/server'
import { createIntentVersion, updateSceneCard } from '@/lib/store'
import { requireApiSession, assertCanDirectScene } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user

  const body = await req.json()

  if (!body.scene_card_id) {
    return NextResponse.json({ error: 'scene_card_id required' }, { status: 400 })
  }

  const denied = await assertCanDirectScene(user, body.scene_card_id)
  if (denied) return denied

  const iv = await createIntentVersion({
    scene_card_id: body.scene_card_id,
    version_number: 0, // store auto-calculates
    emotional_atmospheres: body.emotional_atmospheres ?? [],
    narrative_function: body.narrative_function ?? null,
    density: body.density ?? null,
    director_words: body.director_words ?? null,
    what_would_be_wrong: body.what_would_be_wrong ?? null,
    handoff_setting: body.handoff_setting ?? null,
    diegetic_status: body.diegetic_status ?? null,
    frequency_note: body.frequency_note ?? null,
    target_bpm: body.target_bpm ?? null,
    key_signature: body.key_signature ?? null,
    featured_instruments: body.featured_instruments ?? null,
    recording_quality: body.recording_quality ?? null,
    working_title: body.working_title ?? null,
    format_tag: body.format_tag ?? null,
    positive_prompt: body.positive_prompt ?? null,
    negative_prompt: body.negative_prompt ?? null,
    spec_tempo_range: body.spec_tempo_range ?? null,
    spec_harmonic_character: body.spec_harmonic_character ?? null,
    spec_density: body.spec_density ?? null,
    spec_register: body.spec_register ?? null,
    spec_dynamics: body.spec_dynamics ?? null,
    spec_rhythm: body.spec_rhythm ?? null,
    spec_instrumentation: body.spec_instrumentation ?? null,
    spec_do_not_use: body.spec_do_not_use ?? null,
    spec_confirmed_by: null,
    spec_confirmed_at: null,
    created_by: user.id,
  })

  // Advance scene status to 'tagged' if it was untagged
  await updateSceneCard(body.scene_card_id, { status: 'tagged' })

  return NextResponse.json({ intentVersion: iv })
}
