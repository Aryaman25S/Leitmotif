import { NextRequest, NextResponse } from 'next/server'
import { createComment } from '@/lib/store'
import { requireApiSession, assertSceneAccess } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user

  const { sceneId, body } = await req.json()

  if (!sceneId || !body?.trim()) {
    return NextResponse.json({ error: 'sceneId and body required' }, { status: 400 })
  }

  const denied = await assertSceneAccess(user, sceneId)
  if (denied) return denied

  const comment = await createComment({
    scene_card_id: sceneId,
    author_id: user.id,
    body: body.trim(),
  })

  return NextResponse.json({
    comment: {
      ...comment,
      author: { name: user.name, email: user.email },
    },
  })
}
