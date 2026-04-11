/**
 * GET /api/mock-cues/[cueId]/audio-url
 *
 * Returns a URL to the mock cue audio file.
 * Previously returned a Supabase Storage signed URL; now returns a local /api/files/... URL.
 *
 * TODO: In production, return a pre-signed CDN URL instead.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockCue } from '@/lib/store'
import { getFileUrl, fileExists } from '@/lib/storage'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cueId: string }> }
) {
  const { cueId } = await params

  const cue = await getMockCue(cueId)
  if (!cue) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!fileExists(cue.file_key)) {
    return NextResponse.json({ error: 'Audio file not found on disk' }, { status: 404 })
  }

  return NextResponse.json({ url: getFileUrl(cue.file_key) })
}
