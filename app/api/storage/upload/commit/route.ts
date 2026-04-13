/**
 * POST /api/storage/upload/commit
 *
 * Receives a file upload as multipart/form-data and saves it to R2 (or local disk in dev).
 * The client sends: { file: File, fileKey: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { saveFile } from '@/lib/storage'
import path from 'path'
import { requireApiSession, assertSceneAccess } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const fileKey = formData.get('fileKey') as string | null

  if (!file || !fileKey) {
    return NextResponse.json({ error: 'file and fileKey are required' }, { status: 400 })
  }

  const parts = fileKey.split('/')
  if (parts.length < 2) {
    return NextResponse.json({ error: 'Invalid fileKey format' }, { status: 400 })
  }

  const bucket = parts[0]
  const filename = parts.slice(1).join('/')

  if (bucket === 'scene-videos') {
    const underscore = filename.indexOf('_')
    const sceneId = underscore === -1 ? '' : filename.slice(0, underscore)
    if (!sceneId) {
      return NextResponse.json({ error: 'Invalid fileKey' }, { status: 400 })
    }
    const denied = await assertSceneAccess(profile, sceneId)
    if (denied) return denied
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await saveFile(bucket, path.basename(filename), buffer)

  return NextResponse.json({ ok: true, fileKey })
}
