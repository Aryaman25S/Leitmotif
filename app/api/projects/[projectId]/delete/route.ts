import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiSession } from '@/lib/api-auth'
import { getProject, getProjectStorageKeys } from '@/lib/store'
import { deleteStorageObject } from '@/lib/storage'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const project = await getProject(projectId)
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (project.owner_id !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Snapshot every storage object owned by the project before the cascade
  // takes the rows that point to them. The strike confirm promises that
  // "reference recordings" are destroyed; this is what makes that promise
  // honest. Storage deletes run after commit so a partial S3 failure can't
  // strand DB rows pointing at vanished keys.
  let keys: { audio: string[]; video: string[] } = { audio: [], video: [] }
  try {
    keys = await getProjectStorageKeys(projectId)
  } catch (err) {
    console.warn('[strike] failed to enumerate storage keys; deleting DB only', err)
  }

  try {
    await prisma.$transaction([prisma.project.delete({ where: { id: projectId } })])
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Best-effort: orphan storage objects log but don't block the response.
  // The "—  STRIKE THE PRODUCTION  —" experience already committed.
  await Promise.allSettled(
    [...keys.audio, ...keys.video].map((k) =>
      deleteStorageObject(k).catch((err) => {
        console.warn('[strike] storage delete failed for', k, err)
      })
    )
  )

  return NextResponse.json({ ok: true })
}
