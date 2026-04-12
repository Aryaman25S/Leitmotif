import { NextRequest, NextResponse } from 'next/server'
import { createComment, getSceneCard } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sceneId, body } = await req.json()

  if (!sceneId || !body?.trim()) {
    return NextResponse.json({ error: 'sceneId and body required' }, { status: 400 })
  }

  const scene = await getSceneCard(sceneId, user.id)
  if (!scene) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

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
