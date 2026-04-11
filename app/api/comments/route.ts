import { NextRequest, NextResponse } from 'next/server'
import { createComment } from '@/lib/store'
import { getMockUser } from '@/lib/mock-auth'

export async function POST(req: NextRequest) {
  const user = getMockUser()
  const { sceneId, body } = await req.json()

  if (!sceneId || !body?.trim()) {
    return NextResponse.json({ error: 'sceneId and body required' }, { status: 400 })
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
