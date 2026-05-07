'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { type ProjectRole } from '@/lib/roles'
import s from './settings.module.css'

interface MemberRow {
  id: string
  name: string | null
  email: string
  role: string
  invited_at: string
  accepted_at: string | null
  is_pending: boolean
}

interface OwnerRow {
  profile_id: string
  name: string | null
  email: string
  invited_at: string
}

interface ProjectShape {
  id: string
  title: string
  format: string
  runtime_minutes: number | null
  slate: string | null
  created_at: string
  updated_at: string
}

interface StrikeManifest {
  reels: number
  cues: number
  intent_versions: number
  reference_recordings: number
  approved_briefs: number
  comments: number
  members_accepted: number
  members_pending: number
}

interface UserShape { name: string | null; email: string }

interface Props {
  user: UserShape
  project: ProjectShape
  modelProvider: string
  owner: OwnerRow
  members: MemberRow[]
  acceptedCount: number
  pendingCount: number
  totalCues: number
  openCues: number
  reelCount: number
  strikeManifest: StrikeManifest
  viewerIsOwner: boolean
  viewerCanDirect: boolean
  viewerProfileId: string
}

const FORMAT_OPTIONS: { value: string; label: string }[] = [
  { value: 'feature',    label: 'Feature' },
  { value: 'episodic',   label: 'Episodic' },
  { value: 'short',      label: 'Short' },
  { value: 'commercial', label: 'Commercial' },
]

// Engine A = Stable Audio 2.5: spec-led, native negative prompt, exact duration.
// Engine B = Lyria 3 via Gemini: prose-first, freer with director's words.
// Provider name is intentionally not surfaced — this is production metadata.
const ENGINE_OPTIONS: { value: string; label: string }[] = [
  { value: 'stable_audio', label: 'Engine A · spec-led' },
  { value: 'lyria',        label: 'Engine B · prosaic' },
]

const ROLE_OPTIONS: { value: ProjectRole; label: string }[] = [
  { value: 'composer',         label: 'Composer' },
  { value: 'director',         label: 'Director' },
  { value: 'music_supervisor', label: 'Music supervisor' },
  { value: 'sound_designer',   label: 'Sound designer' },
  { value: 'viewer',           label: 'Viewer' },
]

