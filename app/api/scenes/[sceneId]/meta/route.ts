import { NextRequest, NextResponse } from 'next/server'
import { getSceneCard, updateSceneCard } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sceneId } = await params
  const scene = await getSceneCard(sceneId, user.id)
  if (!scene) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { cue_number, tc_in_smpte, tc_out_smpte } = await req.json()

  await updateSceneCard(sceneId, {
    cue_number:   cue_number   ?? undefined,
    tc_in_smpte:  tc_in_smpte  ?? undefined,
    tc_out_smpte: tc_out_smpte ?? undefined,
  })

  return NextResponse.json({ ok: true })
}
