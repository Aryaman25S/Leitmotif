/**
 * File storage — Cloudflare R2 (S3-compatible) in production,
 * local disk fallback for development when R2 vars are not set.
 */

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'

// ── R2 client (lazy singleton) ───────────────────────────────────────────────

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? ''
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? ''
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? ''
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')

const useR2 = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME)

let _s3: S3Client | null = null
function getS3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  }
  return _s3
}

// ── Local-disk fallback (dev only) ───────────────────────────────────────────

import fs from 'fs'
import path from 'path'

const UPLOADS_DIR = path.join(process.cwd(), '.data', 'uploads')

function ensureBucketDir(bucket: string): string {
  const dir = path.join(UPLOADS_DIR, bucket)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

// ── Public API ───────────────────────────────────────────────────────────────

export function getFileKey(bucket: string, filename: string): string {
  return `${bucket}/${filename}`
}

export async function saveFile(bucket: string, filename: string, data: Buffer): Promise<string> {
  const key = getFileKey(bucket, filename)

  if (useR2) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: data,
        ContentType: contentTypeFromKey(key),
      })
    )
  } else {
    const dir = ensureBucketDir(bucket)
    fs.writeFileSync(path.join(dir, filename), data)
  }

  return key
}

export async function fileExists(fileKey: string): Promise<boolean> {
  if (useR2) {
    try {
      await getS3().send(
        new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: fileKey })
      )
      return true
    } catch {
      return false
    }
  }
  return fs.existsSync(path.join(UPLOADS_DIR, fileKey))
}

export function getFileUrl(fileKey: string): string {
  if (useR2 && R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${fileKey}`
  }
  return `/api/files/${fileKey}`
}

/** Still used by the local dev /api/files route to serve from disk. */
export function getFilePath(fileKey: string): string {
  return path.join(UPLOADS_DIR, fileKey)
}

/** Read full object bytes (for server-side media probing). */
export async function readFileBuffer(fileKey: string): Promise<Buffer | null> {
  if (useR2) {
    try {
      const out = await getS3().send(
        new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: fileKey })
      )
      const body = out.Body
      if (!body) return null
      const bytes = await body.transformToByteArray()
      return Buffer.from(bytes)
    } catch {
      return null
    }
  }
  const p = getFilePath(fileKey)
  if (!fs.existsSync(p)) return null
  return fs.readFileSync(p)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function contentTypeFromKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
  }
  return map[ext ?? ''] ?? 'application/octet-stream'
}

/**
 * Generates a minimal valid silent WAV file in memory.
 * Used as the mock cue audio when no STABILITY_API_KEY is configured.
 *
 * Format: PCM, 44100 Hz, 1 channel, 16-bit, durationSec seconds of silence.
 */
export function generateSilentWav(durationSec: number): Buffer {
  const sampleRate = 44100
  const numChannels = 1
  const bitsPerSample = 16
  const numSamples = Math.floor(sampleRate * durationSec)
  const dataSize = numSamples * numChannels * (bitsPerSample / 8)
  const fileSize = 44 + dataSize

  const buf = Buffer.alloc(fileSize)
  let offset = 0

  // RIFF header
  buf.write('RIFF', offset); offset += 4
  buf.writeUInt32LE(fileSize - 8, offset); offset += 4
  buf.write('WAVE', offset); offset += 4

  // fmt chunk
  buf.write('fmt ', offset); offset += 4
  buf.writeUInt32LE(16, offset); offset += 4
  buf.writeUInt16LE(1, offset); offset += 2
  buf.writeUInt16LE(numChannels, offset); offset += 2
  buf.writeUInt32LE(sampleRate, offset); offset += 4
  buf.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), offset); offset += 4
  buf.writeUInt16LE(numChannels * (bitsPerSample / 8), offset); offset += 2
  buf.writeUInt16LE(bitsPerSample, offset); offset += 2

  // data chunk
  buf.write('data', offset); offset += 4
  buf.writeUInt32LE(dataSize, offset); offset += 4

  return buf
}
