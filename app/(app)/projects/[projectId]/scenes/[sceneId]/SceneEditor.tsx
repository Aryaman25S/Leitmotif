'use client'

/*
 * Cue editor — the workbench (v1 port of Leitmotif Cue Editor.html).
 *
 * One leaf for one cue: Slate · Picture · Brief · Result · Delivery. The
 * Brief saves to /api/intent (creating a new IntentVersion); generation runs
 * via /api/scenes/[sceneId]/generate; approval via /api/mock-cues/[id]/approve.
 *
 * Slate fields (cue_number, tc_in, tc_out, label) are read-only in this v1
 * port; restoring inline edit is a Phase 2.5 follow-up. The existing
 * SceneMetaEditor in components/scene/ stays intact for that re-mount.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ATMOSPHERE_DESCRIPTORS, FUNCTION_DESCRIPTORS, DENSITY_PHRASES, KEY_SIGNATURES } from '@/lib/prompts/taxonomy'
import { buildGenerationPrompt, buildMusicalSpec } from '@/lib/prompts/buildGenerationPrompt'
import type { IntentVersion, MockCue, GenerationSettings } from '@/lib/store'
import type { AutofillField, AutofillResult } from '@/lib/ai/autofillFromScreenplay'
import s from './editor.module.css'

// ── Constants — design vocabulary ────────────────────────────────────────────

const ENERGY_TIERS: { key: 'high' | 'mid' | 'low'; label: string; keys: string[] }[] = [
  {
    key: 'high', label: 'High energy',
    keys: ['joy_elation', 'urgency_propulsion', 'confidence_swagger', 'tension_anxiety', 'triumph'],
  },
  {
    key: 'mid', label: 'Mid energy',
    keys: ['doubt_ambiguity', 'menace', 'irony_dissonance'],
  },
  {
    key: 'low', label: 'Low energy',
    keys: ['calm_peace', 'wonder_awe', 'intimacy_tenderness', 'nostalgia_longing', 'grief_sorrow', 'dread_ominous'],
  },
]

const FUNCTION_KEYS = [
  'anchor_emotion', 'reveal_subtext', 'drive_pace', 'misdirect', 'relieve_tension',
  'mark_the_cost', 'create_intimacy', 'signal_transition', 'withhold', 'comment_observe',
] as const

const DENSITY_BARS: { key: string; label: string; bars: number[] }[] = [
  { key: 'silence',   label: 'Silence',   bars: [1] },
  { key: 'sparse',    label: 'Sparse',    bars: [3, 1] },
  { key: 'textural',  label: 'Textural',  bars: [5, 3, 4] },
  { key: 'melodic',   label: 'Melodic',   bars: [6, 8, 5, 7] },
  { key: 'layered',   label: 'Layered',   bars: [10, 7, 12, 8, 11] },
  { key: 'saturated', label: 'Saturated', bars: [14, 11, 16, 12, 15, 13] },
]

const FORMAT_OPTIONS = ['Solo', 'Duet', 'Band', 'Orchestra', 'Chorus'] as const

// "Where the music sits in the picture" — three sub-rows. Each option's
// `value` is what we store in the schema; the existing prompt vocabulary is
// honoured, so closest-fit mapping is used where the design's labels don't
// match an existing key. See lib/prompts/* for the canonical key sets.

interface WhereOption { value: string; label: string; gloss: string }

// 5 stops on the score / sound-design spectrum a director actually walks at
// the dub stage. Four of these map to existing prompt keys; "Score only"
// stores a new string `score_only` that the prompt vocabulary hasn't covered
// yet — the prompt's skip-on-unknown handles it gracefully (one stop produces
// a slightly weaker prompt; the brief still reads correctly). A future
// migration can add a dedicated phrase for `score_only`.
const BALANCE_STOPS: WhereOption[] = [
  { value: 'score_only',        label: 'Score only',     gloss: 'music carries the moment alone' },
  { value: 'score_forward',     label: 'Score forward',  gloss: 'music leads — sound design supports' },
  { value: 'equal_negotiated',  label: 'Balanced',       gloss: 'music and sound share the air' },
  { value: 'sound_forward',     label: 'Sound forward',  gloss: 'sound design leads — music underneath' },
  { value: 'no_music',          label: 'Sound only',     gloss: 'sound design carries; no score in this scene' },
]

const DIEGETIC_STOPS: WhereOption[] = [
  { value: 'diegetic',     label: 'Diegetic',          gloss: 'in the world of the picture — radio, band on screen, hummed phrase' },
  // "source-into-score" maps to the existing prompt key `ambiguous` (the
  // closest match in current prompt vocab — "blurred line between source and
  // score"). Future direct mapping can introduce a `source_into_score` key.
  { value: 'ambiguous',    label: 'Source-into-score', gloss: 'begins inside the world; bleeds out into score as the scene turns' },
  { value: 'non_diegetic', label: 'Non-diegetic',      gloss: 'scoring from outside the picture — only the audience hears it' },
]

// Recurrence is stored as a phrase in `frequency_note` (a free-text field
// the prompt and brief both render verbatim). The phrases below read well in
// both contexts ("Margin note — one-off cue, only this scene"). On reload the
// phrase is matched back to the chosen stop by exact-equality.
const RECURRENCE_STOPS: WhereOption[] = [
  { value: 'one-off cue, only this scene',          label: 'One-off',         gloss: 'lives only here; nothing to extend' },
  { value: 'recurring motif across the picture',    label: 'Recurring motif', gloss: 'part of a thread that comes back across the picture' },
  { value: 'return of an earlier theme',            label: 'Theme return',    gloss: 'calls back something already established' },
]

// ── Types ────────────────────────────────────────────────────────────────────

export type EditorState =
  | 'spotting'        // no intent saved yet
  | 'composing'       // intent saved (with or without mock cue draft)
  | 'generating'      // job in flight
  | 'approved'        // mock cue approved

export interface MockCueWithProvider extends MockCue {
  model_provider?: string | null
}

interface SceneEditorProps {
  sceneId: string
  projectId: string
  projectTitle: string
  reelLabel: string                   // "Reel 2"
  reelSubtitle: string | null         // "The first map" — or null
  cuePosition: number                 // 7
  totalCues: number                   // 18
  cueNumber: string | null            // "1M4"
  sceneLabel: string
  tcIn: string | null
  tcOut: string | null
  durationStr: string | null          // "2:50"
  videoUrl: string | null
  videoDurationSec: number | null
  initialIntent: IntentVersion | null
  initialScreenplay: string | null
  initialMockCues: MockCueWithProvider[]
  initialJobStatus: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | null
  initialJobStartedAt: string | null
  genSettings: GenerationSettings | null
  toneBrief: string | null
  defaultModelProvider: string
  canDirect: boolean
  canApprove: boolean
  recipients: string                  // "Ana Reyes (composer) & Lin Park (music supervisor)" — pre-formatted
  appUrl: string                      // origin for /brief/<id>
  intentVersionsCount: number         // for "intent v18"
}

// ── Top-level ────────────────────────────────────────────────────────────────

export default function SceneEditor(props: SceneEditorProps) {
  const router = useRouter()
  const { sceneId, canDirect, canApprove } = props

  const [intent, setIntent] = useState<IntentVersion | null>(props.initialIntent)
  const [mockCues, setMockCues] = useState<MockCueWithProvider[]>(props.initialMockCues)
  const [jobStatus, setJobStatus] = useState(props.initialJobStatus)
  const [jobStartedAt] = useState(props.initialJobStartedAt)

  // Brief draft state — initialised from latest intent, edited locally.
  const [atms, setAtms] = useState<string[]>(intent?.emotional_atmospheres ?? [])
  const [fn, setFn] = useState<string>(intent?.narrative_function ?? '')
  const [balance, setBalance] = useState<string>(intent?.handoff_setting ?? '')
  const [diegetic, setDiegetic] = useState<string>(intent?.diegetic_status ?? '')
  const [recurrence, setRecurrence] = useState<string>(intent?.frequency_note ?? '')
  const [dens, setDens] = useState<string>(intent?.density ?? '')
  const [words, setWords] = useState<string>(intent?.director_words ?? '')
  const [wrong, setWrong] = useState<string>(intent?.what_would_be_wrong ?? '')
  const [formatTag, setFormatTag] = useState<string>(intent?.format_tag ?? 'Band')
  const [bpm, setBpm] = useState<number | null>(intent?.target_bpm ?? null)
  const [keySig, setKeySig] = useState<string>(intent?.key_signature ?? '')
  const [instruments, setInstruments] = useState<string>(intent?.featured_instruments ?? '')

  // Screenplay text + autofill state. Lives on SceneCard (one screenplay per
  // scene, informs many intent versions). `savedScreenplay` is the persisted
  // baseline for dirty-detection so editing the textarea alone enables Save.
  const [screenplay, setScreenplay] = useState<string>(props.initialScreenplay ?? '')
  const [savedScreenplay, setSavedScreenplay] = useState<string>(props.initialScreenplay ?? '')
  const [autofilling, setAutofilling] = useState(false)
  const [modePickerOpen, setModePickerOpen] = useState(false)
  // Field keys flagged low-confidence by the most recent autofill — shown as
  // a single banner above ComposeBar. Cleared on save.
  const [lowConfidence, setLowConfidence] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [unapproving, setUnapproving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Pristine baseline used to detect "dirty" — recomputed when intent reloads.
  const baseline = useMemo(() => snapshotIntent(intent), [intent])
  const draft = useMemo(
    () => ({ atms, fn, balance, diegetic, recurrence, dens, words, wrong, formatTag, bpm, keySig, instruments }),
    [atms, fn, balance, diegetic, recurrence, dens, words, wrong, formatTag, bpm, keySig, instruments],
  )
  const dirty = useMemo(
    () => !sameSnapshot(baseline, draft) || screenplay !== savedScreenplay,
    [baseline, draft, screenplay, savedScreenplay],
  )

  // Derived state.
  const approvedCue = mockCues.find((c) => c.is_approved) ?? null
  const sortedCues = [...mockCues].sort((a, b) => b.version_number - a.version_number)
  const latestUnapproved = sortedCues.find((c) => !c.is_approved) ?? null
  const isGenerating = jobStatus === 'queued' || jobStatus === 'processing' || generating

  const editorState: EditorState =
    isGenerating ? 'generating' :
    approvedCue ? 'approved' :
    intent ? 'composing' :
    'spotting'

  // Suggested BPM from selected atmospheres (averaged).
  const suggestedBpm = useMemo(() => {
    const ranges = atms
      .map((k) => ATMOSPHERE_DESCRIPTORS[k]?.bpmRange)
      .filter((r): r is [number, number] => Array.isArray(r))
    if (ranges.length === 0) return null
    const low  = Math.round(ranges.reduce((s, r) => s + r[0], 0) / ranges.length)
    const high = Math.round(ranges.reduce((s, r) => s + r[1], 0) / ranges.length)
    return Math.round((low + high) / 2)
  }, [atms])

  const effectiveBpm = bpm ?? suggestedBpm
  const bpmIsAuto = bpm == null

  // Compiled spec dossier — driven by current draft.
  const intentInput = useMemo(() => ({
    emotionalAtmospheres: atms,
    narrativeFunction: fn || null,
    density: dens || null,
    whatWouldBeWrong: wrong.trim() || null,
    handoffSetting: balance || null,
    frequencyNote: recurrence.trim() || null,
    directorWords: words.trim() || null,
    diegeticStatus: diegetic || null,
    targetBpm: bpm,
    keySignature: keySig || null,
    featuredInstruments: instruments.trim() || null,
    recordingQuality: intent?.recording_quality ?? null,
    workingTitle: intent?.working_title ?? null,
    formatTag: formatTag || 'Band',
  }), [atms, fn, balance, diegetic, recurrence, dens, wrong, words, intent, bpm, keySig, instruments, formatTag])

  const musicalSpec = useMemo(() => buildMusicalSpec(intentInput), [intentInput])
  const promptPreview = useMemo(() => buildGenerationPrompt(intentInput, {
    instrumentationFamilies: props.genSettings?.instrumentation_families ?? [],
    eraReference: props.genSettings?.era_reference ?? null,
    doNotGenerate: props.genSettings?.do_not_generate ?? null,
    budgetReality: props.genSettings?.budget_reality ?? null,
    toneBrief: props.toneBrief,
  }), [intentInput, props.genSettings, props.toneBrief])

  // Spec lines as ordered key/val pairs, in the design's order.
  const specLines = useMemo<[string, string | string[]][]>(() => {
    if (atms.length === 0) {
      return [
        ['Tempo', '—'], ['Harmonic', '—'], ['Register', '—'],
        ['Dynamics', '—'], ['Rhythm', '—'], ['Do not use', ['awaiting brief']],
      ]
    }
    const out: [string, string | string[]][] = [
      ['Tempo',     stringOrDash(musicalSpec['Tempo'])],
      ['Harmonic',  stringOrDash(musicalSpec['Harmonic character'])],
      ['Register',  stringOrDash(musicalSpec['Register'])],
      ['Dynamics',  stringOrDash(musicalSpec['Dynamics'])],
      ['Rhythm',    stringOrDash(musicalSpec['Rhythm'])],
    ]
    const dnu = musicalSpec['Do not use']
    out.push(['Do not use', Array.isArray(dnu) && dnu.length > 0 ? dnu : ['—']])
    return out
  }, [atms.length, musicalSpec])

  const [specOpen, setSpecOpen] = useState(true)

  // ── Polling while generating ──────────────────────────────────────────────
  useEffect(() => {
    if (!isGenerating) return
    let stopped = false
    const poll = async () => {
      try {
        const res = await fetch(`/api/scenes/${sceneId}/status`)
        if (!res.ok) return
        const data = await res.json()
        if (stopped) return
        setJobStatus(data.jobStatus ?? null)
        if (Array.isArray(data.mockCues)) setMockCues(data.mockCues)
        if (data.jobStatus === 'completed') {
          setGenerating(false)
          toast.success('Mock cue ready.')
          router.refresh()
        } else if (data.jobStatus === 'failed') {
          setGenerating(false)
          toast.error('Generation failed.')
          router.refresh()
        }
      } catch {
        // Network blip — try again on the next tick.
      }
    }
    const id = setInterval(poll, 2500)
    return () => { stopped = true; clearInterval(id) }
  }, [isGenerating, sceneId, router])

  // ── Mutations ─────────────────────────────────────────────────────────────

  function toggleAtm(k: string) {
    setAtms((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k)
      : prev.length >= 3 ? prev
      : [...prev, k],
    )
  }

  const briefIsEmpty =
    atms.length === 0 && !fn && !balance && !diegetic && !recurrence.trim() &&
    !dens && !words.trim() && !wrong.trim() && bpm == null && !keySig &&
    !instruments.trim()

  async function handleAutofill(mode: 'overwrite' | 'fill_empty') {
    const trimmed = screenplay.trim()
    if (!trimmed) {
      toast.error('Paste a screenplay first.')
      return
    }
    setAutofilling(true)
    try {
      const res = await fetch(`/api/scenes/${sceneId}/autofill-from-screenplay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenplay: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Autofill failed.')
        return
      }
      const result = data.result as AutofillResult
      const lows: string[] = []

      // Apply each field. In 'fill_empty' mode we only write when the current
      // value is empty; in 'overwrite' mode we always write a non-null AI value
      // (a null AI value never blanks a director's existing input).
      const apply = <T,>(
        key: string,
        currentEmpty: boolean,
        field: AutofillField<T | null>,
        setter: (v: T) => void,
      ) => {
        if (field.value === null || field.value === undefined) return
        if (mode === 'fill_empty' && !currentEmpty) return
        setter(field.value as T)
        if (field.confidence === 'low') lows.push(key)
      }

      apply('atmospheres', atms.length === 0,
        result.emotional_atmospheres as AutofillField<string[] | null>,
        (v) => setAtms(v as string[]))
      apply('narrative function', !fn, result.narrative_function, setFn)
      apply('density',             !dens, result.density, setDens)
      apply('source',              !diegetic, result.diegetic_status, setDiegetic)
      apply('balance',             !balance, result.handoff_setting, setBalance)
      apply('BPM',                 bpm == null, result.target_bpm, setBpm)
      apply('key',                 !keySig, result.key_signature, setKeySig)
      apply('format',              formatTag === 'Band' || !formatTag, result.format_tag, setFormatTag)
      apply('instruments',         !instruments.trim(), result.featured_instruments, setInstruments)
      apply("director's words",    !words.trim(), result.director_words, setWords)
      apply('what would be wrong', !wrong.trim(), result.what_would_be_wrong, setWrong)
      // recording_quality and working_title are returned by the model but the
      // editor doesn't surface them today — skip until they have UI.

      setLowConfidence(lows)
      toast.success(
        mode === 'overwrite'
          ? 'Brief filled from screenplay.'
          : 'Empty fields filled from screenplay.',
      )
    } catch {
      toast.error('Autofill failed.')
    } finally {
      setAutofilling(false)
    }
  }

  async function handleSave(): Promise<IntentVersion | null> {
    if (!atms.length) {
      toast.error('Choose at least one atmosphere before saving.')
      return null
    }
    setSaving(true)
    try {
      // Persist screenplay alongside the intent. Non-blocking on failure —
      // the intent save is the user-visible action; a screenplay save error
      // surfaces as a separate console warning, not a blocking toast.
      if (screenplay !== savedScreenplay) {
        fetch(`/api/scenes/${sceneId}/meta`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ screenplay_text: screenplay }),
        }).then((r) => {
          if (r.ok) setSavedScreenplay(screenplay)
          else console.warn('[scene-editor] failed to persist screenplay_text')
        }).catch((e) => console.warn('[scene-editor] screenplay save error', e))
      }

      const res = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene_card_id: sceneId,
          emotional_atmospheres: atms,
          narrative_function: fn || null,
          density: dens || null,
          director_words: words.trim() || null,
          what_would_be_wrong: wrong.trim() || null,
          handoff_setting: balance || null,
          diegetic_status: diegetic || null,
          frequency_note: recurrence.trim() || null,
          target_bpm: bpm,
          key_signature: keySig || null,
          featured_instruments: instruments.trim() || null,
          recording_quality: intent?.recording_quality ?? null,
          working_title: intent?.working_title ?? null,
          format_tag: formatTag || 'Band',
          positive_prompt: promptPreview.positivePrompt,
          negative_prompt: promptPreview.negativePrompt,
          spec_tempo_range: String(musicalSpec['Tempo'] ?? ''),
          spec_harmonic_character: String(musicalSpec['Harmonic character'] ?? ''),
          spec_register: String(musicalSpec['Register'] ?? ''),
          spec_dynamics: String(musicalSpec['Dynamics'] ?? ''),
          spec_rhythm: String(musicalSpec['Rhythm'] ?? ''),
          spec_do_not_use: musicalSpec['Do not use'] as string[] ?? [],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to save.')
        return null
      }
      const iv = data.intentVersion as IntentVersion
      setIntent(iv)
      setLowConfidence([])
      toast.success('Brief saved.')
      router.refresh()
      return iv
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerate() {
    let iv: IntentVersion | null = intent
    if (!iv || dirty) {
      iv = await handleSave()
      if (!iv) return
    }
    setGenerating(true)
    setJobStatus('queued')
    const res = await fetch(`/api/scenes/${sceneId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intentVersionId: iv.id, modelProvider: props.defaultModelProvider }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data.error ?? 'Could not start generation.')
      setGenerating(false)
      setJobStatus(null)
    }
  }

  async function handleApprove() {
    if (!latestUnapproved) return
    setApproving(true)
    try {
      const res = await fetch(`/api/mock-cues/${latestUnapproved.id}/approve`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Approval failed.')
        return
      }
      setMockCues((prev) =>
        prev.map((c) =>
          c.id === latestUnapproved.id
            ? { ...c, is_approved: true, approved_at: new Date().toISOString() }
            : { ...c, is_approved: false },
        ),
      )
      toast.success(
        data.briefEmailSent
          ? 'Approved — brief link emailed to collaborators.'
          : 'Approved — share the brief link with your composer.',
      )
      router.refresh()
    } finally {
      setApproving(false)
    }
  }

  async function handleUnapprove() {
    if (!approvedCue) return
    setUnapproving(true)
    try {
      const res = await fetch(`/api/mock-cues/${approvedCue.id}/unapprove`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Could not withdraw approval.')
        return
      }
      setMockCues((prev) =>
        prev.map((c) =>
          c.id === approvedCue.id
            ? { ...c, is_approved: false, approved_at: null, approved_by: null }
            : c,
        ),
      )
      toast.success('Approval withdrawn.')
      router.refresh()
    } finally {
      setUnapproving(false)
    }
  }

  // Delete an unapproved cue. The DELETE route 409s if approved — we
  // bail early in that case so the user gets a clear error instead of a
  // raw API response. Optimistic removal: drop the cue from local state
  // immediately, then confirm with router.refresh.
  async function handleDelete(cueId: string) {
    const target = mockCues.find((c) => c.id === cueId)
    if (!target) return
    if (target.is_approved) {
      toast.error('Withdraw approval before deleting this cue.')
      return
    }
    setDeletingId(cueId)
    try {
      const res = await fetch(`/api/mock-cues/${cueId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Could not delete cue.')
        return
      }
      setMockCues((prev) => prev.filter((c) => c.id !== cueId))
      toast.success(`v${target.version_number} deleted.`)
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const status = stateMeta(editorState)
  const cueIdentifier = props.cueNumber ?? '—'
  const cuePositionStr = String(props.cuePosition).padStart(2, '0')
  const cueTotalStr = String(props.totalCues).padStart(2, '0')
  const lastSavedTime = intent?.created_at ? clockTime(intent.created_at) : null
  const intentVersionLabel = props.intentVersionsCount > 0 ? `v${props.intentVersionsCount}` : '—'
  const latestMockVersion = sortedCues[0]?.version_number ?? null

  return (
    <>
      {/* Slate — title primary, cue identifier becomes quiet metadata. ──── */}
      <header className={s.slate}>
        <nav className={s.slateCrumbs}>
          <Link className={s.crumbBack} href={`/projects/${props.projectId}`}>
            ← <span>{props.projectTitle}</span>
          </Link>
          <span>·</span>
          <span>
            {props.reelLabel}{props.reelSubtitle ? ` · ${props.reelSubtitle}` : ''}
          </span>
        </nav>
        <div className={s.slatePrimary}>
          <div className={s.slateMeta}>
            <span className={s.slateMetaCue}>Cue {cueIdentifier}</span>
            <span className={s.slateMetaSep}>·</span>
            <span className={s.slateMetaPos}>{cuePositionStr} of {cueTotalStr}</span>
          </div>
          <h1 className={s.slateTitle}>{props.sceneLabel}</h1>
          {/* TODO(Phase 2.5): restore inline edit for cue_number / tc_in / tc_out / label.
              SceneMetaEditor (components/scene/SceneMetaEditor.tsx) is the existing
              editor and remains intact for that re-mount. */}
        </div>
        <div className={s.slateR}>
          <span className={s.tc}>
            <em>{props.tcIn ?? '—'}</em>
            <span className={s.tcArrow}>→</span>
            <em>{props.tcOut ?? '—'}</em>
            {props.durationStr && <span className={s.tcDur}>· {props.durationStr}</span>}
          </span>
          <span className={`${s.slateStatus} ${status.toneClass}`}>
            <span className={s.statusMark}>{status.mark}</span>
            <span>{status.label}</span>
          </span>
        </div>
      </header>

      {/* Body ────────────────────────────────────────────────────────────── */}
      <div className={s.body}>
        <div className={s.colLeft}>
          <PicturePlate
            cueNumber={cueIdentifier}
            sceneLabel={props.sceneLabel}
            tcIn={props.tcIn}
            durationStr={props.durationStr}
            videoUrl={props.videoUrl}
            videoDurationSec={props.videoDurationSec}
            sceneId={sceneId}
            canDirect={canDirect}
            onUploaded={() => router.refresh()}
          />

          {(canDirect || screenplay.trim().length > 0) && (
            <section className={s.block}>
              <div className={s.blockHead}>
                <h2 className={s.blockTitle}>Screenplay</h2>
                <span className={s.blockAside}>
                  the page the brief flows from — <em>autofill if you&rsquo;d rather not start blank</em>
                </span>
              </div>
              <textarea
                className={s.screenplayTextarea}
                value={screenplay}
                onChange={(e) => setScreenplay(e.target.value)}
                placeholder={canDirect ? 'Paste the screenplay for this scene…' : ''}
                disabled={!canDirect}
                rows={8}
              />
              {canDirect && (
                <div className={s.screenplayFoot}>
                  {!autofilling && !modePickerOpen && (
                    <button
                      type="button"
                      className={`${s.autofillBtn} ${s.autofillBtn}`}
                      onClick={() => {
                        if (briefIsEmpty) handleAutofill('overwrite')
                        else setModePickerOpen(true)
                      }}
                      disabled={!screenplay.trim()}
                    >
                      Autofill from screenplay
                    </button>
                  )}
                  {modePickerOpen && !autofilling && (
                    <div className={s.modeChoice}>
                      <span className={s.modeChoiceLabel}>Brief already has values —</span>
                      <button
                        type="button"
                        className={`${s.modeBtn} ${s.modeBtn}`}
                        onClick={() => { setModePickerOpen(false); handleAutofill('overwrite') }}
                      >
                        Replace all
                      </button>
                      <button
                        type="button"
                        className={`${s.modeBtn} ${s.modeBtn}`}
                        onClick={() => { setModePickerOpen(false); handleAutofill('fill_empty') }}
                      >
                        Fill blanks only
                      </button>
                      <button
                        type="button"
                        className={`${s.modeBtn} ${s.modeBtn}`}
                        onClick={() => setModePickerOpen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {autofilling && (
                    <span className={s.autofillStatus}>Reading the page…</span>
                  )}
                </div>
              )}
            </section>
          )}

          <section className={s.block}>
            <div className={s.blockHead}>
              <span className={s.blockNum}>I.</span>
              <h2 className={s.blockTitle}>The brief</h2>
              <span className={s.blockAside}>
                what the music is, and what it must not be — <em>your spotting notes</em>
              </span>
            </div>

            <AtmospheresField selected={atms} onToggle={toggleAtm} readOnly={!canDirect} />
            <FunctionField selected={fn} onSelect={canDirect ? setFn : noop} readOnly={!canDirect} />
            <WhereField
              balance={balance} onBalance={canDirect ? setBalance : noop}
              diegetic={diegetic} onDiegetic={canDirect ? setDiegetic : noop}
              recurrence={recurrence} onRecurrence={canDirect ? setRecurrence : noop}
              readOnly={!canDirect}
            />
            <DensityField selected={dens} onSelect={canDirect ? setDens : noop} readOnly={!canDirect} />
            <VoiceField
              words={words} wrong={wrong}
              onWords={canDirect ? setWords : noop}
              onWrong={canDirect ? setWrong : noop}
              readOnly={!canDirect}
            />
            <SpecsField
              format={formatTag} onFormat={canDirect ? setFormatTag : noop}
              bpm={effectiveBpm} bpmIsAuto={bpmIsAuto}
              onBpm={canDirect ? setBpm : noop}
              keySig={keySig} onKey={canDirect ? setKeySig : noop}
              instruments={instruments} onInstruments={canDirect ? setInstruments : noop}
              readOnly={!canDirect}
            />

            <SpecDossier open={specOpen} onToggle={() => setSpecOpen((v) => !v)} spec={specLines} />

            {canDirect && lowConfidence.length > 0 && (
              <div className={s.lowConfBanner}>
                <span className={s.lowConfBannerLabel}>AI was uncertain about</span>
                <span className={s.lowConfBannerList}>{lowConfidence.join(' · ')}</span>
                <span className={s.lowConfBannerNote}>review before saving</span>
              </div>
            )}

            {canDirect && (
              <ComposeBar
                dirty={dirty}
                lastSavedTime={lastSavedTime}
                intentVersionLabel={intentVersionLabel}
                onSave={handleSave}
                onGenerate={handleGenerate}
                canGenerate={atms.length > 0 && !isGenerating}
                saving={saving}
                generating={isGenerating}
              />
            )}
          </section>
        </div>

        <aside className={s.colRight}>
          <ResultPanel
            state={editorState}
            latest={latestUnapproved ?? approvedCue ?? null}
            approvedCue={approvedCue}
            sceneTitle={props.sceneLabel}
            jobStartedAt={jobStartedAt}
            hasAtmospheres={atms.length > 0}
            onApprove={handleApprove}
            onUnapprove={handleUnapprove}
            onRegenerate={handleGenerate}
            onGenerate={handleGenerate}
            onDelete={handleDelete}
            approving={approving}
            unapproving={unapproving}
            deletingId={deletingId}
            canApprove={canApprove}
            canDirect={canDirect}
            recipients={props.recipients}
            appUrl={props.appUrl}
            previousVersions={sortedCues.filter((c) => c.id !== (latestUnapproved?.id ?? approvedCue?.id))}
            modelProvider={props.defaultModelProvider}
          />
        </aside>
      </div>

      {/* Delivery footer ─────────────────────────────────────────────────── */}
      <footer className={s.delivery}>
        <span className={s.deliveryL}>
          {editorState === 'approved' && approvedCue
            ? <>The brief is out — <em>brief {approvedCue.id.slice(0, 4)}-{approvedCue.id.slice(4, 8)}-{approvedCue.id.slice(8, 12)}</em> · awaiting acknowledgement.</>
            : editorState === 'generating'
            ? <>Quiet on set — <em>the cue is being drawn</em>.</>
            : <>One leaf of a binder of <em>{props.totalCues} cues</em>. Save when you&rsquo;re done; nothing leaves this page until you approve.</>}
        </span>
        <span className={s.deliveryC}>— a vocabulary bridge —</span>
        <span className={s.deliveryR}>
          intent <em>{intentVersionLabel}</em>
          {latestMockVersion != null && <> · mock cue <em>v{latestMockVersion}</em></>}
          {lastSavedTime && <> · saved {lastSavedTime}</>}
        </span>
      </footer>
    </>
  )
}

function stateMeta(state: EditorState): { label: string; mark: string; toneClass: string } {
  switch (state) {
    case 'spotting':
      return { label: 'Just spotted · empty brief', mark: '·', toneClass: s.statusQuiet }
    case 'composing':
      return { label: 'Composing brief',            mark: '—', toneClass: s.statusQuiet }
    case 'generating':
      return { label: 'Mock generating',            mark: '◐', toneClass: s.statusWarm }
    case 'approved':
      return { label: 'Delivered to composer',     mark: '✓', toneClass: s.statusDone }
  }
}

// ── Picture plate ────────────────────────────────────────────────────────────

function PicturePlate({
  cueNumber, sceneLabel, tcIn, durationStr,
  videoUrl, videoDurationSec, sceneId, canDirect, onUploaded,
}: {
  cueNumber: string
  sceneLabel: string
  tcIn: string | null
  durationStr: string | null
  videoUrl: string | null
  videoDurationSec: number | null
  sceneId: string
  canDirect: boolean
  onUploaded: () => void
}) {
  const hasClip = !!videoUrl
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentSec, setCurrentSec] = useState(0)
  const [duration, setDuration] = useState(videoDurationSec ?? 0)

  const pct = duration > 0 ? (currentSec / duration) * 100 : 0

  function toggle() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }

  function handleScrubClick(e: React.MouseEvent<HTMLDivElement>) {
    const v = videoRef.current
    if (!v || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    v.currentTime = ratio * duration
  }

  return (
    <section className={s.block}>
      <div className={s.blockHead}>
        <span className={s.blockNum}>i.</span>
        <h2 className={s.blockTitle}>The picture</h2>
        <span className={s.blockAside}>
          a reference for thinking — <em>not the work</em>
        </span>
      </div>

      <div className={`${s.picture} ${hasClip ? '' : s.pictureEmpty}`}>
        <div className={s.pictureStrip}>
          <div className={s.picturePerfs} />
          <div className={s.pictureFrame}>
            {hasClip ? (
              <>
                <video
                  ref={videoRef}
                  className={s.pictureVideo}
                  src={videoUrl!}
                  preload="metadata"
                  playsInline
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onLoadedMetadata={() => {
                    const v = videoRef.current
                    if (v && Number.isFinite(v.duration)) setDuration(v.duration)
                  }}
                  onTimeUpdate={() => {
                    const v = videoRef.current
                    if (v && Number.isFinite(v.currentTime)) setCurrentSec(v.currentTime)
                  }}
                  onEnded={() => setPlaying(false)}
                />
                <div className={s.pictureMeta}>
                  <span><span className={s.pictureMetaCue}>{cueNumber}</span> · {sceneLabel}</span>
                  <span className={s.pictureMetaR}>
                    {tcIn ?? '—'}<br />{durationStr ? `${durationStr} clip` : ''}
                  </span>
                </div>
              </>
            ) : (
              <PictureEmpty
                sceneId={sceneId}
                canDirect={canDirect}
                onUploaded={onUploaded}
              />
            )}
          </div>
          <div className={s.picturePerfs} />
        </div>

        {hasClip && (
          <div className={s.pictureRail}>
            <div className={s.scrub} onClick={handleScrubClick} role="slider"
                 aria-valuemin={0} aria-valuemax={duration || 0} aria-valuenow={currentSec}>
              <div className={s.scrubFill} style={{ width: `${pct}%` }} />
              <div className={`${s.scrubMark} ${s.scrubMarkHere}`} style={{ left: `${pct}%` }}>
                <span className={s.scrubTick}>{formatHMS(currentSec)}</span>
              </div>
            </div>
            <div className={s.pictureRailC}>
              <button
                type="button"
                className={s.plBtn}
                onClick={toggle}
                title={playing ? 'Pause' : 'Play'}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <PauseGlyph /> : <PlayGlyph />}
              </button>
              <span className={s.plNow}>
                {formatHMS(currentSec)} <em>· {Math.round(pct)}%</em>
              </span>
            </div>
          </div>
        )}

        {hasClip && (
          <div className={s.pictureFoot}>
            <span><span className={s.voiceStrokeInline} />Watch it loop while you write — keep it in the corner of your eye.</span>
            <span className={s.pictureFootR}>
              {/* TODO(Phase 2.5): wire to /api/scenes/[sceneId]/video DELETE / replace flow,
                  and to a frame-grab endpoint for Strip frame. */}
              <a href="#">Replace clip</a>
              {' · '}
              <a href="#">Strip frame</a>
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

function PictureEmpty({
  sceneId, canDirect, onUploaded,
}: {
  sceneId: string
  canDirect: boolean
  onUploaded: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/scenes/${sceneId}/video`, { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Upload failed.')
        return
      }
      toast.success('Clip attached.')
      onUploaded()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className={s.pictureEmptyPrompt}
      onClick={() => canDirect && inputRef.current?.click()}
      role={canDirect ? 'button' : undefined}
      style={{ cursor: canDirect ? 'pointer' : 'default' }}
    >
      <em>{uploading ? 'uploading…' : 'Drop a clip · MP4 / MOV'}</em>
      <strong>No reference clip yet.</strong>
      <span>The score works without it. A clip simply gives you something to look at while you write.</span>
      {canDirect && (
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/*"
          className={s.pictureEmptyInput}
          onChange={handleFile}
        />
      )}
    </div>
  )
}

// ── Brief fields ─────────────────────────────────────────────────────────────

// Atmospheres: 14 moods organized in three energy tiers; user picks up to
// three, all equal — no primary/supporting hierarchy. Each label in the
// taxonomy is slash-joined synonyms (e.g. "Wonder / Awe / Vastness"); we
// display only the head word. Hover and selected states reveal the rest
// inline as a soft fade-in, so the chip animates wider when committed.
// Selection is marked with a hand-pulled ember marker — a translucent
// ember rectangle skewed slightly off-axis, like a director striking
// through synonyms on a printed sheet.
function AtmospheresField({
  selected, onToggle, readOnly,
}: {
  selected: string[]
  onToggle: (k: string) => void
  readOnly: boolean
}) {
  return (
    <div className={s.field}>
      <div className={s.fieldHead}>
        <span className={s.fieldNo}>i.</span>
        <span className={s.fieldLabel}>Emotional atmosphere of this cue</span>
        <span className={s.fieldRule} />
        <span className={s.fieldHint}>up to three · {selected.length}/3</span>
      </div>

      {ENERGY_TIERS.map((tier) => (
        <div key={tier.key} className={s.tier}>
          <div className={s.tierCap}>{tier.label}</div>
          <div className={s.atms}>
            {tier.keys.map((k) => {
              const desc = ATMOSPHERE_DESCRIPTORS[k]
              if (!desc) return null
              const on = selected.includes(k)
              const { primary, rest } = condenseAtmLabel(desc.label)
              return (
                <button
                  key={k}
                  type="button"
                  className={`${s.atm} ${on ? s.atmOn : ''}`}
                  onClick={() => onToggle(k)}
                  disabled={readOnly || (!on && selected.length >= 3)}
                  title={desc.description}
                >
                  <span className={s.atmWord}>{primary}</span>
                  {rest.length > 0 && (
                    <span className={s.atmAlt} aria-hidden="true">
                      {rest.map((w, i) => (
                        <span key={i}>
                          <span className={s.atmAltSep}> / </span>{w}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// Split a slash-joined label into head + rest. The head word is the displayed
// chip text; the rest shows on hover/selected as a fade-in. Trims and skips
// empty fragments so `Calm / Peace / Resolution` → { primary: "Calm",
// rest: ["Peace", "Resolution"] }. Trailing parenthetical qualifiers like
// "Confidence / Swagger (adult drama)" stay attached to whichever word
// they trail (here: "Swagger (adult drama)") rather than splitting on `(`.
function condenseAtmLabel(full: string): { primary: string; rest: string[] } {
  const parts = full.split('/').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return { primary: full, rest: [] }
  return { primary: parts[0], rest: parts.slice(1) }
}

function FunctionField({
  selected, onSelect, readOnly,
}: {
  selected: string
  onSelect: (k: string) => void
  readOnly: boolean
}) {
  return (
    <div className={s.field}>
      <div className={s.fieldHead}>
        <span className={s.fieldNo}>ii.</span>
        <span className={s.fieldLabel}>What is the music doing here?</span>
        <span className={s.fieldRule} />
        <span className={s.fieldHint}>narrative function · one of ten</span>
      </div>
      <div className={s.fns}>
        {FUNCTION_KEYS.map((k) => {
          const fn = FUNCTION_DESCRIPTORS[k]
          if (!fn) return null
          const on = selected === k
          return (
            <button
              key={k}
              type="button"
              className={`${s.fn} ${on ? s.fnOn : ''}`}
              onClick={() => onSelect(on ? '' : k)}
              disabled={readOnly}
            >
              <span className={s.fnMark}>{on ? '●' : '○'}</span>
              <span className={s.fnBody}>
                <span className={s.fnLabel}>{fn.label}</span>
                <span className={s.fnDesc}>{fn.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WhereField({
  balance, onBalance,
  diegetic, onDiegetic,
  recurrence, onRecurrence,
  readOnly,
}: {
  balance: string
  onBalance: (v: string) => void
  diegetic: string
  onDiegetic: (v: string) => void
  recurrence: string
  onRecurrence: (v: string) => void
  readOnly: boolean
}) {
  // `frequency_note` was a freeform field before these stops existed; surface
  // any pre-existing text that doesn't match a stop so it isn't silently
  // hidden. Picking a stop overwrites it.
  const recurrenceUnmatched =
    recurrence.trim() !== '' && !RECURRENCE_STOPS.some((o) => o.value === recurrence)

  return (
    <div className={s.field}>
      <div className={s.fieldHead}>
        <span className={s.fieldNo}>iii.</span>
        <span className={s.fieldLabel}>Where the music sits in the picture</span>
        <span className={s.fieldRule} />
        <span className={s.fieldHint}>balance · source · recurrence</span>
      </div>
      <div className={s.where}>
        <WhereScale
          cap="Balance"
          options={BALANCE_STOPS}
          value={balance}
          onSelect={onBalance}
          readOnly={readOnly}
        />
        <WhereScale
          cap="Source"
          options={DIEGETIC_STOPS}
          value={diegetic}
          onSelect={onDiegetic}
          readOnly={readOnly}
        />
        <WhereScale
          cap="Recurrence"
          options={RECURRENCE_STOPS}
          value={recurrenceUnmatched ? '' : recurrence}
          onSelect={onRecurrence}
          readOnly={readOnly}
          extraNote={recurrenceUnmatched
            ? <>previously noted — <em>{recurrence.trim()}</em></>
            : null}
        />
      </div>
    </div>
  )
}

// Typographic equalizer: a single rule per dial with stop-ticks. The active
// stop fills with ember; its label and gloss read in italic ember below the
// rule. Inactive stops show only as ticks (their labels appear on hover).
// One coherent set of three dials, not three chip rows.
function WhereScale({
  cap, options, value, onSelect, readOnly, extraNote,
}: {
  cap: string
  options: WhereOption[]
  value: string
  onSelect: (v: string) => void
  readOnly: boolean
  extraNote?: React.ReactNode
}) {
  const activeIdx = options.findIndex((o) => o.value === value)
  const active = activeIdx >= 0 ? options[activeIdx] : null

  return (
    <div className={s.whereRow}>
      <div className={s.whereCap}>{cap}</div>
      <div className={s.whereScale}>
        <div className={s.whereTrack} role="radiogroup" aria-label={cap}>
          <div className={s.whereLine} aria-hidden="true" />
          {options.map((opt, i) => {
            const on = i === activeIdx
            const pct = options.length === 1 ? 50 : (i / (options.length - 1)) * 100
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={opt.label}
                className={`${s.whereStop} ${on ? s.whereStopOn : ''}`}
                style={{ left: `${pct}%` }}
                onClick={() => onSelect(on ? '' : opt.value)}
                disabled={readOnly}
                title={opt.gloss}
              >
                <span className={s.whereDot} aria-hidden="true" />
                <span className={s.whereStopLabel}>{opt.label}</span>
              </button>
            )
          })}
        </div>
        <div className={s.whereCaption}>
          {active ? (
            // Labels are visible above each stop, so the caption only carries
            // the gloss for the active choice — no duplication of the label.
            <span className={s.whereCaptionGloss}>{active.gloss}</span>
          ) : (
            <span className={s.whereCaptionEmpty}>— pick a stop —</span>
          )}
        </div>
        {extraNote && <div className={s.whereExtra}>{extraNote}</div>}
      </div>
    </div>
  )
}

function DensityField({
  selected, onSelect, readOnly,
}: {
  selected: string
  onSelect: (k: string) => void
  readOnly: boolean
}) {
  return (
    <div className={s.field}>
      <div className={s.fieldHead}>
        <span className={s.fieldNo}>iv.</span>
        <span className={s.fieldLabel}>How much music?</span>
        <span className={s.fieldRule} />
        <span className={s.fieldHint}>density ladder · silence → saturated</span>
      </div>
      <div className={s.density}>
        {DENSITY_BARS.map((d, i) => {
          const on = selected === d.key
          return (
            <button
              key={d.key}
              type="button"
              className={`${s.dens} ${on ? s.densOn : ''}`}
              onClick={() => onSelect(on ? '' : d.key)}
              disabled={readOnly}
              title={DENSITY_PHRASES[d.key]}
            >
              <span className={s.densCap}>{String(i + 1).padStart(2, '0')}</span>
              <span className={s.densGlyph}>
                {d.bars.map((h, j) => (
                  <i key={j} style={{ height: `${Math.round(h * 1.4 + 4)}px` }} />
                ))}
              </span>
              <span className={s.densLabel}>{d.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function VoiceField({
  words, wrong, onWords, onWrong, readOnly,
}: {
  words: string
  wrong: string
  onWords: (v: string) => void
  onWrong: (v: string) => void
  readOnly: boolean
}) {
  return (
    <div className={s.field}>
      <div className={s.fieldHead}>
        <span className={s.fieldNo}>v.</span>
        <span className={s.fieldLabel}>In your own words</span>
        <span className={s.fieldRule} />
        <span className={s.fieldHint}>the cue · what would be wrong with it</span>
      </div>
      <div className={s.voice}>
        <div className={s.voicePane}>
          <div className={s.voiceCap}>Director&rsquo;s words</div>
          <textarea
            className={s.voiceTextarea}
            value={words}
            onChange={(e) => onWords(e.target.value)}
            placeholder="What does this moment feel like? Don't censor — just describe it."
            disabled={readOnly}
            rows={4}
          />
        </div>
        <div className={`${s.voicePane} ${s.voicePaneNeg}`}>
          <div className={s.voiceCap}>What would be <em>wrong</em></div>
          <textarea
            className={s.voiceTextarea}
            value={wrong}
            onChange={(e) => onWrong(e.target.value)}
            placeholder='e.g. "anything that tells the audience how to feel."'
            disabled={readOnly}
            rows={4}
          />
        </div>
      </div>
    </div>
  )
}

function SpecsField({
  format, onFormat, bpm, bpmIsAuto, onBpm,
  keySig, onKey, instruments, onInstruments, readOnly,
}: {
  format: string
  onFormat: (v: string) => void
  bpm: number | null
  bpmIsAuto: boolean
  onBpm: (v: number | null) => void
  keySig: string
  onKey: (v: string) => void
  instruments: string
  onInstruments: (v: string) => void
  readOnly: boolean
}) {
  const safeBpm = bpm ?? 80
  // Round to whole percentages: same SSR/CSR float-precision issue as the
  // waveform bars. 1% is below visual threshold for the rail.
  const fillPct = Math.round(Math.max(0, Math.min(100, ((safeBpm - 30) / 170) * 100)))

  return (
    <div className={s.field}>
      <div className={s.fieldHead}>
        <span className={s.fieldNo}>vi.</span>
        <span className={s.fieldLabel}>Audio specifications</span>
        <span className={s.fieldRule} />
        <span className={s.fieldHint}>format · BPM · key · instruments</span>
      </div>
      <div className={s.knobs}>
        <div>
          <div className={s.knobCap}>Format</div>
          <select
            className={s.knobSelect}
            value={format}
            onChange={(e) => onFormat(e.target.value)}
            disabled={readOnly}
          >
            {FORMAT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <div className={s.knobCap}>
            Target BPM
            {bpmIsAuto && bpm != null && <span>· auto from atmosphere</span>}
          </div>
          <div className={s.bpmGrid}>
            <input
              type="number"
              className={s.bpmInput}
              min={30}
              max={200}
              value={bpm ?? ''}
              placeholder="—"
              onChange={(e) => {
                const v = e.target.value.trim()
                if (v === '') { onBpm(null); return }
                const n = Number(v)
                if (Number.isFinite(n)) onBpm(Math.max(30, Math.min(200, Math.round(n))))
              }}
              disabled={readOnly}
              aria-label="Target BPM"
            />
            <div className={s.bpmRail}>
              <div className={s.bpmPip} style={{ left: `${fillPct}%` }} />
              <input
                type="range"
                className={s.bpmRange}
                min={30} max={200}
                value={safeBpm}
                onChange={(e) => onBpm(Number(e.target.value))}
                disabled={readOnly}
                aria-label="Target BPM (slider)"
              />
            </div>
            <div className={s.bpmFoot}>
              {/* Ticks at their actual proportional positions on the 30–200
                  scale. First/last anchor to rail edges so they don't get
                  clipped; the others center on their value. */}
              {[30, 80, 120, 200].map((v, i, arr) => {
                const pct = ((v - 30) / 170) * 100
                const style: React.CSSProperties =
                  i === 0
                    ? { left: 0 }
                    : i === arr.length - 1
                      ? { right: 0 }
                      : { left: `${pct}%`, transform: 'translateX(-50%)' }
                return <span key={v} style={style}>{v}</span>
              })}
            </div>
          </div>
        </div>
        <div>
          <div className={s.knobCap}>Key signature</div>
          <select
            className={s.knobSelect}
            value={keySig}
            onChange={(e) => onKey(e.target.value)}
            disabled={readOnly}
          >
            <option value="">— open —</option>
            {KEY_SIGNATURES.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <div className={s.knobCap}>Featured instruments</div>
          <input
            className={s.knobInput}
            type="text"
            value={instruments}
            onChange={(e) => onInstruments(e.target.value)}
            placeholder="none specified"
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  )
}

function SpecDossier({
  open, onToggle, spec,
}: {
  open: boolean
  onToggle: () => void
  spec: [string, string | string[]][]
}) {
  return (
    <div className={s.spec}>
      <button type="button" className={s.specHead} onClick={onToggle} aria-expanded={open}>
        <span className={s.specHeadArrow}>{open ? '▾' : '▸'}</span>
        <span className={s.specHeadL}>The translation — what your composer will read</span>
        <span className={s.specHeadR}>auto-compiled</span>
      </button>
      {open && (
        <div className={s.specGrid}>
          {spec.map(([k, v]) => (
            <div key={k} className={s.specLine}>
              <span className={s.specKey}>{k}</span>
              <span className={s.specVal}>
                {Array.isArray(v)
                  ? v.map((x, i) => (
                      <span key={i}>{i > 0 && ', '}<em>{x}</em></span>
                    ))
                  : v}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Compose bar ──────────────────────────────────────────────────────────────

function ComposeBar({
  dirty, lastSavedTime, intentVersionLabel,
  onSave, onGenerate, canGenerate, saving, generating,
}: {
  dirty: boolean
  lastSavedTime: string | null
  intentVersionLabel: string
  onSave: () => Promise<unknown>
  onGenerate: () => Promise<unknown> | void
  canGenerate: boolean
  saving: boolean
  generating: boolean
}) {
  return (
    <div className={s.composeBar}>
      <span className={s.composeStamp}>
        intent · {intentVersionLabel === '—' ? 'unsaved' : intentVersionLabel}
        {dirty
          ? <> · <span className={s.composeStampDirty}>● unsaved</span></>
          : lastSavedTime
            ? <> · {lastSavedTime}</>
            : null}
      </span>
      <div className={s.composeActions}>
        <button
          type="button"
          className={s.btnSave}
          onClick={onSave}
          disabled={saving || !dirty}
        >
          {saving ? 'Saving…' : 'Save brief'}
        </button>
        <button
          type="button"
          className={`${s.btnGenerate} ${canGenerate ? '' : s.btnGenerateOff}`}
          onClick={onGenerate}
          disabled={!canGenerate}
        >
          <span className={s.btnGenerateMark}>⚙</span>
          {generating ? 'Generating…' : 'Generate mock cue'}
        </button>
      </div>
    </div>
  )
}

// ── Result panel ─────────────────────────────────────────────────────────────

function ResultPanel(props: {
  state: EditorState
  latest: MockCueWithProvider | null
  approvedCue: MockCueWithProvider | null
  sceneTitle: string
  jobStartedAt: string | null
  hasAtmospheres: boolean
  onApprove: () => Promise<unknown>
  onUnapprove: () => Promise<unknown>
  onRegenerate: () => Promise<unknown> | void
  onGenerate: () => Promise<unknown> | void
  onDelete: (cueId: string) => Promise<unknown>
  approving: boolean
  unapproving: boolean
  deletingId: string | null
  canApprove: boolean
  canDirect: boolean
  recipients: string
  appUrl: string
  previousVersions: MockCueWithProvider[]
  modelProvider: string
}) {
  if (props.state === 'spotting' && !props.latest) {
    return (
      <ResultEmpty
        canGenerate={props.canDirect && props.hasAtmospheres}
        onGenerate={props.onGenerate}
      />
    )
  }
  if (props.state === 'generating') {
    return <ResultGenerating jobStartedAt={props.jobStartedAt} />
  }
  if (props.state === 'approved' && props.approvedCue) {
    return (
      <ResultApproved
        cue={props.approvedCue}
        sceneTitle={props.sceneTitle}
        onUnapprove={props.onUnapprove}
        unapproving={props.unapproving}
        canApprove={props.canApprove}
        recipients={props.recipients}
        appUrl={props.appUrl}
        previousVersions={props.previousVersions}
        canDelete={props.canDirect}
        onDelete={props.onDelete}
        deletingId={props.deletingId}
      />
    )
  }
  if (props.latest) {
    return (
      <ResultReady
        cue={props.latest}
        sceneTitle={props.sceneTitle}
        canApprove={props.canApprove}
        canRegenerate={props.canDirect}
        canDelete={props.canDirect}
        approving={props.approving}
        onApprove={props.onApprove}
        onRegenerate={props.onRegenerate}
        onDelete={props.onDelete}
        deletingId={props.deletingId}
        previousVersions={props.previousVersions}
      />
    )
  }
  // Composing without a cue yet — show empty state with a generate prompt.
  return (
    <ResultEmpty
      canGenerate={props.canDirect && props.hasAtmospheres}
      onGenerate={props.onGenerate}
    />
  )
}

function ResultEmpty({
  canGenerate, onGenerate,
}: {
  canGenerate: boolean
  onGenerate: () => Promise<unknown> | void
}) {
  return (
    <section className={`${s.result} ${s.resultEmpty}`}>
      <div className={s.resultHead}>
        <span className={s.resultEyebrow}>II · The result</span>
        <span />
        <span className={s.resultVersion}>no mock cue yet</span>
      </div>
      <div className={s.resultBody}>
        <div className={s.resultEmptyArt}>♪</div>
        <h3 className={s.resultEmptyTitle}>Nothing has been heard yet.</h3>
        <p className={s.resultEmptySub}>
          When the brief feels close enough, generate a mock cue. You&rsquo;ll have something to play
          against the picture in about a minute.
        </p>
        <button
          type="button"
          className={`${s.btnApprove} ${canGenerate ? '' : s.btnGenerateOff}`}
          disabled={!canGenerate}
          onClick={() => { void onGenerate() }}
        >
          <span className={s.btnApproveMark}>⚙</span>
          <span>{canGenerate ? 'Generate first mock cue' : 'Choose at least one atmosphere'}</span>
          <span className={s.btnApproveArrow}>→</span>
        </button>
        <p className={s.resultEmptyAttr}>~ 30 to 90 seconds</p>
      </div>
    </section>
  )
}

function ResultGenerating({ jobStartedAt }: { jobStartedAt: string | null }) {
  // Drive stages from elapsed time. We don't have stage-level telemetry, so
  // the timeline is illustrative — first two stages tick over after the
  // queue lands; sampling reads as "now" until completion.
  const [elapsed, setElapsed] = useState(() => elapsedSeconds(jobStartedAt))
  useEffect(() => {
    const id = setInterval(() => setElapsed(elapsedSeconds(jobStartedAt)), 1000)
    return () => clearInterval(id)
  }, [jobStartedAt])

  const stages = [
    { label: 'Reading the brief',     state: elapsed > 4 ? 'done' : 'now',  time: elapsed > 4 ? '0:04' : formatMS(elapsed) },
    { label: 'Loading the staves',    state: elapsed > 7 ? 'done' : elapsed > 4 ? 'now'  : 'next', time: elapsed > 7 ? '0:07' : (elapsed > 4 ? formatMS(elapsed) : '—') },
    { label: 'Drawing the cue',       state: elapsed > 7 ? 'now'  : 'next', time: elapsed > 7 ? formatMS(elapsed) : '—' },
    { label: 'Listening back',        state: 'next', time: '—' },
    { label: 'Saving to your binder', state: 'next', time: '—' },
  ] as const

  const expectedTotal = 90
  const elapsedLabel = formatMS(elapsed)
  const totalLabel = formatMS(expectedTotal)

  return (
    <section className={`${s.result} ${s.resultGen}`}>
      <div className={s.resultHead}>
        <span className={s.resultEyebrow}>II · Developing</span>
        <span />
        <span className={s.resultVersion}>in progress</span>
      </div>
      <div className={s.genBody}>
        <div className={s.leader}>3</div>
        <h3 className={s.genTitle}>Drawing the cue.</h3>
        <p className={s.genSub}>
          The brief is in flight. This usually finishes in about a minute —
          go look at the clip, or write what would be wrong while you wait.
        </p>
        <ol className={s.genStages}>
          {stages.map((stg, i) => (
            <li
              key={i}
              className={`${s.genStage} ${stg.state === 'done' ? s.genStageDone : stg.state === 'now' ? s.genStageNow : ''}`}
            >
              <span className={s.genStageMark}>{stg.state === 'done' ? '✓' : stg.state === 'now' ? '◐' : '·'}</span>
              <span className={s.genStageLabel}>{stg.label}</span>
              <span className={s.genStageTime}>{stg.time}</span>
            </li>
          ))}
        </ol>
        <div className={s.genProgress}><div className={s.genProgressFill} /></div>
        <div className={s.genFoot}>
          <span>job {elapsedLabel} of ~ {totalLabel}</span>
          <span>·</span>
        </div>
      </div>
    </section>
  )
}

function ResultReady({
  cue, sceneTitle, canApprove, canRegenerate, canDelete, approving, onApprove, onRegenerate, onDelete, deletingId, previousVersions,
}: {
  cue: MockCueWithProvider
  sceneTitle: string
  canApprove: boolean
  canRegenerate: boolean
  canDelete: boolean
  approving: boolean
  onApprove: () => Promise<unknown>
  onRegenerate: () => Promise<unknown> | void
  onDelete: (cueId: string) => Promise<unknown>
  deletingId: string | null
  previousVersions: MockCueWithProvider[]
}) {
  const isDeletingThis = deletingId === cue.id
  return (
    <section className={s.result}>
      <div className={s.resultHead}>
        <span className={s.resultEyebrow}>II · Mock cue · v{cue.version_number}</span>
        <h3 className={s.resultTitle}>{sceneTitle}</h3>
        <span className={s.resultVersion}>
          {providerBadge(cue.model_provider)} · <em>{formatMS(cue.duration_sec)}</em> · {timeAgo(cue.created_at)}
        </span>
      </div>
      <div className={s.resultBody}>
        <CueWave cueId={cue.id} durationSec={cue.duration_sec} seed={cue.id} />

        <div className={s.resultActions}>
          {canApprove && (
            <button type="button" className={s.btnApprove} onClick={onApprove} disabled={approving}>
              <span className={s.btnApproveMark}>✓</span>
              <span>{approving ? 'Approving…' : 'Approve · unlock composer brief'}</span>
              <span className={s.btnApproveArrow}>→</span>
            </button>
          )}
          {canRegenerate && (
            <button type="button" className={s.btnQuiet} onClick={onRegenerate}>
              <span>↻ Regenerate · same brief</span>
              <em>opens a new version, keeps this one</em>
            </button>
          )}
          {canDelete && (
            <DeleteCueLink
              onDelete={() => onDelete(cue.id)}
              busy={isDeletingThis}
              label="Delete this cue"
            />
          )}
        </div>

        <VersionStack
          versions={previousVersions}
          canDelete={canDelete}
          onDelete={onDelete}
          deletingId={deletingId}
        />
      </div>
    </section>
  )
}

function ResultApproved({
  cue, sceneTitle, onUnapprove, unapproving, canApprove, recipients, appUrl, previousVersions, canDelete, onDelete, deletingId,
}: {
  cue: MockCueWithProvider
  sceneTitle: string
  onUnapprove: () => Promise<unknown>
  unapproving: boolean
  canApprove: boolean
  recipients: string
  appUrl: string
  previousVersions: MockCueWithProvider[]
  canDelete: boolean
  onDelete: (cueId: string) => Promise<unknown>
  deletingId: string | null
}) {
  const briefUrl = `${appUrl}/brief/${cue.id}`
  return (
    <>
      <section className={s.dispatch}>
        <div className={s.dispatchHead}>
          <span className={s.dispatchEyebrow}>Brief · delivered</span>
          {cue.approved_at && (
            <span className={s.dispatchDate}>{formatStamp(cue.approved_at)}</span>
          )}
        </div>
        <p className={s.dispatchBody}>
          v{cue.version_number} of <em>{sceneTitle}</em> is in the composer&rsquo;s hands.
          {recipients && <> {recipients}</>}
        </p>
        <div className={s.dispatchActions}>
          <div className={s.dispatchActionsL}>
            <button
              type="button"
              className={s.dispatchBtn}
              onClick={() => {
                navigator.clipboard.writeText(briefUrl).then(
                  () => toast.success('Link copied.'),
                  () => toast.error('Copy failed.'),
                )
              }}
            >Copy link</button>
            <a
              className={s.dispatchBtn}
              href={briefUrl}
              target="_blank"
              rel="noopener noreferrer"
            >Open brief ↗</a>
          </div>
          {canApprove && (
            <button
              type="button"
              className={s.dispatchWithdraw}
              onClick={onUnapprove}
              disabled={unapproving}
            >{unapproving ? 'Withdrawing…' : 'Withdraw'}</button>
          )}
        </div>
      </section>

      <section className={s.result}>
        <div className={s.resultHead}>
          <span className={s.resultEyebrow}>The approved cue · v{cue.version_number}</span>
          <h3 className={s.resultTitle}>{sceneTitle}</h3>
          <span className={s.resultVersion}>
            {providerBadge(cue.model_provider)} · <em>{formatMS(cue.duration_sec)}</em>
          </span>
        </div>
        <div className={s.resultBody}>
          <CueWave cueId={cue.id} durationSec={cue.duration_sec} seed={cue.id} />
          <VersionStack
            versions={previousVersions}
            canDelete={canDelete}
            onDelete={onDelete}
            deletingId={deletingId}
          />
        </div>
      </section>
    </>
  )
}

// ── Audio waveform — deterministic 96-bar visual, masked by audio progress ──

function CueWave({ cueId, durationSec, seed }: { cueId: string; durationSec: number; seed: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioStatus, setAudioStatus] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentSec, setCurrentSec] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/mock-cues/${cueId}/audio-url`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}))
        return { ok: r.ok, ...d }
      })
      .then((d) => {
        if (cancelled) return
        if (d.ok && typeof d.url === 'string') {
          setAudioUrl(d.url)
          setAudioStatus('ready')
        } else {
          setAudioStatus('missing')
        }
      })
      .catch(() => {
        if (!cancelled) setAudioStatus('missing')
      })
    return () => { cancelled = true }
  }, [cueId])

  // Stop this player when something else starts playing on the page —
  // prevents the main waveform and a version-row preview from overlapping.
  useEffect(() => {
    function onOtherPlay(e: Event) {
      const a = audioRef.current
      if (!a) return
      if (e.target !== a && !a.paused) a.pause()
    }
    document.addEventListener('play', onOtherPlay, true)
    return () => document.removeEventListener('play', onOtherPlay, true)
  }, [])

  const bars = useMemo(() => makeWave(seed, 96), [seed])

  async function toggle() {
    const a = audioRef.current
    if (!a || !audioUrl) return
    if (a.paused) {
      try {
        await a.play()
        setPlaying(true)
      } catch (err) {
        console.error('[CueWave] play() rejected', err)
        toast.error('Could not play audio.')
      }
    } else {
      a.pause()
      setPlaying(false)
    }
  }

  function handleScrub(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current
    if (!a || !Number.isFinite(a.duration) || a.duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration
  }

  return (
    <div className={s.wave}>
      {/* Always rendered. src={undefined} when URL not yet fetched —
          React then sets the attribute when audioUrl resolves, browser
          starts loading. Element identity is preserved across renders
          so ref, listeners, and currentTime persist. */}
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentSec(0) }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget
          if (!Number.isFinite(a.duration) || a.duration <= 0) return
          setCurrentSec(a.currentTime)
          setProgress(a.currentTime / a.duration)
          // Defensive: keep `playing` in sync with the audio element's
          // actual state. If onPlay/onPause synthetic events ever fail
          // to fire (intermittent React 19 behavior on media events
          // we've been chasing), this ensures the icon eventually
          // catches up while the audio is moving.
          setPlaying(!a.paused)
        }}
        onError={(e) => {
          const code = e.currentTarget.error?.code
          const msg = e.currentTarget.error?.message
          console.error('[CueWave] audio error', { code, msg, src: e.currentTarget.src })
          toast.error('Audio failed to load.')
        }}
      />
      <div className={s.waveStrip} onClick={handleScrub}>
        {bars.map((b, i) => (
          <i
            key={i}
            className={i / bars.length < progress ? s.played : ''}
            style={{ height: `${b}px` }}
          />
        ))}
      </div>
      <div className={s.waveRail}>
        <div className={s.waveRailL}>
          <button
            type="button"
            className={s.wavePlay}
            onClick={toggle}
            disabled={!audioUrl}
            aria-label={playing ? 'Pause' : 'Play'}
            title={audioStatus === 'missing' ? 'Audio file missing — try regenerating this cue' : playing ? 'Pause' : 'Play'}
          >
            {playing ? <PauseGlyph /> : <PlayGlyph />}
          </button>
          <span className={s.waveNow}>
            {audioStatus === 'missing'
              ? <em style={{ color: 'var(--pencil)' }}>audio file missing</em>
              : <>{formatMS(currentSec)} <em>+ {formatMS(Math.max(0, durationSec - currentSec))}</em></>}
          </span>
        </div>
        <span>—{formatMS(durationSec)} · 44.1 kHz · stereo</span>
      </div>
    </div>
  )
}

