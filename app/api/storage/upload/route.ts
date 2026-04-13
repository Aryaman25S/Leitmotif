/**
 * POST /api/storage/upload
 *
 * Returns an upload target URL and key.
 * Previously generated Supabase Storage pre-signed URLs.
 * Now returns a local multipart-upload endpoint.
 *
 * The client POSTs the file as multipart/form-data to /api/storage/upload/commit
 * along with the returned uploadToken.
 *
 * TODO: In production, replace with pre-signed S3/R2 URLs and update the client
 *       (SceneVideoUpload.tsx) to PUT directly to S3.
 */

import { NextRequest, NextResponse } from 'next/server'
import { uid } from '@/lib/store'
import path from 'path'
import { requireApiSession, assertSceneAccess } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const { sceneId, fileName, contentType } = await req.json()

  if (!sceneId || !fileName || !contentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const denied = await assertSceneAccess(profile, sceneId)
  if (denied) return denied

  const ext = path.extname(fileName).toLowerCase() || '.bin'
  const bucket = contentType.startsWith('video/') ? 'scene-videos' : 'mock-cues'
  const storedName = `${sceneId}_${uid()}${ext}`
  const fileKey = `${bucket}/${storedName}`

  // The "upload URL" is our own multipart upload endpoint
  const uploadUrl = `/api/storage/upload/commit`

  return NextResponse.json({
    uploadUrl,
    fileKey,
    // fileKey is also used as the "signedUrl" for immediate playback via /api/files/...
    signedUrl: `/api/files/${fileKey}`,
    storedName,
    bucket,
  })
}
