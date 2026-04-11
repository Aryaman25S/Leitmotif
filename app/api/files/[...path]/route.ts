/**
 * Serves locally stored files (uploaded videos, generated mock cues).
 * Replaces Supabase Storage signed URLs.
 *
 * GET /api/files/<bucket>/<filename>
 *
 * TODO: In production, replace with a CDN or pre-signed S3/R2 URL redirect.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFilePath, fileExists } from '@/lib/storage'
import fs from 'fs'
import path from 'path'

const CONTENT_TYPES: Record<string, string> = {
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const fileKey = segments.join('/')

  if (!fileExists(fileKey)) {
    return new NextResponse('File not found', { status: 404 })
  }

  const filePath = getFilePath(fileKey)
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream'

  const fileBuffer = fs.readFileSync(filePath)

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(fileBuffer.length),
      'Cache-Control': 'public, max-age=3600',
      'Accept-Ranges': 'bytes',
    },
  })
}
