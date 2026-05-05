/**
 * Prompt builders for generation providers.
 *
 * buildGenerationPrompt()  — Stable Audio 2.5 (positive + negative prompt pair)
 * buildLyriaPrompt()       — Lyria 3 via Gemini API (single combined prompt;
 *                            exclusions folded into natural language)
 *
 * Both consume the same IntentInput + GlobalSettings.
 *
 * Stable Audio prompt order:
 *   Format → Genre → Instruments → Mood → Style → BPM → Use-case → Title
 * Lyria prompt framework:
 *   Genre & style → Mood → Instrumentation → Tempo → Duration → Exclusions
 *
 * See: https://stability.ai/learning-hub/stable-audio-25-prompt-guide
 *      https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-lyria-3-pro
 */

import {
  ATMOSPHERE_DESCRIPTORS,
  FUNCTION_DESCRIPTORS,
  DENSITY_PHRASES,
  INSTRUMENTATION_PHRASES,
  BUDGET_PHRASES,
  RECORDING_QUALITY_PHRASES,
  DIEGETIC_PRODUCTION,
} from './taxonomy'

export interface IntentInput {
  emotionalAtmospheres: string[]
  narrativeFunction: string | null
  density: string | null
  whatWouldBeWrong: string | null
  handoffSetting: string | null
  /** How often music appears — fed into the model as coverage guidance. */
  frequencyNote: string | null
  directorWords: string | null
  diegeticStatus: string | null
  targetBpm: number | null
  keySignature: string | null
  featuredInstruments: string | null
  recordingQuality: string | null
  workingTitle: string | null
  formatTag: string | null
}

/** Short phrases for score vs sound-design balance (Stable Audio mood line). */
const HANDOFF_MODEL_PHRASES: Record<string, string> = {
  score_forward: 'score leads the scene, sound design supports',
  sound_forward: 'sound design leads, score stays minimal and supportive',
  equal_negotiated: 'score and sound design in clearly negotiated balance',
  diegetic_transition: 'diegetic source music transitions into or out of score',
  no_music: 'intentional absence of score — silence as choice',
}

// TODO(settings-redesign): these fields are consumed by the prompt compiler
// but are no longer user-editable after the Form 7B settings redesign. The
// project ships with whatever values are in the DB; new projects get schema
// defaults. A new edit surface needs to be designed — known regression.
export interface GlobalSettings {
  instrumentationFamilies: string[]
  eraReference: string | null
  doNotGenerate: string | null
  budgetReality: string | null
  toneBrief: string | null
}

export interface GenerationPrompt {
  positivePrompt: string
  negativePrompt: string
}

// ── BPM extraction ────────────────────────────────────────────────────────────

function deriveBpm(atmospheres: string[], userBpm: number | null): string {
  if (userBpm && userBpm > 0) return `${userBpm} BPM`

  const ranges = atmospheres
    .map((a) => ATMOSPHERE_DESCRIPTORS[a]?.bpmRange)
    .filter((r): r is [number, number] => r != null)

  if (ranges.length === 0) return ''

  const low  = Math.round(ranges.reduce((s, r) => s + r[0], 0) / ranges.length)
  const high = Math.round(ranges.reduce((s, r) => s + r[1], 0) / ranges.length)
  const mid  = Math.round((low + high) / 2)
  return `${mid} BPM`
}

// ── Positive prompt ───────────────────────────────────────────────────────────

