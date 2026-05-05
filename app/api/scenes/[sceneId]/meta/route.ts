import { NextRequest, NextResponse } from 'next/server'
import { updateSceneCard } from '@/lib/store'
import { requireApiSession, assertCanDirectScene } from '@/lib/api-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const { sceneId } = await params
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const denied = await assertCanDirectScene(profile, sceneId)
  if (denied) return denied

  const { cue_number, tc_in_smpte, tc_out_smpte, screenplay_text } = await req.json()

  await updateSceneCard(sceneId, {
    cue_number:      cue_number      ?? undefined,
    tc_in_smpte:     tc_in_smpte     ?? undefined,
    tc_out_smpte:    tc_out_smpte    ?? undefined,
    screenplay_text: screenplay_text === undefined ? undefined : (screenplay_text || null),
  })

  return NextResponse.json({ ok: true })
}
