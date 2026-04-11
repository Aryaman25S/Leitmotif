/**
 * Smoke test: call Stability Stable Audio (or silent fallback) and write a WAV file.
 *
 * Usage (from repo root):
 *   npm run test:stable-audio
 *
 * Requires `.env.local` with STABILITY_API_KEY for real audio; otherwise writes silent WAV.
 */

import { resolve } from 'path'
import { writeFileSync } from 'fs'
import dotenv from 'dotenv'
import { generateWithStableAudio } from '../lib/generation/stableAudio'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const OUT_FILE = resolve(process.cwd(), 'scripts/out-test-stable-audio.wav')

async function main() {
  const result = await generateWithStableAudio(
    'gentle solo piano, sparse, emotional, cinematic underscore',
    'drums, vocals, heavy distortion, loud',
    8
  )

  writeFileSync(OUT_FILE, result.buffer)
  console.log('OK')
  console.log('  output:', OUT_FILE)
  console.log('  source:', result.source)
  console.log('  bytes: ', result.buffer.length)
  if (result.source === 'silent_mock') {
    console.log('  (Set STABILITY_API_KEY in .env.local for real Stable Audio output.)')
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
