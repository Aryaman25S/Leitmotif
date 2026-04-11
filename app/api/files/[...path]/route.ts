/**
 * GET /api/files/<bucket>/<filename>
 *
 * In production (R2 configured): redirects to the public R2 URL.
 * In local dev: serves files from disk.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFileUrl, getFilePath, fileExists } from '@/lib/storage'
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

  const r2Url = getFileUrl(fileKey)
  if (r2Url.startsWith('http')) {
    return NextResponse.redirect(r2Url, { status: 302, headers: { 'Cache-Control': 'public, max-age=3600' } })
  }

  if (!(await fileExists(fileKey))) {
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
