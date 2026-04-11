/**
 * POST /api/storage/upload/commit
 *
 * Receives a file upload as multipart/form-data and saves it locally.
 * The client sends: { file: File, fileKey: string }
 *
 * TODO: In production, remove this route and upload directly to S3/R2 using
 *       pre-signed PUT URLs (no server middleman needed).
 */

import { NextRequest, NextResponse } from 'next/server'
import { saveFile } from '@/lib/storage'
import path from 'path'

export async function POST(req: NextRequest) {
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

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  saveFile(bucket, path.basename(filename), buffer)

  return NextResponse.json({ ok: true, fileKey })
}
