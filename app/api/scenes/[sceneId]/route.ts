import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { getSceneCard } from '@/lib/store'

export async function DELETE(
  _req: NextRequest,
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

  try {
    await prisma.sceneCard.delete({ where: { id: sceneId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