function VersionStack({
  versions, canDelete, onDelete, deletingId,
}: {
  versions: MockCueWithProvider[]
  canDelete: boolean
  onDelete: (cueId: string) => Promise<unknown>
  deletingId: string | null
}) {
  // Shared audio element for all preview rows — only one plays at a time.
  // playingId tracks which row is currently playing; the row's button
  // shows pause when it matches, play otherwise. Clicking the same row
  // again pauses; clicking a different row switches to it.
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  useEffect(() => {
    const a = new Audio()
    audioRef.current = a
    const onEnded = () => setPlayingId(null)
    const onPause = () => {
      // External pause (e.g., main CueWave starts and forces us to pause)
      // — clear the playing indicator so the icon flips back. Skip if
      // the pause is happening because src changed (cue switch); the
      // togglePreview flow sets playingId after play() resolves.
      if (a.ended || a.src === '' || a.src === window.location.href) return
      setPlayingId(null)
    }
    a.addEventListener('ended', onEnded)
    a.addEventListener('pause', onPause)

    // Stop this preview when something else (main CueWave, or a sibling
    // preview audio) starts playing.
    function onOtherPlay(e: Event) {
      if (e.target !== a && !a.paused) a.pause()
    }
    document.addEventListener('play', onOtherPlay, true)

    return () => {
      a.pause()
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('pause', onPause)
      document.removeEventListener('play', onOtherPlay, true)
    }
  }, [])

  async function togglePreview(cueId: string) {
    const a = audioRef.current
    if (!a) return

    // Same cue clicked again — toggle pause.
    if (playingId === cueId && !a.paused) {
      a.pause()
      setPlayingId(null)
      return
    }

    try {
      const res = await fetch(`/api/mock-cues/${cueId}/audio-url`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || typeof data?.url !== 'string') {
        toast.error(data?.error ?? 'Audio not available.')
        return
      }
      // Switching cues — pause current, change src, play new.
      if (a.src !== data.url) {
        a.pause()
        a.src = data.url
      }
      await a.play()
      setPlayingId(cueId)
    } catch (err) {
      console.error('[VersionStack] preview play failed', err)
      toast.error('Could not play audio.')
    }
  }

  if (versions.length === 0) return null

  return (
    <div className={s.versions}>
      <div className={s.versionsCap}>
        Earlier passes — {versions.length === 1 ? 'one of them' : `${asNumberWord(versions.length)} of them`}
      </div>
      <ul className={s.versionsList}>
        {versions.map((v) => {
          const isPlaying = playingId === v.id
          const isDeletingThis = deletingId === v.id
          // Approved cues can't be deleted directly — the API returns 409
          // until approval is withdrawn. Hide the delete affordance on
          // approved rows rather than letting it 409 on click.
          const showDelete = canDelete && !v.is_approved
          return (
            <li key={v.id} className={s.versionLi}>
              <span className={s.versionNum}>v{v.version_number}</span>
              <span className={s.versionLabel}>
                {v.is_approved ? 'approved earlier' : `pass ${v.version_number}`}
                <em>{providerBadge(v.model_provider)} · {formatMS(v.duration_sec)} stereo</em>
              </span>
              <span className={s.versionTime}>{timeAgo(v.created_at)}</span>
              {showDelete && (
                <VersionDeleteButton
                  onConfirm={() => onDelete(v.id)}
                  busy={isDeletingThis}
                />
              )}
              <button
                type="button"
                className={s.versionPlay}
                onClick={() => togglePreview(v.id)}
                title={isPlaying ? 'Pause' : 'Listen back'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <PauseGlyph /> : <PlayGlyph />}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Two-step delete affordance for a version-stack row. First click flips
// the button into a "confirm" state that auto-reverts after 3s; second
// click within that window calls onConfirm. Avoids native confirm()
// dialogs and accidental deletes alike.
function VersionDeleteButton({ onConfirm, busy }: { onConfirm: () => void; busy: boolean }) {
  const [confirming, setConfirming] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function handleClick() {
    if (busy) return
    if (confirming) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setConfirming(false)
      onConfirm()
      return
    }
    setConfirming(true)
    timeoutRef.current = setTimeout(() => setConfirming(false), 3000)
  }

  return (
    <button
      type="button"
      className={`${s.versionDelete} ${confirming ? s.versionDeleteConfirming : ''}`}
      onClick={handleClick}
      onBlur={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setConfirming(false)
      }}
      title={confirming ? 'Click again to delete' : 'Delete this cue'}
      aria-label={confirming ? 'Click again to delete' : 'Delete this cue'}
      disabled={busy}
    >
      {busy ? '…' : confirming ? 'delete?' : <DeleteGlyph />}
    </button>
  )
}

// Quiet text-link delete affordance for the main cue area (ResultReady).
// Same two-step confirm pattern as VersionDeleteButton, but rendered as
// a mono-cap text link rather than an icon button — fits the editorial
// vocabulary of the surrounding actions.
function DeleteCueLink({ onDelete, busy, label }: {
  onDelete: () => void
  busy: boolean
  label: string
}) {
  const [confirming, setConfirming] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function handleClick() {
    if (busy) return
    if (confirming) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setConfirming(false)
      onDelete()
      return
    }
    setConfirming(true)
    timeoutRef.current = setTimeout(() => setConfirming(false), 3000)
  }

  return (
    <button
      type="button"
      className={`${s.deleteCueLink} ${confirming ? s.deleteCueLinkConfirming : ''}`}
      onClick={handleClick}
      onBlur={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setConfirming(false)
      }}
      disabled={busy}
    >
      {busy ? 'Deleting…' : confirming ? 'Click again to delete' : `× ${label}`}
    </button>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Inline SVG play/pause glyphs. Use these instead of Unicode characters
// (▶/❚❚) because Cormorant Garamond — the page's serif font — lacks
// the heavy-vertical-bar glyph (U+275A), so `❚❚` rendered as invisible
// fallback in some browsers and made the play→pause toggle look broken
// even when state was changing correctly. SVG renders identically
// regardless of font.
function PlayGlyph() {
  return (
    <svg
      width="9"
      height="11"
      viewBox="0 0 9 11"
      fill="currentColor"
      aria-hidden="true"
    >
      <polygon points="0,0 0,11 9,5.5" />
    </svg>
  )
}
function PauseGlyph() {
  return (
    <svg
      width="9"
      height="11"
      viewBox="0 0 9 11"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="3" height="11" />
      <rect x="6" y="0" width="3" height="11" />
    </svg>
  )
}
function DeleteGlyph() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="2" y1="2" x2="8" y2="8" />
      <line x1="8" y1="2" x2="2" y2="8" />
    </svg>
  )
}

function noop() { /* no-op */ }

function snapshotIntent(iv: IntentVersion | null) {
  return {
    atms: iv?.emotional_atmospheres ?? [],
    fn: iv?.narrative_function ?? '',
    balance: iv?.handoff_setting ?? '',
    diegetic: iv?.diegetic_status ?? '',
    recurrence: iv?.frequency_note ?? '',
    dens: iv?.density ?? '',
    words: iv?.director_words ?? '',
    wrong: iv?.what_would_be_wrong ?? '',
    formatTag: iv?.format_tag ?? 'Band',
    bpm: iv?.target_bpm ?? null,
    keySig: iv?.key_signature ?? '',
    instruments: iv?.featured_instruments ?? '',
  }
}
type Snapshot = ReturnType<typeof snapshotIntent>
function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return (
    a.fn === b.fn &&
    a.balance === b.balance &&
    a.diegetic === b.diegetic &&
    a.recurrence === b.recurrence &&
    a.dens === b.dens &&
    a.words === b.words &&
    a.wrong === b.wrong &&
    a.formatTag === b.formatTag &&
    a.bpm === b.bpm &&
    a.keySig === b.keySig &&
    a.instruments === b.instruments &&
    a.atms.length === b.atms.length &&
    a.atms.every((x, i) => x === b.atms[i])
  )
}

function makeWave(seedStr: string, count: number): number[] {
  let s = 0
  for (let i = 0; i < seedStr.length; i++) s = (s * 31 + seedStr.charCodeAt(i)) >>> 0
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280
    const r = s / 233280
    const t = i / (count - 1)
    const env = Math.sin(t * Math.PI)
    const h = Math.max(4, Math.min(76, env * 56 + r * 30 + 6))
    // Round to whole pixels: React's SSR/CSR serialization disagree on
    // float precision in inline styles, which trips the hydration check.
    // 1px is well below visual threshold for a 86px-tall waveform bar.
    out.push(Math.round(h))
  }
  return out
}

function elapsedSeconds(jobStartedAt: string | null): number {
  if (!jobStartedAt) return 0
  const t = new Date(jobStartedAt).getTime()
  if (!Number.isFinite(t)) return 0
  return Math.max(0, Math.floor((Date.now() - t) / 1000))
}

function formatMS(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatHMS(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00:00'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}
function pad2(n: number): string { return n < 10 ? `0${n}` : String(n) }

function clockTime(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return '—'
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function formatStamp(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${pad2(d.getDate())} ${months[d.getMonth()]} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function timeAgo(iso: string | Date): string {
  const t = typeof iso === 'string' ? new Date(iso).getTime() : iso.getTime()
  if (!Number.isFinite(t)) return ''
  const ms = Date.now() - t
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

function providerBadge(p: string | null | undefined): string {
  if (p === 'stable_audio') return 'SA'
  if (p === 'lyria') return 'Lyria'
  return p ?? '—'
}

function stringOrDash(v: unknown): string {
  if (typeof v === 'string' && v.trim()) return v
  if (Array.isArray(v) && v.length > 0) return v.join(', ')
  return '—'
}

function asNumberWord(n: number): string {
  const w = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
  return w[n] ?? String(n)
}