export default function SettingsForm(props: Props) {
  const router = useRouter()

  // §1 form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(props.project.title)
  const [runtime, setRuntime] = useState(
    props.project.runtime_minutes != null ? String(props.project.runtime_minutes) : ''
  )
  const [slate, setSlate] = useState(props.project.slate ?? '')
  const [format, setFormat] = useState(props.project.format)
  const [modelProvider, setModelProvider] = useState(props.modelProvider)
  const [savedAt, setSavedAt] = useState(props.project.updated_at)
  const [saving, setSaving] = useState(false)

  const initial = useMemo(
    () => ({
      title: props.project.title,
      runtime: props.project.runtime_minutes != null ? String(props.project.runtime_minutes) : '',
      slate: props.project.slate ?? '',
      format: props.project.format,
      modelProvider: props.modelProvider,
    }),
    [props.modelProvider, props.project]
  )
  const isDirty =
    title !== initial.title ||
    runtime !== initial.runtime ||
    slate !== initial.slate ||
    format !== initial.format ||
    modelProvider !== initial.modelProvider

  async function handleSaveSection1() {
    setSaving(true)
    const runtimeNum = runtime.trim() === '' ? null : Number.parseInt(runtime, 10)
    const res = await fetch(`/api/projects/${props.project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        runtime_minutes:
          runtimeNum !== null && Number.isFinite(runtimeNum) ? runtimeNum : null,
        slate: slate.trim() || null,
        format,
        // model_provider lives on GenerationSettings; the route accepts it
        // under `settings`. Other generation knobs are intentionally not sent.
        settings: { model_provider: modelProvider },
      }),
    })
    setSaving(false)
    if (!res.ok) {
      toast.error('Could not save the production block')
      return
    }
    setSavedAt(new Date().toISOString())
    toast.success('Saved §1')
    router.refresh()
  }

  // §2 invite + remove state ──────────────────────────────────────────────────
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<ProjectRole>('composer')
  const [inviteNote, setInviteNote] = useState('')
  const [inviting, setInviting] = useState(false)
  const [, startTransition] = useTransition()

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    const res = await fetch(`/api/projects/${props.project.id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail.trim(),
        role: inviteRole,
        note: inviteNote.trim() || null,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setInviting(false)
    if (!res.ok) {
      toast.error(typeof data.error === 'string' ? data.error : 'Could not send invite')
      return
    }
    if (data.emailSent) {
      toast.success(`Invite sent to ${inviteEmail.trim()}`)
    } else if (typeof data.emailWarning === 'string') {
      toast.success('Invite saved', { description: data.emailWarning })
    } else if (typeof data.inviteUrl === 'string') {
      toast.success('Invite saved', { description: `Share: ${data.inviteUrl}` })
    } else {
      toast.success(`Invited ${inviteEmail.trim()}`)
    }
    setInviteEmail('')
    setInviteNote('')
    startTransition(() => router.refresh())
  }

  async function handleRemoveMember(memberId: string) {
    const res = await fetch(`/api/projects/${props.project.id}/members/${memberId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      toast.error('Could not remove')
      return
    }
    startTransition(() => router.refresh())
  }

  // §3 strike state ───────────────────────────────────────────────────────────
  const [strikeArmed, setStrikeArmed] = useState(false)
  const [strikeText, setStrikeText] = useState('')
  const [striking, setStriking] = useState(false)
  const titleCaps = props.project.title.trim().toUpperCase()
  const strikeReady = strikeText.trim().toUpperCase() === titleCaps

  async function handleStrike() {
    setStriking(true)
    const res = await fetch(`/api/projects/${props.project.id}/delete`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      setStriking(false)
      toast.error('Could not strike the production')
      return
    }
    toast.success('Production struck')
    router.push('/projects')
    router.refresh()
  }

  // Derived display ───────────────────────────────────────────────────────────
  const productionNo = props.project.slate?.trim() || shortSlug(props.project.id)
  const openedDate = formatLongDate(props.project.created_at)
  const lastRevisedDate = formatRevisionDate(savedAt)
  const ownerJoined = `${formatShortJoinDate(props.owner.invited_at)} · opened`
  const runtimeHint = runtimeHintLabel(runtime, format)
  const totalNames = props.acceptedCount + props.pendingCount

  const ownerIsViewer = props.owner.profile_id === props.viewerProfileId

  return (
    <main className={s.page}>
      <Link href={`/projects/${props.project.id}`} className={s.crumbBack}>
        <span className={s.crumbArrow}>←</span>
        <span>Back to the binder · {props.project.title}</span>
      </Link>

      {/* FORM HEAD ─────────────────────────────────────────────────── */}
      <header className={s.formHead}>
        <div>
          <div className={s.formNo}>
            <span className={s.punch} />Form 7B · Production Record
          </div>
          <h1 className={s.formTitle}>
            {props.project.title}
            <em>— administrative</em>
          </h1>
        </div>
        <div className={s.formStamp}>
          Production № <strong>{productionNo}</strong>
          <em>opened {openedDate}</em>
        </div>
      </header>

      <div className={s.formMeta}>
        <div>Owner<strong>{ownerDisplayName(props.owner)}</strong></div>
        <div>Last revised<strong>{lastRevisedDate}</strong></div>
        <div>Open cues<strong>{props.openCues} of {props.totalCues}</strong></div>
      </div>

      {/* §1 — PRODUCTION ────────────────────────────────────────────── */}
      <section className={s.sec}>
        <div className={s.secRail}>
          <div className={s.secNum}>§1</div>
          <div className={s.secTag}>Production</div>
        </div>
        <div className={s.secBody}>
          <h2 className={s.secH}>Title block</h2>
          <p className={s.secSub}>
            The standing line on the binder, the brief, every email out. Editable by Owner and Director.
          </p>

          <div className={s.field}>
            <label className={s.fieldLabel} htmlFor="f-title">
              Title<span className={s.req}>*</span>
            </label>
            <input
              id="f-title"
              className={s.fieldInput}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!props.viewerCanDirect}
            />
            <span className={s.fieldAside}>22 chars max recommended</span>
          </div>

          <div className={s.field}>
            <label className={s.fieldLabel} htmlFor="f-runtime">Runtime</label>
            <span className={s.unitRow}>
              <input
                id="f-runtime"
                className={s.fieldInput}
                type="text"
                inputMode="numeric"
                value={runtime}
                onChange={(e) => setRuntime(e.target.value.replace(/[^\d]/g, ''))}
                disabled={!props.viewerCanDirect}
              />
              <span className={s.unit}>minutes</span>
              {runtimeHint ? <span className={s.runtimeHint}>{runtimeHint}</span> : null}
            </span>
            <span />
          </div>

          <div className={s.field}>
            <label className={s.fieldLabel} htmlFor="f-slate">Slate</label>
            <input
              id="f-slate"
              className={`${s.fieldInput} ${s.mono}`}
              type="text"
              value={slate}
              onChange={(e) => setSlate(e.target.value.toUpperCase())}
              disabled={!props.viewerCanDirect}
            />
            <span className={s.fieldAside}>Carries onto every brief</span>
          </div>

          <QuietSelectField
            label="Format"
            id="f-format"
            value={format}
            onChange={setFormat}
            options={FORMAT_OPTIONS}
            disabled={!props.viewerCanDirect}
            aside={null}
          />

          <QuietSelectField
            label="Reference cue engine"
            id="f-engine"
            value={modelProvider}
            onChange={setModelProvider}
            options={ENGINE_OPTIONS}
            disabled={!props.viewerCanDirect}
            aside="Production metadata"
          />
          <p className={s.quietEngineNote}>
            Engine A holds tight to the musical specification — tempo, harmony, exclusions — and is the
            default for cues with detailed direction. Engine B is freer with the director&rsquo;s words and
            suits looser, prose-first briefs.
          </p>

          {props.viewerCanDirect && (
            <div className={s.secSave}>
              <span className={`${s.secSaveState} ${isDirty ? s.isDirty : ''}`}>
                <span className={s.glyph}>{isDirty ? '●' : '⁂'}</span>
                {isDirty ? 'Unsaved changes' : `Saved ${lastRevisedDate}`}
              </span>
              <button
                type="button"
                className={s.btnSave}
                disabled={!isDirty || saving}
                onClick={() => void handleSaveSection1()}
              >
                {saving ? 'Saving…' : 'Save §1'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* §2 — COLLABORATORS ─────────────────────────────────────────── */}
      <section className={s.sec}>
        <div className={s.secRail}>
          <div className={s.secNum}>§2</div>
          <div className={s.secTag}>Collaborators</div>
        </div>
        <div className={s.secBody}>
          <h2 className={s.secH}>In the room</h2>
          <p className={s.secSub}>
            Everyone on the production binder — {numberWord(props.acceptedCount)} accepted,{' '}
            {numberWord(props.pendingCount)} pending. Only the owner can invite or strike a name from the list.
          </p>

          <div className={s.roster}>
            <div className={s.rosterHead}>
              <span />
              <span>Name</span>
              <span>Role</span>
              <span>Joined</span>
              <span />
            </div>

            {/* Owner row — sourced from Project.owner, signed credit, no remove */}
            <div className={s.rosterRow}>
              <span className={s.rosterNum}>01</span>
              <div>
                <div className={s.rosterName}>
                  {ownerDisplayName(props.owner)}
                  {ownerIsViewer && <span className={s.you}>— you</span>}
                </div>
                <span className={s.rosterEmail}>{props.owner.email}</span>
              </div>
              <div className={s.rosterRole}>
                Director
                <span className={s.signed}>— signed the production</span>
              </div>
              <div className={s.rosterWhen}>{ownerJoined}</div>
              <div className={s.rosterAct} />
            </div>

            {props.members.map((m, idx) => {
              const num = String(idx + 2).padStart(2, '0')
              const isViewer = m.email.toLowerCase() === props.user.email.toLowerCase()
              const joined = m.is_pending
                ? `invite sent · ${formatShortJoinDate(m.invited_at)}`
                : formatShortJoinDate(m.accepted_at ?? m.invited_at)
              return (
                <div
                  key={m.id}
                  className={`${s.rosterRow} ${m.is_pending ? s.pending : ''}`}
                >
                  <span className={s.rosterNum}>{num}</span>
                  <div>
                    <div className={s.rosterName}>
                      {m.is_pending && <em>Pending —</em>}
                      {m.name?.trim() || m.email}
                      {isViewer && <span className={s.you}>— you</span>}
                    </div>
                    <span className={s.rosterEmail}>{m.email}</span>
                  </div>
                  {/* TODO(role-change): not in this build. To change a role,
                      remove the member and re-invite at the new role. */}
                  <div className={s.rosterRole}>{roleLabelSentence(m.role)}</div>
                  <div className={`${s.rosterWhen} ${m.is_pending ? s.pending : ''}`}>{joined}</div>
                  <div className={s.rosterAct}>
                    {props.viewerIsOwner && (
                      <button
                        type="button"
                        className={s.btnStrike}
                        onClick={() => void handleRemoveMember(m.id)}
                      >
                        {m.is_pending ? 'Withdraw' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            <div className={s.rosterFoot}>
              <span>
                <strong>{capitalize(numberWord(totalNames))} {totalNames === 1 ? 'name' : 'names'}</strong>
                on this binder · {numberWord(props.acceptedCount)} accepted, {numberWord(props.pendingCount)} pending
              </span>
              <em>— in the room —</em>
            </div>
          </div>

          {props.viewerIsOwner && (
            <form className={s.invite} onSubmit={handleInvite}>
              <div className={s.inviteHead}>
                <h4>Add a name</h4>
                <span className={s.note}>Email goes out automatically when delivery is configured</span>
              </div>

              <div className={s.inviteGrid}>
                <div className={s.inviteCell}>
                  <label htmlFor="inv-email">Email</label>
                  <input
                    id="inv-email"
                    className={`${s.fieldInput} ${s.mono}`}
                    type="email"
                    placeholder="composer@studio.com"
                    style={{ textTransform: 'none', fontSize: 14 }}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`${s.btnInvite} ${s.inviteSubmit}`}
                  disabled={inviting || !inviteEmail.trim()}
                >
                  {inviting ? 'Sending…' : 'Send invite'}
                </button>

                <div className={`${s.inviteCell} ${s.inviteCellRoles}`}>
                  <label>Role</label>
                  <span className={s.inviteRoles} role="radiogroup" aria-label="Invite role">
                    {ROLE_OPTIONS.map((r) => {
                      const active = inviteRole === r.value
                      return (
                        <button
                          key={r.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          className={`${s.opt} ${active ? s.isOn : ''}`}
                          onClick={() => setInviteRole(r.value)}
                        >
                          {r.label}
                        </button>
                      )
                    })}
                  </span>
                </div>
              </div>

              <div className={s.inviteNote}>
                <label htmlFor="inv-note">A line for them<br />(optional)</label>
                <textarea
                  id="inv-note"
                  className={s.inviteNoteArea}
                  rows={2}
                  placeholder="Henrik, this is the score handoff for the third act — start with cue 14M3."
                  value={inviteNote}
                  onChange={(e) => setInviteNote(e.target.value)}
                />
              </div>
            </form>
          )}
        </div>
      </section>

      {/* §3 — STRIKE THE PRODUCTION ─────────────────────────────────── */}
      {props.viewerIsOwner && (
        <section className={`${s.sec} ${s.strikeZone}`}>
          <div className={s.secRail}>
            <div className={s.secNum}>§3</div>
            <div className={s.secTag}>End of run</div>
          </div>
          <div className={s.secBody}>
            <div className={s.strikeLine}>
              <p>
                The production stays in the binder until you strike it. Striking removes the cues, the
                intent versions, the reference recordings, the briefs, the comments, and the roster — for
                everyone. This is reserved for the owner.
              </p>
              <button
                type="button"
                className={s.btnStrikeProd}
                data-armed={strikeArmed ? 'true' : 'false'}
                onClick={() => setStrikeArmed(true)}
              >
                Strike this production
              </button>
            </div>

            {strikeArmed && (
              <div className={s.strikeConfirm}>
                <h4>Strike <em>{props.project.title}</em>?</h4>
                <p>
                  This is the production being struck — set, costume, score and all. The following will be
                  destroyed at the end of the day. There is no recall.
                </p>

                <ul className={s.strikeList}>
                  <li>
                    <span className={s.glyph}>×</span>
                    <span className={s.label}>{cuesAcrossReelsLabel(props.strikeManifest.cues, props.reelCount)}</span>
                    <span className={s.num}>{props.strikeManifest.cues} {props.strikeManifest.cues === 1 ? 'entry' : 'entries'}</span>
                  </li>
                  <li>
                    <span className={s.glyph}>×</span>
                    <span className={s.label}>{props.strikeManifest.intent_versions} intent versions</span>
                    <span className={s.num}>all drafts</span>
                  </li>
                  <li>
                    <span className={s.glyph}>×</span>
                    <span className={s.label}>{props.strikeManifest.reference_recordings} reference recordings</span>
                    <span className={s.num}>mock cue audio</span>
                  </li>
                  <li>
                    <span className={s.glyph}>×</span>
                    <span className={s.label}>{props.strikeManifest.approved_briefs} composer briefs</span>
                    <span className={s.num}>public links revoked</span>
                  </li>
                  <li>
                    <span className={s.glyph}>×</span>
                    <span className={s.label}>{props.strikeManifest.comments} margin notes &amp; comments</span>
                    <span className={s.num}>all threads</span>
                  </li>
                  <li>
                    <span className={s.glyph}>×</span>
                    <span className={s.label}>
                      Roster — {numberWord(props.acceptedCount)} accepted, {numberWord(props.pendingCount)} pending
                    </span>
                    <span className={s.num}>{totalNames} {totalNames === 1 ? 'name' : 'names'}</span>
                  </li>
                </ul>

                <div className={s.strikeConfirmFoot}>
                  <label className={s.confirmPrompt}>
                    Type <em className={s.confirmTitleEm}>{titleCaps}</em> to confirm
                    <input
                      type="text"
                      className={s.confirmInput}
                      placeholder="title, in capitals"
                      autoComplete="off"
                      value={strikeText}
                      onChange={(e) => setStrikeText(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className={s.btnCancelStrike}
                    onClick={() => {
                      setStrikeArmed(false)
                      setStrikeText('')
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={s.btnConfirmStrike}
                    disabled={!strikeReady || striking}
                    onClick={() => void handleStrike()}
                  >
                    {striking ? 'Striking…' : 'Strike the production'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <footer className={s.formFoot}>
        <span>© Leitmotif · production {productionNo}</span>
        <span className={s.formFootC}>— a vocabulary bridge —</span>
        <span>Form 7B</span>
      </footer>
    </main>
  )
}

// ── Quiet selector (button-as-radio for keyboard reach) ─────────────────────

function QuietSelectField({
  label,
  id,
  value,
  onChange,
  options,
  disabled,
  aside,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled: boolean
  aside: string | null
}) {
  return (
    <div className={s.field}>
      <label className={s.fieldLabel} htmlFor={id}>{label}</label>
      <span
        className={s.quietSelect}
        role="radiogroup"
        aria-label={label}
        id={id}
      >
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`${s.opt} ${active ? s.isOn : ''}`}
              onClick={() => onChange(opt.value)}
              disabled={disabled}
            >
              {opt.label}
            </button>
          )
        })}
      </span>
      {aside ? <span className={s.fieldAside}>{aside}</span> : <span />}
    </div>
  )
}

// ── Display helpers ─────────────────────────────────────────────────────────

const MONTHS_SHORT = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December']

function formatLongDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
}

function formatShortJoinDate(iso: string): string {
  const d = new Date(iso)
  return `${pad2(d.getDate())} ${MONTHS_SHORT[d.getMonth()]}`
}

function formatRevisionDate(iso: string): string {
  const d = new Date(iso)
  return `${pad2(d.getDate())} ${MONTHS_SHORT[d.getMonth()]} · ${pad2(d.getHours())}.${pad2(d.getMinutes())}`
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function shortSlug(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

function ownerDisplayName(o: { name: string | null; email: string }): string {
  return o.name?.trim() || o.email || '—'
}

function runtimeHintLabel(raw: string, format: string): string | null {
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n <= 0) return null
  const h = Math.floor(n / 60)
  const m = n % 60
  const time = h > 0 ? `≈ ${h} h ${pad2(m)} m` : `≈ ${m} m`
  const tail =
    format === 'feature'     ? 'feature cut' :
    format === 'episodic'    ? 'episode cut' :
    format === 'short'       ? 'short cut' :
    format === 'commercial'  ? 'commercial cut' :
    format === 'documentary' ? 'doc cut' :
    'cut'
  return `${time} · ${tail}`
}

function cuesAcrossReelsLabel(cues: number, reels: number): string {
  const cueWord = cues === 1 ? 'cue' : 'cues'
  const reelWord = reels === 1 ? 'one reel' : `${numberWord(reels)} reels`
  return `${cues} ${cueWord} across ${reelWord}`
}

function numberWord(n: number): string {
  if (n < 0) return String(n)
  const small = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve']
  return n < small.length ? small[n] : String(n)
}

function capitalize(str: string): string {
  return str.length === 0 ? str : str[0].toUpperCase() + str.slice(1)
}

function roleLabelSentence(role: string): string {
  switch (role) {
    case 'director':         return 'Director'
    case 'composer':         return 'Composer'
    case 'music_supervisor': return 'Music supervisor'
    case 'sound_designer':   return 'Sound designer'
    case 'viewer':           return 'Viewer'
    default: return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
}
