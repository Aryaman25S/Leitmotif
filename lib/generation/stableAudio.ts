/**
 * Stable Audio 2.5 API call with local silent-WAV fallback.
 *
 * If STABILITY_API_KEY is not set, returns a silent WAV so the generation loop
 * works without any API key.
 */

import { generateSilentWav } from '@/lib/storage'

const STABLE_AUDIO_ENDPOINT =
  'https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio'

export type StableAudioGenerationSource = 'stable_api' | 'silent_mock'

export interface StableAudioGenerationResult {
  buffer: Buffer
  source: StableAudioGenerationSource
}

function looksLikeWav(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WAVE'
  )
}

/** Decode base64 if the result looks like WAV (or large binary blob). */
function bufferFromBase64Field(data: string): Buffer | null {
  try {
    const buf = Buffer.from(data, 'base64')
    if (looksLikeWav(buf)) return buf
    if (buf.length >= 2048) return buf
  } catch {
    /* ignore */
  }
  return null
}

/** Walk JSON for common Stability shapes: artifacts[].base64, nested base64 strings. */
function extractAudioFromJson(obj: unknown, depth = 0): Buffer | null {
  if (depth > 12) return null

  if (typeof obj === 'string') {
    return bufferFromBase64Field(obj)
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = extractAudioFromJson(item, depth + 1)
      if (found) return found
    }
    return null
  }

  if (obj && typeof obj === 'object') {
    const rec = obj as Record<string, unknown>
    for (const key of ['base64', 'audio', 'data', 'image']) {
      const v = rec[key]
      if (typeof v === 'string') {
        const b = bufferFromBase64Field(v)
        if (b) return b
      }
    }
    const artifacts = rec.artifacts
    if (Array.isArray(artifacts)) {
      for (const a of artifacts) {
        if (a && typeof a === 'object') {
          const b64 = (a as { base64?: string }).base64
          if (typeof b64 === 'string') {
            const b = bufferFromBase64Field(b64)
            if (b) return b
          }
        }
      }
    }
    for (const v of Object.values(rec)) {
      const found = extractAudioFromJson(v, depth + 1)
      if (found) return found
    }
  }

  return null
}

function parseBodyToAudioBuffer(buf: Buffer): Buffer {
  if (looksLikeWav(buf)) return buf

  const trimmed = buf.toString('utf8').trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      const fromJson = extractAudioFromJson(parsed)
      if (fromJson) return fromJson
    } catch {
      /* not JSON */
    }
  }

  return buf
}

function parseStabilityApiError(status: number, bodyText: string): string {
  const trimmed = bodyText.trim()
  if (!trimmed) return `Stable Audio API error ${status}`

  try {
    const j = JSON.parse(trimmed) as Record<string, unknown>
    const errors = j.errors
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0]
      if (typeof first === 'string') return `Stable Audio API error ${status}: ${first}`
      if (first && typeof first === 'object' && 'message' in first) {
        return `Stable Audio API error ${status}: ${String((first as { message: unknown }).message)}`
      }
    }
    if (typeof j.message === 'string') return `Stable Audio API error ${status}: ${j.message}`
    if (typeof j.detail === 'string') return `Stable Audio API error ${status}: ${j.detail}`
    if (typeof j.name === 'string' && typeof j.message === 'string') {
      return `Stable Audio API error ${status}: ${j.name} — ${j.message}`
    }
  } catch {
    /* fall through */
  }

  const short = trimmed.length > 500 ? `${trimmed.slice(0, 500)}…` : trimmed
  return `Stable Audio API error ${status}: ${short}`
}

async function fetchStableAudio(
  positivePrompt: string,
  negativePrompt: string,
  clampedDuration: number
): Promise<Response> {
  const fd = new FormData()
  fd.append('prompt', positivePrompt)
  if (negativePrompt) fd.append('negative_prompt', negativePrompt)
  fd.append('duration', String(clampedDuration))
  fd.append('output_format', 'wav')
  fd.append('steps', '30')

  return fetch(STABLE_AUDIO_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
      Accept: 'audio/*',
    },
    body: fd,
  })
}

async function readSuccessResponse(response: Response): Promise<Buffer> {
  const buf = Buffer.from(await response.arrayBuffer())
  const parsed = parseBodyToAudioBuffer(buf)
  if (looksLikeWav(parsed)) return parsed
  if (parsed.length >= 2048 && !parsed.toString('utf8').trim().startsWith('{')) {
    return parsed
  }
  throw new Error(
    'Stable Audio returned a response that is not a WAV file and has no recognizable base64 audio payload'
  )
}

async function callStableApi(
  positivePrompt: string,
  negativePrompt: string,
  clampedDuration: number
): Promise<Buffer> {
  const response = await fetchStableAudio(
    positivePrompt,
    negativePrompt,
    clampedDuration
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(parseStabilityApiError(response.status, errorText))
  }

  return readSuccessResponse(response)
}

export async function generateWithStableAudio(
  positivePrompt: string,
  negativePrompt: string,
  durationSec: number
): Promise<StableAudioGenerationResult> {
  if (!process.env.STABILITY_API_KEY?.trim()) {
    console.log('[generation] STABILITY_API_KEY not set — using silent WAV mock')
    await new Promise((r) => setTimeout(r, 1000))
    return {
      buffer: generateSilentWav(durationSec),
      source: 'silent_mock',
    }
  }

  const clampedDuration = Math.min(Math.max(Math.round(durationSec), 5), 190)

  const buffer = await callStableApi(positivePrompt, negativePrompt, clampedDuration)
  return { buffer, source: 'stable_api' }
}
