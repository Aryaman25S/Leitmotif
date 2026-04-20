/**
 * Lyria 3 (Google GenAI) music generation client.
 *
 * Uses `lyria-3-clip-preview` for cues <=30s and `lyria-3-pro-preview` for
 * longer cues. Falls back to a silent WAV when GEMINI_API_KEY is not set.
 *
 * Lyria 3 does not have a dedicated `negative_prompt` parameter via the
 * Gemini API — exclusions must be folded into the positive prompt by the
 * caller (see buildLyriaPrompt in buildGenerationPrompt.ts).
 */

import { GoogleGenAI } from '@google/genai'
import { generateSilentWav } from '@/lib/storage'

export type LyriaGenerationSource = 'lyria_api' | 'silent_mock'

export interface LyriaGenerationResult {
  buffer: Buffer
  source: LyriaGenerationSource
}

const CLIP_DURATION_THRESHOLD = 30

function selectModel(durationSec: number): string {
  return durationSec <= CLIP_DURATION_THRESHOLD
    ? 'lyria-3-clip-preview'
    : 'lyria-3-pro-preview'
}

export async function generateWithLyria(
  prompt: string,
  durationSec: number,
): Promise<LyriaGenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()

  if (!apiKey) {
    console.log('[generation] GEMINI_API_KEY not set — using silent WAV mock')
    await new Promise((r) => setTimeout(r, 1000))
    return { buffer: generateSilentWav(durationSec), source: 'silent_mock' }
  }

  const model = selectModel(durationSec)
  const usePro = model === 'lyria-3-pro-preview'

  console.info('[leitmotif:lyria] calling', { model, durationSec })

  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseModalities: ['AUDIO', 'TEXT'],
      ...(usePro ? { responseMimeType: 'audio/wav' } : {}),
    },
  })

  const candidates = response.candidates
  if (!candidates || candidates.length === 0) {
    throw new Error('Lyria returned no candidates')
  }

  const parts = candidates[0].content?.parts
  if (!parts || parts.length === 0) {
    throw new Error('Lyria returned empty response parts')
  }

  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, 'base64')
      if (buffer.length < 512) continue
      console.info('[leitmotif:lyria] audio received', {
        model,
        mimeType: part.inlineData.mimeType,
        bytes: buffer.length,
      })
      return { buffer, source: 'lyria_api' }
    }
  }

  throw new Error('Lyria response contained no audio data')
}
