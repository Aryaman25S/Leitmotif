/**
 * Screenplay → scene intent autofill via Gemini 2.5 Pro.
 *
 * Reads a scene's screenplay and returns a draft of the structured intent
 * fields the director would otherwise fill by hand. Every taxonomy pick is
 * validated against the source-of-truth keys in lib/prompts/taxonomy.ts —
 * hallucinated values are dropped, not propagated to the UI.
 */

import { GoogleGenAI, Type } from '@google/genai'
import {
  ATMOSPHERE_DESCRIPTORS,
  FUNCTION_DESCRIPTORS,
  DENSITY_PHRASES,
  RECORDING_QUALITY_PHRASES,
  KEY_SIGNATURES,
} from '@/lib/prompts/taxonomy'
import { DIEGETIC_OPTIONS, HANDOFF_OPTIONS } from '@/lib/prompts/intentDisplay'

export type Confidence = 'low' | 'medium' | 'high'

export interface AutofillField<T> {
  value: T
  confidence: Confidence
}

export interface AutofillResult {
  emotional_atmospheres: AutofillField<string[]>
  narrative_function:    AutofillField<string | null>
  density:               AutofillField<string | null>
  diegetic_status:       AutofillField<string | null>
  handoff_setting:       AutofillField<string | null>
  target_bpm:            AutofillField<number | null>
  key_signature:         AutofillField<string | null>
  recording_quality:     AutofillField<string | null>
  format_tag:            AutofillField<string | null>
  featured_instruments:  AutofillField<string | null>
  director_words:        AutofillField<string | null>
  what_would_be_wrong:   AutofillField<string | null>
  working_title:         AutofillField<string | null>
}

const ATMOSPHERE_KEYS = Object.keys(ATMOSPHERE_DESCRIPTORS)
const FUNCTION_KEYS   = Object.keys(FUNCTION_DESCRIPTORS)
const DENSITY_KEYS    = Object.keys(DENSITY_PHRASES)
const QUALITY_KEYS    = Object.keys(RECORDING_QUALITY_PHRASES)
const DIEGETIC_KEYS   = DIEGETIC_OPTIONS.map((o) => o.value)
const HANDOFF_KEYS    = HANDOFF_OPTIONS.map((o) => o.value)
const FORMAT_VALUES   = ['Solo', 'Duet', 'Band', 'Orchestra', 'Chorus']
const CONFIDENCE_VALUES: Confidence[] = ['low', 'medium', 'high']

/**
 * Compact rubric the model uses to ground its picks. We deliberately
 * include the `doNotUse` lists for atmospheres so the model understands
 * the *exclusions* a tag implies, not just what it sounds like.
 */
function buildRubric(): string {
  const atm = Object.entries(ATMOSPHERE_DESCRIPTORS)
    .map(([key, d]) =>
      `- ${key}: ${d.label}\n    when: ${d.description}\n    do not use: ${d.doNotUse.join(', ')}`,
    )
    .join('\n')

  const fn = Object.entries(FUNCTION_DESCRIPTORS)
    .map(([key, d]) => `- ${key}: ${d.label} — ${d.description}`)
    .join('\n')

  const density = Object.entries(DENSITY_PHRASES)
    .map(([key, phrase]) => `- ${key}: ${phrase}`)
    .join('\n')

  const diegetic = DIEGETIC_OPTIONS
    .map((o) => `- ${o.value}: ${o.label} — ${o.description}`)
    .join('\n')

  const handoff = HANDOFF_OPTIONS
    .map((o) => `- ${o.value}: ${o.label} — ${o.description}`)
    .join('\n')

  const quality = Object.entries(RECORDING_QUALITY_PHRASES)
    .map(([key, phrase]) => `- ${key}: ${phrase}`)
    .join('\n')

  return [
    'EMOTIONAL ATMOSPHERES (pick 1–3):', atm,
    '',
    'NARRATIVE FUNCTION (pick at most one):', fn,
    '',
    'DENSITY (pick at most one):', density,
    '',
    'DIEGETIC STATUS (pick at most one):', diegetic,
    '',
    'SCORE / SOUND BALANCE (pick at most one):', handoff,
    '',
    'RECORDING QUALITY (pick at most one):', quality,
    '',
    `KEY SIGNATURE (pick at most one): ${KEY_SIGNATURES.join(', ')}`,
    '',
    `FORMAT (pick at most one): ${FORMAT_VALUES.join(', ')}`,
  ].join('\n')
}

