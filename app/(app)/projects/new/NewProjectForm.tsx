'use client'

// New project form ("Order of Production"). Title and format are required;
// slate, runtime, engine, and roster invites are optional. The creator
// becomes the project owner — owner row is read-only on the binder, no
// role selector. Submit POSTs the project, then fans out invites in
// parallel against the same /api/projects/[id]/invite route used by the
// settings page (same email behavior, same accepted-vs-pending model).
//
// Class names mirror the Claude Design HTML one-for-one (titlepage, format,
// fmt, optional, field, roster-sec, roster-row, roster-add, commit, …) so a
// side-by-side diff against
// /tmp/leitmotif-new-project-design/leitmotif/project/Leitmotif New Project.html
// stays legible.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import s from './new.module.css'

type EngineId = 'stable_audio' | 'lyria'
type FormatId = 'feature' | 'episodic' | 'short' | 'commercial' | 'documentary'
type InviteRoleId = 'composer' | 'music_supervisor' | 'sound_designer' | 'viewer'

interface InviteRow {
  key: string
  name: string
  email: string
  role: InviteRoleId
}

interface FormatOption {
  value: FormatId
  numeral: string
  shortTag: string
  name: string
  sub: string
}

const FORMAT_OPTIONS: FormatOption[] = [
  { value: 'feature',     numeral: 'i',   shortTag: 'feature', name: 'Feature film',  sub: 'A full-length picture, theatrical or streaming.' },
  { value: 'episodic',    numeral: 'ii',  shortTag: 'series',  name: 'Episodic / TV', sub: 'Episodic — reels by episode, scored across a season.' },
  { value: 'short',       numeral: 'iii', shortTag: 'short',   name: 'Short film',    sub: 'Under forty minutes; a single reel of cues.' },
  { value: 'commercial',  numeral: 'iv',  shortTag: 'advert',  name: 'Commercial',    sub: 'Spot work — fifteen, thirty, sixty seconds.' },
  { value: 'documentary', numeral: 'v',   shortTag: 'doc',     name: 'Documentary',   sub: 'Long-form non-fiction; interview-led or observational.' },
]

const ENGINE_OPTIONS: { value: EngineId; label: string }[] = [
  { value: 'stable_audio', label: 'Engine A · spec-led' },
  { value: 'lyria',        label: 'Engine B · prosaic' },
]

const ROLE_OPTIONS: { value: InviteRoleId; label: string }[] = [
  { value: 'composer',         label: 'Composer' },
  { value: 'music_supervisor', label: 'Supervisor' },
  { value: 'sound_designer',   label: 'Sound' },
  { value: 'viewer',           label: 'Viewer' },
]

const COUNT_WORDS = ['Zero names', 'One name', 'Two names', 'Three names', 'Four names', 'Five names']

interface Props {
  ownerName: string
  ownerEmail: string
}

