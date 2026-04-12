/**
 * GET /api/files/<bucket>/<filename>
 *
 * Streams bytes from R2 or local disk (same-origin for reliable `<audio>` / `<video>`).
 */

import { NextRequest, NextResponse } from 'next/server'
import { streamStorageObject } from '@/lib/storage'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (!(await getSessionUser())) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { path: segments } = await params
  const fileKey = segments.join('/')

  const meta = await streamStorageObject(fileKey)
  if (!meta) {
    return new NextResponse('File not found', { status: 404 })
  }

  const headers: Record<string, string> = {
    'Content-Type': meta.contentType,
    'Cache-Control': 'public, max-age=3600',
    'Accept-Ranges': 'bytes',
  }
  if (meta.contentLength != null && meta.contentLength > 0) {
    headers['Content-Length'] = String(meta.contentLength)
  }

  return new NextResponse(meta.stream, {
    status: 200,
    headers,
  })
}
