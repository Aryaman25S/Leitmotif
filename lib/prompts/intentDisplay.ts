import { ATMOSPHERE_DESCRIPTORS, FUNCTION_DESCRIPTORS } from './taxonomy'

/** Select options for diegetic status (shared by SceneIntentEditor). */
export const DIEGETIC_OPTIONS = [
  { value: 'non_diegetic', label: 'Non-diegetic (score)', description: 'Heard by the audience only; characters do not hear it' },
  { value: 'diegetic', label: 'Diegetic (source music)', description: 'Heard by characters — TV, radio, live performance, etc.' },
  { value: 'meta_diegetic', label: 'Meta-diegetic', description: "In the character's head — subjective sound" },
  { value: 'ambiguous', label: 'Intentionally ambiguous', description: 'The line between source and score is deliberately blurred' },
] as const

/** Select options for score / sound balance (shared by SceneIntentEditor). */
export const HANDOFF_OPTIONS = [
  { value: 'score_forward', label: 'Score forward', description: 'Music leads; sound design supports' },
  { value: 'sound_forward', label: 'Sound design forward', description: 'Diegetic or designed sound leads; score recedes' },
  { value: 'equal_negotiated', label: 'Negotiated', description: 'Equal — clearly delineated zones' },
  { value: 'diegetic_transition', label: 'Diegetic transition', description: 'Source music bleeds into or out of score' },
  { value: 'no_music', label: 'No music', description: 'Silence is the intentional decision' },
] as const

const DIEGETIC_LABELS: Record<string, string> = Object.fromEntries(
  DIEGETIC_OPTIONS.map(({ value, label }) => [value, label])
)

const HANDOFF_LABELS: Record<string, string> = Object.fromEntries(
  HANDOFF_OPTIONS.map(({ value, label }) => [value, label])
)

export function atmosphereLabel(key: string): string {
  return ATMOSPHERE_DESCRIPTORS[key]?.label ?? key.replace(/_/g, ' ')
}

export function diegeticLabel(value: string | null | undefined): string {
  if (!value) return ''
  return DIEGETIC_LABELS[value] ?? value.replace(/_/g, ' ')
}

export function handoffLabel(value: string | null | undefined): string {
  if (!value) return ''
  return HANDOFF_LABELS[value] ?? value.replace(/_/g, ' ')
}

export function narrativeFunctionLabel(key: string | null | undefined): string {
  if (!key) return ''
  const fn = FUNCTION_DESCRIPTORS[key]
  return fn?.label ?? key.replace(/_/g, ' ')
}

const RECORDING_QUALITY_SHORT: Record<string, string> = {
  pristine: 'Pristine studio',
  intimate: 'Intimate room',
  lofi: 'Lo-fi / vintage',
  raw: 'Raw / textured',
}

export function recordingQualityLabel(value: string | null | undefined): string {
  if (!value) return ''
  return RECORDING_QUALITY_SHORT[value] ?? value.replace(/_/g, ' ')
}