export default function NewProjectForm({ ownerName, ownerEmail }: Props) {
  const router = useRouter()

  // Field state ───────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [format, setFormat] = useState<FormatId>('feature')
  const [slate, setSlate] = useState('')
  const [slateTouched, setSlateTouched] = useState(false)
  const [runtime, setRuntime] = useState('')
  // Default mirrors GenerationSettings.model_provider default ("lyria"). The
  // design highlights Engine A first, but we follow the codebase default so
  // the same project created without a pick matches everywhere.
  const [engine, setEngine] = useState<EngineId>('lyria')
  const [inviteNote, setInviteNote] = useState('')
  const [invites, setInvites] = useState<InviteRow[]>([
    { key: cryptoKey(), name: '', email: '', role: 'composer' },
  ])
  const [submitting, setSubmitting] = useState(false)

  // Derived display ───────────────────────────────────────────────────────────
  const trimmedTitle = title.trim()
  const titleLong = trimmedTitle.length >= 22
  const akaText = titleLong ? trimmedTitle.slice(0, 18) + '…' : ''
  const slateSuggestion = useMemo(() => deriveSlate(trimmedTitle), [trimmedTitle])
  // Match the design's input-vs-suggestion priority: once the user touches the
  // slate field (even just to clear it), the credit line stops echoing the
  // auto-derived suggestion and reflects only what was typed.
  const slateForCredit = slateTouched
    ? (slate.trim() ? slate.trim().toUpperCase() : '')
    : slateSuggestion
  const runtimeHint = runtimeHintLabel(runtime)
  // Match the design's "X names on the binder" framing, which counts only
  // rows where a name has been pencilled in (email alone doesn't earn a name).
  const namedInvites = invites.filter((r) => r.name.trim().length > 0)
  const totalNames = 1 + namedInvites.length
  const countWord = COUNT_WORDS[totalNames] ?? `${totalNames} names`

  const canSubmit = trimmedTitle.length > 0 && !!format && !submitting

  // Roster handlers ───────────────────────────────────────────────────────────
  function updateInvite(key: string, patch: Partial<InviteRow>) {
    setInvites((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }
  function addInvite() {
    setInvites((prev) => [...prev, { key: cryptoKey(), name: '', email: '', role: 'composer' }])
  }
  function clearOrRemoveInvite(key: string) {
    setInvites((prev) => {
      if (prev.length > 1) return prev.filter((r) => r.key !== key)
      return prev.map((r) =>
        r.key === key ? { ...r, name: '', email: '', role: 'composer' } : r
      )
    })
  }

  // Submit ────────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)

    const runtimeNum = runtime.trim() ? Number.parseInt(runtime, 10) : null
    const slateValue = slate.trim() || slateSuggestion || null

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: trimmedTitle,
        format,
        runtime_minutes:
          runtimeNum !== null && Number.isFinite(runtimeNum) && runtimeNum > 0
            ? runtimeNum
            : null,
        slate: slateValue,
        model_provider: engine,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(typeof data.error === 'string' ? data.error : 'Could not open the production')
      setSubmitting(false)
      return
    }

    const { project } = (await res.json()) as { project: { id: string } }

    // Fan out invites for any pencilled-in row that has an email.
    const toInvite = invites.filter((r) => r.email.trim().length > 0)
    if (toInvite.length > 0) {
      const note = inviteNote.trim() || null
      const results = await Promise.allSettled(
        toInvite.map((r) =>
          fetch(`/api/projects/${project.id}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: r.email.trim(),
              role: r.role,
              note,
            }),
          }).then(async (resp) => {
            if (!resp.ok) {
              const d = await resp.json().catch(() => ({}))
              throw new Error(typeof d.error === 'string' ? d.error : `Invite failed for ${r.email}`)
            }
            return resp.json()
          })
        )
      )
      const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]
      if (failed.length > 0) {
        toast.error(`Production opened — ${failed.length} invite${failed.length === 1 ? '' : 's'} could not be sent`)
      } else {
        toast.success(`Production opened · ${toInvite.length} invite${toInvite.length === 1 ? '' : 's'} on the way`)
      }
    } else {
      toast.success('Production opened')
    }

    router.push(`/projects/${project.id}`)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className={s.page}>
      <Link href="/projects" className={s.crumbBack}>
        <span className={s.crumbArrow}>←</span>
        <span>Back to all productions</span>
      </Link>

      {/* ─── Title page (the ceremonial bit) ─────────────────────────── */}
      <section className={s.titlepage}>
        <div className={s.tpRuleTop}>
          <div />
          <div className={s.tpRuleTopC}>
            Leitmotif <span className={s.orn} /> Order of Production <span className={s.orn} />{' '}
            No. <span className={s.tpRuleTopPending}>pending</span>
          </div>
          <div />
        </div>

        <p className={s.tpPre}>
          A production opens on the day it is named. <em>— Begin here.</em>
        </p>

        <div className={s.tpTitleWrap}>
          {titleLong && (
            <span className={s.tpAka}>
              Working title<em>{akaText}</em>
            </span>
          )}
          <input
            id="f-title"
            className={s.tpTitle}
            type="text"
            placeholder="Name the production"
            spellCheck={false}
            autoComplete="off"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <span className={s.tpTitleRule} />
          <span className={s.tpTitleTip}>
            Title<span className={s.req}>— required</span>
          </span>
        </div>

        <div className={s.tpCredit}>
          <div className={s.tpCreditL}>
            Director <em>{ownerName}</em>
          </div>
          <div className={s.tpCreditC}>
            <span className={s.orn} />opened today<span className={s.orn} />
          </div>
          <div className={s.tpCreditR}>
            Slate <em>{slateForCredit ? `— ${slateForCredit}` : '— pending'}</em>
          </div>
        </div>
      </section>

      {/* ─── §I Format ───────────────────────────────────────────────── */}
      <section className={s.format}>
        <div className={s.formatHead}>
          <div className={s.formatNum}>§I</div>
          <div className={s.formatTag}>
            Format<em>What kind of thing is this?</em>
          </div>
          <div className={s.formatReq}>Required</div>
        </div>

        <div className={s.formatRow} role="radiogroup" aria-label="Format">
          {FORMAT_OPTIONS.map((opt) => {
            const active = format === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                className={`${s.fmt} ${active ? s.isOn : ''}`}
                onClick={() => setFormat(opt.value)}
              >
                <span className={s.fmtNum}>
                  <span className={s.fmtDot} />
                  {opt.numeral} · {opt.shortTag}
                </span>
                <span className={s.fmtName}>{opt.name}</span>
                <span className={s.fmtSub}>{opt.sub}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ─── §II Optional fields ─────────────────────────────────────── */}
      <section className={s.optional}>
        <div className={s.optHead}>
          <div className={s.optNum}>§II</div>
          <div className={s.optTag}>
            Production metadata<em>Optional — pencil in if you have it.</em>
          </div>
          <div className={s.optAside}>Editable later</div>
        </div>

        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor="f-slate">
            Slate identifier
          </label>
          <input
            id="f-slate"
            className={`${s.fieldInput} ${s.mono}`}
            type="text"
            placeholder={slateTouched ? 'LL-2026-014' : (slateSuggestion || 'LL-2026-014')}
            value={slate}
            onChange={(e) => {
              setSlateTouched(true)
              setSlate(e.target.value.slice(0, 16))
            }}
          />
          <span className={s.fieldAside}>Carries onto every brief</span>
        </div>

        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor="f-runtime">
            Runtime
          </label>
          <span className={s.unitRow}>
            <input
              id="f-runtime"
              className={s.fieldInput}
              type="text"
              inputMode="numeric"
              placeholder="118"
              value={runtime}
              onChange={(e) => setRuntime(e.target.value.replace(/[^\d]/g, ''))}
            />
            <span className={s.unit}>minutes</span>
            <span className={s.runtimeHint}>{runtimeHint || '— estimate is fine'}</span>
          </span>
          <span />
        </div>

        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor="f-engine">
            Reference cue engine
          </label>
          <span
            className={s.quietSelect}
            role="radiogroup"
            aria-label="Reference cue engine"
            id="f-engine"
          >
            {ENGINE_OPTIONS.map((opt) => {
              const active = engine === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`${s.opt} ${active ? s.isOn : ''}`}
                  onClick={() => setEngine(opt.value)}
                >
                  {opt.label}
                </button>
              )
            })}
          </span>
          <span className={s.fieldAside}>Production metadata</span>
        </div>
        <p className={s.quietEngineNote}>
          Engine A holds tight to the musical specification — tempo, harmony, exclusions — and is
          the default for cues with detailed direction. <em>Engine B</em> is freer with the
          director&rsquo;s words and suits looser, prose-first briefs.
        </p>
      </section>

      {/* ─── §III Roster ─────────────────────────────────────────────── */}
      <section className={s.rosterSec}>
        <div className={s.rosterHead}>
          <div className={s.rosterNum}>§III</div>
          <div className={s.rosterTag}>
            In the room<em>Pencil in the names — invites send when you open the production.</em>
          </div>
          <div className={s.rosterAside}>Optional</div>
        </div>

        <div className={s.rosterList}>
          <div className={s.rosterCap}>
            <span />
            <span>Name</span>
            <span>Role</span>
            <span />
          </div>

          {/* Owner row — pre-filled from session, immovable */}
          <div className={s.rosterRow}>
            <span className={s.rosterNo}>01</span>
            <div>
              <div className={s.rosterName}>
                {ownerName}
                <span className={s.you}>— you</span>
              </div>
              <span className={s.rosterEmail}>{ownerEmail}</span>
            </div>
            <div className={s.rosterRole}>
              Director
              <span className={s.signed}>— opens the production</span>
            </div>
            <div className={s.rosterAct} />
          </div>

          {invites.map((row, idx) => {
            const num = String(idx + 2).padStart(2, '0')
            return (
              <div key={row.key} className={s.rosterAdd}>
                <span className={s.rosterAddNo}>{num}</span>
                <div className={s.rosterAddCell}>
                  <input
                    className={s.fieldInput}
                    type="text"
                    placeholder="A name…"
                    autoComplete="off"
                    value={row.name}
                    onChange={(e) => updateInvite(row.key, { name: e.target.value })}
                  />
                  <input
                    className={s.rosterEmailInput}
                    type="email"
                    placeholder="email@studio.com"
                    autoComplete="off"
                    value={row.email}
                    onChange={(e) => updateInvite(row.key, { email: e.target.value })}
                  />
                </div>
                <div className={s.rosterAddRole} role="radiogroup" aria-label="Invite role">
                  {ROLE_OPTIONS.map((r) => {
                    const active = row.role === r.value
                    return (
                      <button
                        key={r.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={`${s.opt} ${active ? s.isOn : ''}`}
                        onClick={() => updateInvite(row.key, { role: r.value })}
                      >
                        {r.label}
                      </button>
                    )
                  })}
                </div>
                <div className={s.rosterAddAct}>
                  <button
                    className={s.btnStrike}
                    type="button"
                    title="Clear this row"
                    onClick={() => clearOrRemoveInvite(row.key)}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className={s.rosterFoot}>
          <span>
            <strong>{countWord}</strong>on the binder so far
          </span>
          <button className={s.addAnother} type="button" onClick={addInvite}>
            <span className={s.glyph}>+</span>Pencil in another name
          </button>
        </div>

        <div className={s.inviteNote}>
          <label htmlFor="inv-note">
            A line for them<br />(optional)
          </label>
          <textarea
            id="inv-note"
            rows={2}
            placeholder="A short note carried on every invite — the project is opening and here is what you're stepping into."
            value={inviteNote}
            onChange={(e) => setInviteNote(e.target.value)}
          />
        </div>
      </section>

      {/* ─── Commit ──────────────────────────────────────────────────── */}
      <section className={s.commit}>
        <div className={s.commitL}>
          <div className={s.commitStamp}>
            <span className={s.punch} />Commit · the binder is opened on submission
          </div>
          <p className={s.commitLine}>
            Once opened, the production gets a slate, a folio in the binder, and a quiet email
            out to anyone you&rsquo;ve named — <em>then we go to its detail page.</em>
          </p>
        </div>
        <div className={s.commitR}>
          <Link href="/projects" className={s.btnCancel}>
            Cancel
          </Link>
          <button
            type="button"
            className={s.btnOpen}
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            {submitting ? 'Opening…' : 'Open the production'}
            <span className={s.arrow}>→</span>
          </button>
        </div>
      </section>

      <footer className={s.formFoot}>
        <span>© Leitmotif</span>
        <span className={s.formFootC}>— a vocabulary bridge —</span>
        <span>Order of Production / rev. 1</span>
      </footer>
    </main>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function cryptoKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

function deriveSlate(title: string): string {
  const t = title.trim()
  if (!t) return ''
  const words = t.split(/\s+/).filter((w) => /[A-Za-z]/.test(w))
  const initials = words
    .slice(0, 3)
    .map((w) => w.replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase())
    .join('')
  const seq = '014'
  const yr = new Date().getFullYear()
  return `${initials || 'XX'}-${yr}-${seq}`
}

function runtimeHintLabel(raw: string): string {
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n <= 0) return ''
  const h = Math.floor(n / 60)
  const m = n % 60
  let pretty = ''
  if (h > 0 && m > 0) pretty = `≈ ${h} h ${pad2(m)} m`
  else if (h > 0)     pretty = `≈ ${h} h flat`
  else                pretty = `≈ ${m} m`
  let label = ''
  if (n < 5) label = 'spot'
  else if (n < 40) label = 'short'
  else if (n < 240) label = 'feature cut'
  else label = 'long-form'
  return `${pretty} · ${label}`
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}
