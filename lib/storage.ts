/**
 * Local file storage — replaces Supabase Storage.
 *
 * Files are saved to .data/uploads/<bucket>/<filename>
 * and served at /api/files/<bucket>/<filename>
 *
 * TODO: Replace with S3 / R2 / Cloudflare Storage when deploying to production.
 *       Change saveFile() and getFileUrl() only — callers are unchanged.
 */

import fs from 'fs'
import path from 'path'

const UPLOADS_DIR = path.join(process.cwd(), '.data', 'uploads')

export function ensureBucketDir(bucket: string) {
  const dir = path.join(UPLOADS_DIR, bucket)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function saveFile(bucket: string, filename: string, data: Buffer): string {
  const dir = ensureBucketDir(bucket)
  const filePath = path.join(dir, filename)
  fs.writeFileSync(filePath, data)
  return getFileKey(bucket, filename)
}

export function getFilePath(fileKey: string): string {
  return path.join(UPLOADS_DIR, fileKey)
}

export function getFileKey(bucket: string, filename: string): string {
  return `${bucket}/${filename}`
}

export function fileExists(fileKey: string): boolean {
  return fs.existsSync(path.join(UPLOADS_DIR, fileKey))
}

export function readFile(fileKey: string): Buffer {
  return fs.readFileSync(path.join(UPLOADS_DIR, fileKey))
}

/** Returns the URL path to serve the file via /api/files/... */
export function getFileUrl(fileKey: string): string {
  return `/api/files/${fileKey}`
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
  buf.writeUInt32LE(16, offset); offset += 4          // chunk size
  buf.writeUInt16LE(1, offset); offset += 2           // PCM format
  buf.writeUInt16LE(numChannels, offset); offset += 2
  buf.writeUInt32LE(sampleRate, offset); offset += 4
  buf.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), offset); offset += 4 // byte rate
  buf.writeUInt16LE(numChannels * (bitsPerSample / 8), offset); offset += 2 // block align
  buf.writeUInt16LE(bitsPerSample, offset); offset += 2

  // data chunk
  buf.write('data', offset); offset += 4
  buf.writeUInt32LE(dataSize, offset); offset += 4
  // Remaining bytes are already zero (silence)

  return buf
}
