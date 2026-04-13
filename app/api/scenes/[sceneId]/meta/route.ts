import { NextRequest, NextResponse } from 'next/server'
import { updateSceneCard } from '@/lib/store'
import { requireApiSession, assertSceneAccess } from '@/lib/api-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const { sceneId } = await params
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const denied = await assertSceneAccess(profile, sceneId)
  if (denied) return denied

  const { cue_number, tc_in_smpte, tc_out_smpte } = await req.json()

  await updateSceneCard(sceneId, {
    cue_number:   cue_number   ?? undefined,
    tc_in_smpte:  tc_in_smpte  ?? undefined,
    tc_out_smpte: tc_out_smpte ?? undefined,
  })

  return NextResponse.json({ ok: true })
}