export function buildGenerationPrompt(
  intent: IntentInput,
  global: GlobalSettings,
): GenerationPrompt {
  const parts: string[] = []

  // 1. Format (user-selected)
  const format = intent.formatTag || 'Band'
  parts.push(`Format: ${format}`)

  // 2. Genre / subgenre
  parts.push('Genre: Film Instrumental, Cinematic Underscore')

  // 3. Instruments — prefer user-specified, fall back to family-level
  const featuredInst = intent.featuredInstruments?.trim()
  if (featuredInst) {
    parts.push(`Instruments: ${featuredInst}`)
  } else {
    const familyPhrase = global.instrumentationFamilies.length > 0
      ? global.instrumentationFamilies.map((f) => INSTRUMENTATION_PHRASES[f] ?? f).join(', ')
      : null
    const budgetPhrase = BUDGET_PHRASES[global.budgetReality ?? ''] ?? null
    const instParts = [familyPhrase, budgetPhrase].filter(Boolean)
    if (instParts.length > 0) {
      parts.push(`Instruments: ${instParts.join(', ')}`)
    }
  }

  // 4. Mood — atmosphere positive phrases + density
  const moodTerms: string[] = []

  const atmospherePhrases = intent.emotionalAtmospheres
    .map((a) => ATMOSPHERE_DESCRIPTORS[a]?.positivePhrase)
    .filter(Boolean)
  if (atmospherePhrases.length > 0) moodTerms.push(...atmospherePhrases)

  if (intent.density) {
    const dp = DENSITY_PHRASES[intent.density]
    if (dp) moodTerms.push(dp)
  }

  // Narrative function — model-friendly phrase
  if (intent.narrativeFunction) {
    const fn = FUNCTION_DESCRIPTORS[intent.narrativeFunction]
    if (fn?.modelPhrase) moodTerms.push(fn.modelPhrase)
  }

  if (intent.handoffSetting) {
    const hp = HANDOFF_MODEL_PHRASES[intent.handoffSetting]
    if (hp) moodTerms.push(hp)
  }

  if (intent.frequencyNote?.trim()) {
    moodTerms.push(`music coverage / how often in the scene: ${intent.frequencyNote.trim()}`)
  }

  if (moodTerms.length > 0) {
    parts.push(`Moods: ${moodTerms.join(', ')}`)
  }

  // 5. Style / production quality
  const styleParts: string[] = []
  const eraPhrase = global.eraReference?.trim()
  if (eraPhrase) styleParts.push(eraPhrase)

  // Recording quality
  const recQuality = intent.recordingQuality
    ? RECORDING_QUALITY_PHRASES[intent.recordingQuality] ?? null
    : null
  if (recQuality) {
    styleParts.push(recQuality)
  } else {
    styleParts.push('studio-quality, stereo')
  }

  // Diegetic production modifiers
  const diegeticMod = intent.diegeticStatus
    ? DIEGETIC_PRODUCTION[intent.diegeticStatus]
    : null
  if (diegeticMod?.positive) styleParts.push(diegeticMod.positive)

  if (styleParts.length > 0) {
    parts.push(`Styles: ${styleParts.join(', ')}`)
  }

  // 6. BPM
  const bpmStr = deriveBpm(intent.emotionalAtmospheres, intent.targetBpm)
  if (bpmStr) parts.push(bpmStr)

  // 7. Key signature
  if (intent.keySignature) {
    parts.push(`Key of ${intent.keySignature}`)
  }

  // 8. Use-case context
  const useCaseParts: string[] = []
  if (intent.narrativeFunction) {
    const fn = FUNCTION_DESCRIPTORS[intent.narrativeFunction]
    if (fn?.useCasePhrase) useCaseParts.push(fn.useCasePhrase)
  }
  if (global.toneBrief?.trim()) {
    useCaseParts.push(global.toneBrief.trim())
  }
  if (useCaseParts.length > 0) {
    parts.push(useCaseParts.join(', '))
  }

  // 9. Title
  if (intent.workingTitle?.trim()) {
    parts.push(`titled "${intent.workingTitle.trim()}"`)
  }

  // 10. Director's words — vivid descriptive texture
  if (intent.directorWords?.trim()) {
    parts.push(intent.directorWords.trim())
  }

  const positivePrompt = parts
    .filter(Boolean)
    .join(' | ')
    .replace(/\s+/g, ' ')
    .trim()

  // ── Negative prompt ─────────────────────────────────────────────────────────
  const negativeTerms: string[] = [
    'low quality',
    'average quality',
  ]

  // Atmosphere "do not use" — already short concrete terms
  for (const a of intent.emotionalAtmospheres) {
    const desc = ATMOSPHERE_DESCRIPTORS[a]
    if (desc?.doNotUse) negativeTerms.push(...desc.doNotUse)
  }

  // Diegetic negative modifiers
  if (diegeticMod?.negative) negativeTerms.push(diegeticMod.negative)

  // Project-level exclusions
  if (global.doNotGenerate?.trim()) negativeTerms.push(global.doNotGenerate.trim())

  // "What would be wrong" — take as-is (director's language)
  if (intent.whatWouldBeWrong?.trim()) negativeTerms.push(intent.whatWouldBeWrong.trim())

  // Film-score baseline exclusions
  negativeTerms.push('vocals', 'lyrics', 'pop production', 'radio mix', 'advertising jingle')

  const negativePrompt = [...new Set(negativeTerms)].join(', ')

  return { positivePrompt, negativePrompt }
}

// ── Lyria 3 prompt (single combined prompt) ───────────────────────────────────

/**
 * Build a single text prompt for Lyria 3.
 *
 * Lyria does not accept a separate negative_prompt via the Gemini API, so
 * exclusions are folded into the prompt as natural language.  The prompt
 * follows Google's recommended framework:
 *   Genre & style → Mood → Instrumentation → Tempo → Structural hints → Exclusions
 */
