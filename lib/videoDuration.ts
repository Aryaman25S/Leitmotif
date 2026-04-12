import { parseBuffer } from 'music-metadata'

/**
 * Best-effort duration from video container (MP4/MOV/WebM where supported).
 * Uses music-metadata (no ffprobe binary — works on Vercel serverless).
 */
export async function probeVideoDurationSec(buf: Buffer): Promise<number | null> {
  try {
    const meta = await parseBuffer(buf, undefined, { duration: true })
    const d = meta.format.duration
    if (d != null && Number.isFinite(d) && d > 0) return d
  } catch {
    /* unsupported or corrupt */
  }
  return null
}
