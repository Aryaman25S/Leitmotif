/**
 * GET /api/files/<bucket>/<filename>
 *
 * Streams bytes from R2 or local disk (same-origin for reliable
 * `<audio>` / `<video>`). Honors HTTP Range requests with proper 206
 * Partial Content responses — required by Safari and used by Chrome
 * when seeking through media. Lying about Range support (advertising
 * `Accept-Ranges: bytes` while ignoring the header) silently breaks
 * playback in Safari and intermittently in Chrome.
 */

import { NextRequest, NextResponse } from 'next/server'
import { streamStorageObject } from '@/lib/storage'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const fileKey = segments.join('/')

  const range = parseRange(req.headers.get('range'))
  const meta = await streamStorageObject(fileKey, range)
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

  let status = 200
  if (range && meta.totalLength != null && meta.contentLength != null) {
    status = 206
    const start = range.start
    const end = start + meta.contentLength - 1
    headers['Content-Range'] = `bytes ${start}-${end}/${meta.totalLength}`
  }

  return new NextResponse(meta.stream, { status, headers })
}

// Parse a single-range HTTP Range header. Browsers only ever send
// single-range requests for media; multi-range (`bytes=0-100, 200-300`)
// is allowed by the spec but never used in practice and we don't support
// it. Suffix ranges (`bytes=-500` for the last 500 bytes) are also
// uncommon for media and would require a HEAD round-trip to resolve, so
// we don't handle those either — fall through to a 200 with the full
// object, which the browser will then re-request with a normal range.
function parseRange(header: string | null): { start: number; end?: number } | undefined {
  if (!header) return undefined
  const m = header.match(/^bytes=(\d+)-(\d*)$/)
  if (!m) return undefined
  const start = parseInt(m[1], 10)
  const end = m[2] === '' ? undefined : parseInt(m[2], 10)
  if (Number.isNaN(start)) return undefined
  if (end !== undefined && (Number.isNaN(end) || end < start)) return undefined
  return end !== undefined ? { start, end } : { start }
}
