import type { SceneState } from '@/lib/store'

/**
 * Status vocabulary borrowed from the design's per-scene language. The
 * "tone" buckets drive the row's status-column colour band (.statEmber,
 * .statWarm, .statInk, .statMuted) and the cue-column glyph.
 */
export interface StatusMeta {
  label: string
  short: string
  mark: string
  tone: 'muted' | 'ink' | 'warm' | 'ember'
}

export const STATUS_META: Record<SceneState, StatusMeta> = {
  spotting:     { label: 'To be spotted',       short: 'spotting',     mark: '·', tone: 'muted' },
  intent:       { label: 'Intent saved',         short: 'intent saved', mark: '—', tone: 'ink'   },
  rendering:    { label: 'Mock generating',      short: 'generating',   mark: '◐', tone: 'warm'  },
  for_approval: { label: 'Awaiting your eye',    short: 'for approval', mark: '●', tone: 'ember' },
  delivered:    { label: 'With composer',        short: 'delivered',    mark: '▸', tone: 'ink'   },
  acknowledged: { label: "In composer's hand",   short: 'acknowledged', mark: '♪', tone: 'muted' },
  scored:       { label: 'Scored',               short: 'scored',       mark: '✓', tone: 'muted' },
}

/**
 * Tries to compute "M:SS" duration between two SMPTE timecodes
 * (HH:MM:SS:FF). Returns null when either value can't be parsed.
 */
export function durationFromSmpte(tcIn: string | null, tcOut: string | null): string | null {
  const a = parseSmpteSeconds(tcIn)
  const b = parseSmpteSeconds(tcOut)
  if (a == null || b == null || b <= a) return null
  return formatMinSec(b - a)
}

function parseSmpteSeconds(s: string | null): number | null {
  if (!s) return null
  const parts = s.split(':')
  if (parts.length < 3) return null
  const [hh, mm, ss] = parts
  const h = Number(hh), m = Number(mm), sec = Number(ss)
  if (![h, m, sec].every(Number.isFinite)) return null
  return h * 3600 + m * 60 + sec
}

function formatMinSec(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = Math.floor(totalSec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** "M:SS" duration straight from a video duration in seconds. */
export function formatVideoDuration(seconds: number | null): string | null {
  if (seconds == null || seconds <= 0) return null
  return formatMinSec(seconds)
}

/**
 * The reel's SMPTE range (lowest tc_in across its scenes → highest tc_out).
 * Falls back to null when no scene has both timecodes set.
 */
export function reelSmpteRange(
  scenes: { tc_in_smpte: string | null; tc_out_smpte: string | null }[]
): string | null {
  let firstIn: string | null = null
  let lastOut: string | null = null
  let firstInSec = Infinity
  let lastOutSec = -Infinity
  for (const s of scenes) {
    const a = parseSmpteSeconds(s.tc_in_smpte)
    const b = parseSmpteSeconds(s.tc_out_smpte)
    if (a != null && a < firstInSec) { firstInSec = a; firstIn = s.tc_in_smpte }
    if (b != null && b > lastOutSec) { lastOutSec = b; lastOut = s.tc_out_smpte }
  }
  if (!firstIn || !lastOut) return null
  return `${trimFrames(firstIn)} → ${trimFrames(lastOut)}`
}

function trimFrames(smpte: string): string {
  // Reel-range display drops the frames slot for legibility; the row keeps it.
  const parts = smpte.split(':')
  return parts.length >= 3 ? `${parts[0]}:${parts[1]}:${parts[2]}` : smpte
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad(n: number): string { return n < 10 ? `0${n}` : String(n) }

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

/**
 * Casual-relative phrasing for the "last touched" cell, mirroring the
 * projects-list lib.casualRelative behaviour but returning a single string
 * since the binder row only has space for one line.
 */
export function lastTouchedLabel(iso: string | null, now: Date = new Date()): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (isSameDay(d, now)) {
    const h = d.getHours()
    return h < 12 ? 'this morning' : h < 17 ? 'this afternoon' : 'this evening'
  }
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  if (isSameDay(d, yesterday)) return 'yesterday'
  const ageDays = (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000)
  if (ageDays < 7) return `${WEEKDAYS[d.getDay()]} · ${time}`
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** "Reel N — name" when name has been customised, else just "Reel N". */
export function reelDisplayName(name: string, cuePosition: number): { positional: string; subtitle: string | null } {
  const positional = `Reel ${cuePosition}`
  const subtitle = name.trim() === positional ? null : name.trim()
  return { positional, subtitle }
}

/**
 * Per-row margin note, derived purely from machine-knowable state. A
 * director_note from the schema preempts these; see ProjectBinder.
 */
export function autoMarginNote(scene: {
  state: SceneState
  versions: number
  rendering_provider: string | null
}): string | null {
  switch (scene.state) {
    case 'rendering':
      return scene.rendering_provider
        ? `Generating — ${formatProvider(scene.rendering_provider)}`
        : 'Generating — mock cue in flight'
    case 'for_approval':
      return scene.versions > 0 ? `Mock v${scene.versions} ready for your eye` : null
    default:
      return null
  }
}

function formatProvider(p: string): string {
  if (p === 'stable_audio') return 'Stable Audio'
  if (p === 'lyria') return 'Lyria'
  return p
}

/** Project-level "Standing" line ordering, mirroring the design's emphasis. */
export interface StandingItem {
  kind: 'attn' | 'ink' | 'warm' | 'quiet'
  glyph: string
  count: number
  label: string
}

export function standingItems(
  standing: Record<SceneState, number>,
  attentionCount: number
): StandingItem[] {
  const items: StandingItem[] = []
  if (attentionCount > 0) {
    items.push({
      kind: 'attn', glyph: '●', count: attentionCount,
      label: attentionCount === 1 ? 'cue for your eye' : 'cues for your eye',
    })
  }
  if (standing.delivered > 0) {
    items.push({ kind: 'ink', glyph: '▸', count: standing.delivered, label: 'with composer' })
  }
  if (standing.rendering > 0) {
    items.push({ kind: 'warm', glyph: '◐', count: standing.rendering, label: 'generating' })
  }
  if (standing.intent > 0) {
    items.push({ kind: 'ink', glyph: '—', count: standing.intent, label: 'intent saved' })
  }
  if (standing.spotting > 0) {
    items.push({ kind: 'quiet', glyph: '·', count: standing.spotting, label: 'still to spot' })
  }
  if (standing.acknowledged > 0) {
    items.push({ kind: 'quiet', glyph: '♪', count: standing.acknowledged, label: "in composer's hand" })
  }
  if (standing.scored > 0) {
    items.push({ kind: 'quiet', glyph: '✓', count: standing.scored, label: 'scored' })
  }
  return items
}

/** Action verb on the row's enter column, picked by state. */
export function rowEnterLabel(state: SceneState): string {
  if (state === 'spotting') return 'Spot'
  if (state === 'for_approval') return 'Review'
  return 'Open'
}

/** Reel-level attention count (cues awaiting director's eye). */
export function reelAttentionCount(scenes: { state: SceneState }[]): number {
  return scenes.filter((s) => s.state === 'for_approval').length
}

const FORMAT_LABELS: Record<string, string> = {
  feature: 'Feature',
  episodic: 'Episodic',
  short: 'Short',
  commercial: 'Commercial',
}

export function formatLabel(format: string): string {
  return FORMAT_LABELS[format] ?? format.charAt(0).toUpperCase() + format.slice(1)
}

export function runtimeDisplay(minutes: number | null): string | null {
  if (minutes == null || minutes <= 0) return null
  return `${minutes}′`
}
