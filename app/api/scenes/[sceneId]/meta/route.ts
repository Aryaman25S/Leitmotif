import { NextRequest, NextResponse } from 'next/server'
import { updateSceneCard } from '@/lib/store'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const { sceneId } = await params
  const { cue_number, tc_in_smpte, tc_out_smpte } = await req.json()

  await updateSceneCard(sceneId, {
    cue_number:   cue_number   ?? undefined,
    tc_in_smpte:  tc_in_smpte  ?? undefined,
    tc_out_smpte: tc_out_smpte ?? undefined,
  })

  return NextResponse.json({ ok: true })
}
