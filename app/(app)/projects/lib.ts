import { canApprove, canAcknowledge, type EffectiveRole } from '@/lib/roles'
import type { ProjectListRow } from '@/lib/store'

export function greetingWord(date: Date): string {
  // TODO: read user TZ from request headers — server runs UTC on Vercel so the
  // greeting word will be wrong for users whose local hour crosses a boundary.
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let out = ''
  let r = n
  for (const [v, s] of map) {
    while (r >= v) { out += s; r -= v }
  }
  return out
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Casual-relative + absolute pair, matching the design's two lines per row.
 * "this morning" / "10:42"; "yesterday" / "Tue · 21:08"; "Mon · 16:30"; "Apr 28".
 */
export function casualRelative(date: Date, now: Date = new Date()): { rel: string; abs: string } {
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  const wk = WEEKDAYS[date.getDay()]
  const monthDay = `${MONTHS[date.getMonth()]} ${date.getDate()}`

  if (isSameDay(date, now)) {
    const h = date.getHours()
    const rel = h < 12 ? 'this morning' : h < 17 ? 'this afternoon' : 'this evening'
    return { rel, abs: time }
  }
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  if (isSameDay(date, yesterday)) {
    return { rel: 'yesterday', abs: `${wk} · ${time}` }
  }
  const ageDays = (now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000)
  if (ageDays < 7) {
    const both = `${wk} · ${time}`
    return { rel: both, abs: both }
  }
  return { rel: monthDay, abs: monthDay }
}

export interface RoleCredit {
  lead: string
  sub: string | null
  /** Used to drive the role-symbol pseudo-element on the row. */
  key: 'owner' | 'director' | 'composer' | 'supv' | 'sound' | 'viewer'
}

export function roleCredit(
  viewerRole: string,
  counterpartName: string | null,
  counterpartRole: ProjectListRow['counterpartRole']
): RoleCredit {
  const sub = counterpartName ? formatCounterpart(viewerRole, counterpartName, counterpartRole) : null
  switch (viewerRole) {
    case 'owner':            return { lead: 'Directed by you', sub, key: 'owner' }
    case 'director':         return { lead: 'Directed by you', sub, key: 'director' }
    case 'composer':         return { lead: 'Composer',        sub, key: 'composer' }
    case 'music_supervisor': return { lead: 'Music supervisor', sub, key: 'supv' }
    case 'sound_designer':   return { lead: 'Sound design',    sub, key: 'sound' }
    case 'viewer':           return { lead: 'Observing',       sub, key: 'viewer' }
    default:                 return { lead: 'Observing',       sub, key: 'viewer' }
  }
}

function formatCounterpart(
  viewerRole: string,
  name: string,
  cpRole: ProjectListRow['counterpartRole']
): string {
  // Suffix by counterpart's role; preposition by viewer's relationship.
  const suffix = cpRole === 'composer' ? 'comp.' : cpRole === 'director' || cpRole === 'owner' ? 'dir.' : ''
  const tail = suffix ? `${name}, ${suffix}` : name
  if (viewerRole === 'owner' || viewerRole === 'director') return `with ${tail}`
  if (viewerRole === 'composer' || viewerRole === 'sound_designer') return `for ${tail}`
  return tail
}

export type StandingKind = 'approval' | 'ack' | 'pending' | 'calm'
export interface StandingItem { kind: StandingKind; text: string }

/**
 * Standing bullets for a row. Approval/ack lines only appear when the viewer
 * is the one who can act on them — a composer doesn't see a banner for cues
 * still awaiting the director's approval, etc.
 */
export function computeStanding(
  row: Pick<ProjectListRow, 'cuesAwaitingApproval' | 'cuesAwaitingAck' | 'jobsInFlight'>,
  viewerRole: string
): StandingItem[] {
  const items: StandingItem[] = []
  const role = viewerRole as EffectiveRole
  if (canApprove(role) && row.cuesAwaitingApproval > 0) {
    items.push({ kind: 'approval', text: `${row.cuesAwaitingApproval} cue${row.cuesAwaitingApproval === 1 ? '' : 's'} for approval` })
  }
  if (canAcknowledge(role) && row.cuesAwaitingAck > 0) {
    items.push({ kind: 'ack', text: `${row.cuesAwaitingAck} brief${row.cuesAwaitingAck === 1 ? '' : 's'} to acknowledge` })
  }
  if (row.jobsInFlight > 0) {
    items.push({ kind: 'pending', text: `${row.jobsInFlight} generating` })
  }
  if (items.length === 0) items.push({ kind: 'calm', text: 'Caught up' })
  return items
}

/** Sum of attention items across all visible rows for the greeting headline. */
export function totalAttention(rows: ProjectListRow[]): number {
  let total = 0
  for (const r of rows) {
    const role = r.viewerRole as EffectiveRole
    if (canApprove(role)) total += r.cuesAwaitingApproval
    if (canAcknowledge(role)) total += r.cuesAwaitingAck
  }
  return total
}

const FORMAT_DISPLAY: Record<string, string> = {
  feature: 'Feature',
  episodic: 'Episodic',
  short: 'Short',
  commercial: 'Commercial',
}
export function formatDisplay(format: string): string {
  return FORMAT_DISPLAY[format] ?? (format.charAt(0).toUpperCase() + format.slice(1))
}

const MAST_MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "Monday · 04 May" — for the masthead date. */
export function mastheadDate(date: Date): string {
  const wk = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]
  return `${wk} · ${pad(date.getDate())} ${MAST_MONTHS_LONG[date.getMonth()].slice(0, 3)}`
}

/** "IK" from "Iris Kowal"; falls back to the email's local-part initials. */
export function initialsOf(name: string | null, email: string): string {
  const source = name?.trim() || email.split('@')[0]
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