const SYSTEM_INSTRUCTION = `You are a music director's assistant. You read a single scene's screenplay and translate the directorial subtext into Leitmotif's controlled vocabulary, so the director starts with a draft instead of a blank form.

Rules:
- Only pick keys that exist in the rubric below. Never invent new keys.
- Pick 1–3 emotional atmospheres — fewer is fine. If two contradict (e.g. dread and joy), pick the one that's actually load-bearing for the scene; do not stack opposites.
- For every field, mark confidence honestly:
    - high: the screenplay gives unambiguous evidence
    - medium: a reasonable inference, but a different reading is plausible
    - low: you're guessing from sparse text; the director should review carefully
- If the screenplay genuinely doesn't tell you something (e.g. there's no signal about diegesis), return null for that field rather than guessing. Returning null is better than a wrong pick.
- target_bpm: only return if the scene's pace is clear. Otherwise null.
- featured_instruments: prefer specific instrument names ("solo cello, prepared piano") over generic descriptions. If nothing is implied, null.
- director_words: 1–3 sentences in the director's voice describing what the moment feels like. Plain prose, not a list. Do NOT just paraphrase the screenplay action.
- what_would_be_wrong: 1 sentence naming the obvious-but-wrong music choice for this scene.
- working_title: a short evocative phrase (3–6 words). Not the scene slug.`

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    emotional_atmospheres: fieldSchema({
      type: Type.ARRAY,
      items: { type: Type.STRING, enum: ATMOSPHERE_KEYS },
    }),
    narrative_function:   fieldSchema({ type: Type.STRING, enum: FUNCTION_KEYS, nullable: true }),
    density:              fieldSchema({ type: Type.STRING, enum: DENSITY_KEYS,  nullable: true }),
    diegetic_status:      fieldSchema({ type: Type.STRING, enum: DIEGETIC_KEYS, nullable: true }),
    handoff_setting:      fieldSchema({ type: Type.STRING, enum: HANDOFF_KEYS,  nullable: true }),
    target_bpm:           fieldSchema({ type: Type.INTEGER, nullable: true }),
    key_signature:        fieldSchema({ type: Type.STRING, enum: [...KEY_SIGNATURES], nullable: true }),
    recording_quality:    fieldSchema({ type: Type.STRING, enum: QUALITY_KEYS,  nullable: true }),
    format_tag:           fieldSchema({ type: Type.STRING, enum: FORMAT_VALUES, nullable: true }),
    featured_instruments: fieldSchema({ type: Type.STRING, nullable: true }),
    director_words:       fieldSchema({ type: Type.STRING, nullable: true }),
    what_would_be_wrong:  fieldSchema({ type: Type.STRING, nullable: true }),
    working_title:        fieldSchema({ type: Type.STRING, nullable: true }),
  },
  required: [
    'emotional_atmospheres',
    'narrative_function', 'density', 'diegetic_status', 'handoff_setting',
    'target_bpm', 'key_signature', 'recording_quality', 'format_tag',
    'featured_instruments', 'director_words', 'what_would_be_wrong', 'working_title',
  ],
}

function fieldSchema(valueSchema: Record<string, unknown>) {
  return {
    type: Type.OBJECT,
    properties: {
      value: valueSchema,
      confidence: { type: Type.STRING, enum: CONFIDENCE_VALUES },
    },
    required: ['value', 'confidence'],
  }
}

export async function autofillFromScreenplay(screenplay: string): Promise<AutofillResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set — autofill requires Gemini')
  }

  const ai = new GoogleGenAI({ apiKey })

  const userPrompt = [
    'RUBRIC',
    '======',
    buildRubric(),
    '',
    'SCREENPLAY',
    '==========',
    screenplay.trim(),
  ].join('\n')

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.4,
    },
  })

  const text = response.text
  if (!text) throw new Error('Gemini returned no text')

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Gemini returned invalid JSON')
  }

  return validate(parsed)
}

// ── Validation ──────────────────────────────────────────────────────────────
//
// Even with responseSchema, defend against (a) older model versions ignoring
// the schema, (b) enum drift, (c) array values containing duplicate keys.

function validate(raw: unknown): AutofillResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Gemini response was not an object')
  }
  const r = raw as Record<string, unknown>

  return {
    emotional_atmospheres: arrayField(r.emotional_atmospheres, ATMOSPHERE_KEYS, 3),
    narrative_function:    enumField(r.narrative_function, FUNCTION_KEYS),
    density:               enumField(r.density,            DENSITY_KEYS),
    diegetic_status:       enumField(r.diegetic_status,    DIEGETIC_KEYS),
    handoff_setting:       enumField(r.handoff_setting,    HANDOFF_KEYS),
    target_bpm:            numberField(r.target_bpm, 30, 220),
    key_signature:         enumField(r.key_signature, [...KEY_SIGNATURES]),
    recording_quality:     enumField(r.recording_quality,  QUALITY_KEYS),
    format_tag:             enumField(r.format_tag,         FORMAT_VALUES),
    featured_instruments:  stringField(r.featured_instruments, 200),
    director_words:        stringField(r.director_words, 600),
    what_would_be_wrong:   stringField(r.what_would_be_wrong, 400),
    working_title:         stringField(r.working_title, 80),
  }
}

function readField(raw: unknown): { value: unknown; confidence: Confidence } {
  const obj = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {}
  const conf = obj.confidence
  const confidence: Confidence = (CONFIDENCE_VALUES as string[]).includes(conf as string)
    ? (conf as Confidence)
    : 'low'
  return { value: obj.value, confidence }
}

function enumField(raw: unknown, allowed: string[]): AutofillField<string | null> {
  const { value, confidence } = readField(raw)
  if (typeof value === 'string' && allowed.includes(value)) {
    return { value, confidence }
  }
  return { value: null, confidence: 'low' }
}

function arrayField(raw: unknown, allowed: string[], cap: number): AutofillField<string[]> {
  const { value, confidence } = readField(raw)
  if (!Array.isArray(value)) return { value: [], confidence: 'low' }
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of value) {
    if (typeof v === 'string' && allowed.includes(v) && !seen.has(v)) {
      seen.add(v)
      out.push(v)
      if (out.length >= cap) break
    }
  }
  return { value: out, confidence }
}

function numberField(raw: unknown, min: number, max: number): AutofillField<number | null> {
  const { value, confidence } = readField(raw)
  if (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max) {
    return { value: Math.round(value), confidence }
  }
  return { value: null, confidence: 'low' }
}

function stringField(raw: unknown, maxLen: number): AutofillField<string | null> {
  const { value, confidence } = readField(raw)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) return { value: null, confidence: 'low' }
    return { value: trimmed.slice(0, maxLen), confidence }
  }
  return { value: null, confidence: 'low' }
}