export function buildLyriaPrompt(
  intent: IntentInput,
  global: GlobalSettings,
  durationSec: number,
): string {
  const sections: string[] = []

  // Genre & style
  const styleParts: string[] = ['Cinematic film score underscore']
  const eraPhrase = global.eraReference?.trim()
  if (eraPhrase) styleParts.push(eraPhrase)
  const recQuality = intent.recordingQuality
    ? RECORDING_QUALITY_PHRASES[intent.recordingQuality] ?? null
    : null
  if (recQuality) styleParts.push(recQuality)
  else styleParts.push('studio-quality, stereo')

  const diegeticMod = intent.diegeticStatus
    ? DIEGETIC_PRODUCTION[intent.diegeticStatus]
    : null
  if (diegeticMod?.positive) styleParts.push(diegeticMod.positive)

  sections.push(styleParts.join(', ') + '.')

  // Mood
  const moodTerms: string[] = []
  const atmospherePhrases = intent.emotionalAtmospheres
    .map((a) => ATMOSPHERE_DESCRIPTORS[a]?.positivePhrase)
    .filter(Boolean) as string[]
  if (atmospherePhrases.length > 0) moodTerms.push(...atmospherePhrases)

  if (intent.density) {
    const dp = DENSITY_PHRASES[intent.density]
    if (dp) moodTerms.push(dp)
  }
  if (intent.narrativeFunction) {
    const fn = FUNCTION_DESCRIPTORS[intent.narrativeFunction]
    if (fn?.modelPhrase) moodTerms.push(fn.modelPhrase)
  }
  if (intent.handoffSetting) {
    const hp = HANDOFF_MODEL_PHRASES[intent.handoffSetting]
    if (hp) moodTerms.push(hp)
  }
  if (moodTerms.length > 0) {
    sections.push('Mood: ' + moodTerms.join(', ') + '.')
  }

  // Instrumentation
  const featuredInst = intent.featuredInstruments?.trim()
  if (featuredInst) {
    sections.push('Instruments: ' + featuredInst + '.')
  } else {
    const familyPhrase = global.instrumentationFamilies.length > 0
      ? global.instrumentationFamilies.map((f) => INSTRUMENTATION_PHRASES[f] ?? f).join(', ')
      : null
    const budgetPhrase = BUDGET_PHRASES[global.budgetReality ?? ''] ?? null
    const instParts = [familyPhrase, budgetPhrase].filter(Boolean)
    if (instParts.length > 0) {
      sections.push('Instruments: ' + instParts.join(', ') + '.')
    }
  }

  // Tempo
  const bpmStr = deriveBpm(intent.emotionalAtmospheres, intent.targetBpm)
  if (bpmStr) sections.push(bpmStr + '.')

  // Key
  if (intent.keySignature) sections.push(`Key of ${intent.keySignature}.`)

  // Duration hint
  sections.push(`Approximately ${Math.round(durationSec)} seconds.`)

  // Director's words
  if (intent.directorWords?.trim()) sections.push(intent.directorWords.trim())

  // Use-case context
  if (intent.narrativeFunction) {
    const fn = FUNCTION_DESCRIPTORS[intent.narrativeFunction]
    if (fn?.useCasePhrase) sections.push(fn.useCasePhrase + '.')
  }
  if (global.toneBrief?.trim()) sections.push(global.toneBrief.trim())

  // Title
  if (intent.workingTitle?.trim()) {
    sections.push(`Titled "${intent.workingTitle.trim()}".`)
  }

  // Exclusions — folded as natural language
  const negativeTerms: string[] = []

  for (const a of intent.emotionalAtmospheres) {
    const desc = ATMOSPHERE_DESCRIPTORS[a]
    if (desc?.doNotUse) negativeTerms.push(...desc.doNotUse)
  }
  if (diegeticMod?.negative) negativeTerms.push(diegeticMod.negative)
  if (global.doNotGenerate?.trim()) negativeTerms.push(global.doNotGenerate.trim())
  if (intent.whatWouldBeWrong?.trim()) negativeTerms.push(intent.whatWouldBeWrong.trim())
  negativeTerms.push('vocals', 'lyrics', 'pop production', 'radio mix', 'advertising jingle')

  const uniqueNegatives = [...new Set(negativeTerms)]
  sections.push('Instrumental only, no vocals, no lyrics.')
  sections.push('Avoid: ' + uniqueNegatives.join(', ') + '.')

  return sections.join(' ').replace(/\s+/g, ' ').trim()
}

// ── Human-readable spec (for director + composer brief) ───────────────────────

export function buildMusicalSpec(intent: IntentInput): Record<string, string | string[]> {
  const atmospheres = intent.emotionalAtmospheres
    .map((a) => ATMOSPHERE_DESCRIPTORS[a])
    .filter(Boolean)

  const tempoRanges = atmospheres.map((a) => a!.specTempoRange).filter(Boolean)
  const harmonicChars = atmospheres.map((a) => a!.specHarmonicCharacter).filter(Boolean)
  const registers = atmospheres.map((a) => a!.specRegister).filter(Boolean)
  const dynamics = atmospheres.map((a) => a!.specDynamics).filter(Boolean)
  const rhythms = atmospheres.map((a) => a!.specRhythm).filter(Boolean)

  const allDoNotUse = atmospheres.flatMap((a) => a!.doNotUse ?? [])
  if (intent.whatWouldBeWrong) allDoNotUse.push(intent.whatWouldBeWrong)

  return {
    'Tempo': intent.targetBpm ? `${intent.targetBpm} BPM` : (tempoRanges.join(' / ') || 'Context-dependent'),
    'Key': intent.keySignature || 'AI-selected',
    'Harmonic character': harmonicChars.join(' · ') || '',
    'Register': registers.join(' · ') || '',
    'Dynamics': dynamics.join(' · ') || '',
    'Rhythm': rhythms.join(' · ') || '',
    'Do not use': [...new Set(allDoNotUse)],
  }
}
