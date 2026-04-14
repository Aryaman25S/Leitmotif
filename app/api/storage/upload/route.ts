/**
 * POST /api/storage/upload
 *
 * Returns upload instructions for a scene video (or mock-cue path for future use).
 * When R2 is configured: **presigned PUT** URL — client uploads directly to R2.
 * Otherwise: multipart POST to `/api/storage/upload/commit` (local disk in dev).
 *
 * For presigned uploads, configure **CORS** on the R2 bucket to allow PUT from your app origin.
 */

import { NextRequest, NextResponse } from 'next/server'
import { uid } from '@/lib/store'
import path from 'path'
import { requireApiSession, assertCanDirectScene } from '@/lib/api-auth'
import { getPresignedPutUrl, isR2StorageEnabled } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const { sceneId, fileName, contentType } = await req.json()

  if (!sceneId || !fileName || !contentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const denied = await assertCanDirectScene(profile, sceneId)
  if (denied) return denied

  const ext = path.extname(fileName).toLowerCase() || '.bin'
  const bucket = contentType.startsWith('video/') ? 'scene-videos' : 'mock-cues'
  const storedName = `${sceneId}_${uid()}${ext}`
  const fileKey = `${bucket}/${storedName}`

  if (isR2StorageEnabled()) {
    const putUrl = await getPresignedPutUrl(fileKey, contentType)
    if (!putUrl) {
      return NextResponse.json({ error: 'Could not create upload URL' }, { status: 500 })
    }
    return NextResponse.json({
      uploadMode: 'presigned',
      putUrl,
      fileKey,
      signedUrl: `/api/files/${fileKey}`,
      storedName,
      bucket,
    })
  }

  const uploadUrl = `/api/storage/upload/commit`

  return NextResponse.json({
    uploadMode: 'multipart',
    uploadUrl,
    fileKey,
    signedUrl: `/api/files/${fileKey}`,
    storedName,
    bucket,
  })
}
