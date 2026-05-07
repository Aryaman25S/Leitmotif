import { NextRequest, NextResponse } from 'next/server'
import { createComment, getComments } from '@/lib/store'
import { requireApiSession, assertSceneAccess } from '@/lib/api-auth'

/**
 * GET — paged list of comments for a scene (newest first). Auth-gated to
 * project members so anonymous brief viewers can't enumerate threads they
 * don't have the URL for. The brief itself server-renders an initial page
 * for anonymous viewers; pagination from the client requires sign-in.
 */
export async function GET(req: NextRequest) {
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user

  const sceneId = req.nextUrl.searchParams.get('sceneId')
  if (!sceneId) {
    return NextResponse.json({ error: 'sceneId required' }, { status: 400 })
  }

  const denied = await assertSceneAccess(user, sceneId)
  if (denied) return denied

  const before = req.nextUrl.searchParams.get('before') ?? undefined
  const limitParam = req.nextUrl.searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : 10

  const page = await getComments(sceneId, {
    limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    before,
  })

  return NextResponse.json(page)
}

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
