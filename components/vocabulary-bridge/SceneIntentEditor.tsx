'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import {
  ATMOSPHERE_DESCRIPTORS,
  FUNCTION_DESCRIPTORS,
  DENSITY_PHRASES,
  KEY_SIGNATURES,
  RECORDING_QUALITY_PHRASES,
} from '@/lib/prompts/taxonomy'
import {
  DIEGETIC_OPTIONS as diegeticSelectOptions,
  HANDOFF_OPTIONS as handoffSelectOptions,
  diegeticLabel,
  handoffLabel,
} from '@/lib/prompts/intentDisplay'
import { buildGenerationPrompt, buildMusicalSpec } from '@/lib/prompts/buildGenerationPrompt'
import type { IntentVersion, GenerationSettings } from '@/lib/store'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, Zap, ChevronRight } from 'lucide-react'

const FORMAT_OPTIONS = [
  { value: 'Solo',      label: 'Solo' },
  { value: 'Duet',      label: 'Duet' },
  { value: 'Band',      label: 'Band' },
  { value: 'Orchestra', label: 'Orchestra' },
  { value: 'Chorus',    label: 'Chorus' },
]

const QUALITY_OPTIONS = [
  { value: 'pristine',  label: 'Pristine studio' },
  { value: 'intimate',  label: 'Intimate room' },
  { value: 'lofi',      label: 'Lo-fi / vintage' },
  { value: 'raw',       label: 'Raw / textured' },
]

const QUALITY_LABELS: Record<string, string> = Object.fromEntries(
  QUALITY_OPTIONS.map(({ value, label }) => [value, label])
)

const ENERGY_TIERS: { label: string; keys: string[] }[] = [
  {
    label: 'High energy',
    keys: ['joy_elation', 'urgency_propulsion', 'confidence_swagger', 'tension_anxiety', 'triumph'],
  },
  {
    label: 'Mid energy',
    keys: ['doubt_ambiguity', 'menace', 'irony_dissonance'],
  },
  {
    label: 'Low energy',
    keys: ['calm_peace', 'wonder_awe', 'intimacy_tenderness', 'nostalgia_longing', 'grief_sorrow', 'dread_ominous'],
  },
]

function SectionHeader({
  label,
  open,
  onToggle,
}: {
  label: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors py-1"
    >
      <motion.span
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ duration: 0.15 }}
        className="inline-flex"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </motion.span>
      {label}
    </button>
  )
}

const sectionVariants = {
  hidden: { height: 0, opacity: 0, overflow: 'hidden' as const },
  visible: { height: 'auto', opacity: 1, overflow: 'visible' as const },
}

interface SceneIntentEditorProps {
  sceneId: string
  projectId: string
  initialIntent: IntentVersion | null
  durationSec: number
  genSettings: GenerationSettings | null
  toneBrief: string | null
  sceneLabel: string
}

export default function SceneIntentEditor({
  sceneId,
  projectId,
  initialIntent,
  durationSec,
  genSettings,
  toneBrief,
  sceneLabel,
}: SceneIntentEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [atmospheres, setAtmospheres] = useState<string[]>(
    initialIntent?.emotional_atmospheres ?? []
  )
  const [narrativeFunction, setNarrativeFunction] = useState(
    initialIntent?.narrative_function ?? ''
  )
  const [density, setDensity] = useState(initialIntent?.density ?? '')
  const [directorWords, setDirectorWords] = useState(initialIntent?.director_words ?? '')
  const [whatWouldBeWrong, setWhatWouldBeWrong] = useState(
    initialIntent?.what_would_be_wrong ?? ''
  )
  const [handoffSetting, setHandoffSetting] = useState(initialIntent?.handoff_setting ?? '')
  const [diegeticStatus, setDiegeticStatus] = useState(initialIntent?.diegetic_status ?? '')
  const [frequencyNote, setFrequencyNote] = useState(initialIntent?.frequency_note ?? '')

  const [formatTag, setFormatTag] = useState(initialIntent?.format_tag ?? 'Band')
  const [targetBpm, setTargetBpm] = useState<number | null>(initialIntent?.target_bpm ?? null)
  const [keySignature, setKeySignature] = useState(initialIntent?.key_signature ?? '')
  const [featuredInstruments, setFeaturedInstruments] = useState(initialIntent?.featured_instruments ?? '')
  const [recordingQuality, setRecordingQuality] = useState(initialIntent?.recording_quality ?? '')
  const [workingTitle, setWorkingTitle] = useState(initialIntent?.working_title ?? '')

  const [showPromptPreview, setShowPromptPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  const hasContextValues = !!(handoffSetting || diegeticStatus || frequencyNote)
  const hasAudioValues = !!(formatTag !== 'Band' || targetBpm || keySignature || featuredInstruments || recordingQuality || workingTitle)
  const hasNegativeValues = !!(directorWords || whatWouldBeWrong)

  const [contextOpen, setContextOpen] = useState(hasContextValues)
  const [audioOpen, setAudioOpen] = useState(hasAudioValues)
  const [negativeOpen, setNegativeOpen] = useState(hasNegativeValues)

  function toggleAtmosphere(key: string) {
    setAtmospheres((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    )
  }

  const suggestedBpm = useMemo(() => {
    const ranges = atmospheres
      .map((a) => ATMOSPHERE_DESCRIPTORS[a]?.bpmRange)
      .filter((r): r is [number, number] => r != null)
    if (ranges.length === 0) return null
    const low  = Math.round(ranges.reduce((s, r) => s + r[0], 0) / ranges.length)
    const high = Math.round(ranges.reduce((s, r) => s + r[1], 0) / ranges.length)
    return Math.round((low + high) / 2)
  }, [atmospheres])

  const intentInput = {
    emotionalAtmospheres: atmospheres,
    narrativeFunction: narrativeFunction || null,
    density: density || null,
    whatWouldBeWrong: whatWouldBeWrong || null,
    handoffSetting: handoffSetting || null,
    frequencyNote: frequencyNote.trim() || null,
    directorWords: directorWords.trim() || null,
    diegeticStatus: diegeticStatus || null,
    targetBpm,
    keySignature: keySignature || null,
    featuredInstruments: featuredInstruments.trim() || null,
    recordingQuality: recordingQuality || null,
    workingTitle: workingTitle.trim() || null,
    formatTag: formatTag || 'Band',
  }

  const promptPreview = buildGenerationPrompt(
    intentInput,
    {
      instrumentationFamilies: genSettings?.instrumentation_families ?? [],
      eraReference: genSettings?.era_reference ?? null,
      doNotGenerate: genSettings?.do_not_generate ?? null,
      budgetReality: genSettings?.budget_reality ?? null,
      toneBrief,
    },
    durationSec
  )

  const musicalSpec = buildMusicalSpec(intentInput)

  async function handleSave() {
    if (!atmospheres.length) {
      toast.error('Choose at least one emotional atmosphere')
      return
    }
    setSaving(true)

    const res = await fetch(`/api/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scene_card_id: sceneId,
        emotional_atmospheres: atmospheres,
        narrative_function: narrativeFunction || null,
        density: density || null,
        director_words: directorWords.trim() || null,
        what_would_be_wrong: whatWouldBeWrong.trim() || null,
        handoff_setting: handoffSetting || null,
        diegetic_status: diegeticStatus || null,
        frequency_note: frequencyNote.trim() || null,
        target_bpm: targetBpm,
        key_signature: keySignature || null,
        featured_instruments: featuredInstruments.trim() || null,
        recording_quality: recordingQuality || null,
        working_title: workingTitle.trim() || null,
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
      toast.error(data.error ?? 'Failed to save intent')
      setSaving(false)
      return
    }

    toast.success('Intent saved — you can now generate a mock cue')
    setSaving(false)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-6">
      {/* ── Emotional core (always open) ─────────────────────────────── */}

      {/* Emotional Atmospheres — grouped by energy tier */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Emotional atmosphere
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            Select up to 3 that feel true
          </span>
        </Label>
        <div className="space-y-3">
          {ENERGY_TIERS.map((tier) => (
            <div key={tier.label}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1.5 font-medium">
                {tier.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tier.keys.map((key) => {
                  const desc = ATMOSPHERE_DESCRIPTORS[key]
                  if (!desc) return null
                  const selected = atmospheres.includes(key)
                  return (
                    <motion.button
                      key={key}
                      onClick={() => toggleAtmosphere(key)}
                      title={desc.description}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-colors',
                        selected
                          ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_-2px] shadow-primary/40'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      {desc.label}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">
          Each tag adds mood language and &quot;do not use&quot; terms to the AI prompt. Combining
          opposite moods stacks conflicting instructions — for example{' '}
          <span className="text-foreground/80">Tension / Anxiety</span> tells the model to avoid a
          steady pulse and clear major key, which fights an upbeat confident walk.
        </p>
        {atmospheres.includes('tension_anxiety') && atmospheres.length > 1 && (
          <p className="text-xs text-amber-600 dark:text-amber-500/90 mt-1.5 leading-relaxed">
            Tension is selected with other moods: its exclusions include major key and steady pulse.
            For strutting or playful corporate energy, try dropping Tension or picking{' '}
            <span className="font-medium">Joy / Elation</span> instead.
          </p>
        )}
      </div>

      {/* Narrative function */}
      <div className="space-y-2">
        <Label htmlFor="narrative-function" className="text-sm">What is the music doing narratively?</Label>
        <Select value={narrativeFunction} onValueChange={(v) => v && setNarrativeFunction(v)}>
          <SelectTrigger id="narrative-function" className="w-full">
            <SelectValue placeholder="Choose a function (optional)">
              {narrativeFunction
                ? (FUNCTION_DESCRIPTORS[narrativeFunction as keyof typeof FUNCTION_DESCRIPTORS]?.label ?? narrativeFunction)
                : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-full">
            {Object.entries(FUNCTION_DESCRIPTORS).map(([key, fn]) => (
              <SelectItem key={key} value={key}>
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{fn.label}</span>
                  <span className="text-muted-foreground text-xs leading-snug">{fn.description}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Density */}
      <div className="space-y-2">
        <Label htmlFor="density" className="text-sm">Music density</Label>
        <Select value={density} onValueChange={(v) => v && setDensity(v)}>
          <SelectTrigger id="density" className="w-full">
            <SelectValue placeholder="How much music? (optional)">
              {density
                ? density.charAt(0).toUpperCase() + density.slice(1)
                : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-full">
            {Object.entries(DENSITY_PHRASES).map(([key, phrase]) => (
              <SelectItem key={key} value={key}>
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium capitalize">{key}</span>
                  <span className="text-muted-foreground text-xs leading-snug">{phrase}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* ── Scene context (collapsible) ──────────────────────────────── */}
      <SectionHeader label="Scene context" open={contextOpen} onToggle={() => setContextOpen((v) => !v)} />
      <AnimatePresence initial={false}>
        {contextOpen && (
          <motion.div
            key="scene-context"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sectionVariants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="space-y-5"
          >
            {/* Handoff setting */}
            <div className="space-y-2">
              <Label htmlFor="handoff" className="text-sm">Music / sound design balance</Label>
              <Select value={handoffSetting} onValueChange={(v) => v && setHandoffSetting(v)}>
                <SelectTrigger id="handoff" className="w-full">
                  <SelectValue placeholder="How does score relate to sound design? (optional)">
                    {handoffLabel(handoffSetting) || undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full">
                  {handoffSelectOptions.map(({ value, label, description }) => (
                    <SelectItem key={value} value={value}>
                      <span className="flex flex-col gap-0.5">
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-foreground text-xs leading-snug">{description}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Diegetic status */}
            <div className="space-y-2">
              <Label htmlFor="diegetic" className="text-sm">Is the music diegetic?</Label>
              <Select value={diegeticStatus} onValueChange={(v) => v && setDiegeticStatus(v)}>
                <SelectTrigger id="diegetic" className="w-full">
                  <SelectValue placeholder="Source or score? (optional)">
                    {diegeticLabel(diegeticStatus) || undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full">
                  {diegeticSelectOptions.map(({ value, label, description }) => (
                    <SelectItem key={value} value={value}>
                      <span className="flex flex-col gap-0.5">
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-foreground text-xs leading-snug">{description}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Frequency note */}
            <div className="space-y-2">
              <Label htmlFor="frequency-note" className="text-sm">
                How often does the music appear?{' '}
                <span className="text-muted-foreground font-normal">(for composer brief only)</span>
              </Label>
              <Textarea
                id="frequency-note"
                placeholder="e.g. 'Enters only when she looks at the photo. Gone by the time he speaks.'"
                value={frequencyNote}
                onChange={(e) => setFrequencyNote(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Separator />

      {/* ── Audio generation controls (collapsible) ──────────────────── */}
      <SectionHeader label="Audio generation" open={audioOpen} onToggle={() => setAudioOpen((v) => !v)} />
      <AnimatePresence initial={false}>
        {audioOpen && (
          <motion.div
            key="audio-generation"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sectionVariants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="space-y-5"
          >
            {/* Format */}
            <div className="space-y-2">
              <Label className="text-sm">Format</Label>
              <div className="flex flex-wrap gap-1.5">
                {FORMAT_OPTIONS.map(({ value, label }) => (
                  <motion.button
                    key={value}
                    onClick={() => setFormatTag(value)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border transition-colors',
                      formatTag === value
                        ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_-2px] shadow-primary/40'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    )}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Target BPM */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center justify-between">
                <span>Target BPM</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {targetBpm ?? suggestedBpm ?? '—'}
                  {!targetBpm && suggestedBpm && ' (auto)'}
                </span>
              </Label>
              <Slider
                min={30}
                max={200}
                step={1}
                value={[targetBpm ?? suggestedBpm ?? 80]}
                onValueChange={([v]) => setTargetBpm(v)}
                className="w-full"
              />
              {targetBpm && (
                <button
                  onClick={() => setTargetBpm(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reset to auto ({suggestedBpm ?? 'none'})
                </button>
              )}
            </div>

            {/* Key signature */}
            <div className="space-y-2">
              <Label htmlFor="key-signature" className="text-sm">Key signature</Label>
              <Select value={keySignature} onValueChange={(v) => v && setKeySignature(v)}>
                <SelectTrigger id="key-signature" className="w-full">
                  <SelectValue placeholder="Let AI decide (optional)">
                    {keySignature || undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full">
                  {KEY_SIGNATURES.map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {keySignature && (
                <button
                  onClick={() => setKeySignature('')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear (let AI decide)
                </button>
              )}
            </div>

            {/* Featured instruments */}
            <div className="space-y-2">
              <Label htmlFor="featured-instruments" className="text-sm">
                Featured instruments{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="featured-instruments"
                placeholder="e.g. solo cello, prepared piano, muted trumpet"
                value={featuredInstruments}
                onChange={(e) => setFeaturedInstruments(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Specific instrument names produce better results than generic descriptions.
              </p>
            </div>

            {/* Recording quality */}
            <div className="space-y-2">
              <Label htmlFor="recording-quality" className="text-sm">Recording quality</Label>
              <Select value={recordingQuality} onValueChange={(v) => v && setRecordingQuality(v)}>
                <SelectTrigger id="recording-quality" className="w-full">
                  <SelectValue placeholder="Pristine studio (default)">
                    {QUALITY_LABELS[recordingQuality] ?? undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full">
                  {QUALITY_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      <span className="flex flex-col gap-0.5">
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-foreground text-xs leading-snug">
                          {RECORDING_QUALITY_PHRASES[value]}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Working title */}
            <div className="space-y-2">
              <Label htmlFor="working-title" className="text-sm">
                Working title{' '}
                <span className="text-muted-foreground font-normal">(optional — improves musicality)</span>
              </Label>
              <Input
                id="working-title"
                placeholder={`e.g. "${sceneLabel}" or a short evocative phrase`}
                value={workingTitle}
                onChange={(e) => setWorkingTitle(e.target.value)}
                className="text-sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Separator />

      {/* ── Director's voice / negative space (collapsible) ──────────── */}
      <SectionHeader label="Director's voice" open={negativeOpen} onToggle={() => setNegativeOpen((v) => !v)} />
      <AnimatePresence initial={false}>
        {negativeOpen && (
          <motion.div
            key="directors-voice"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sectionVariants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="space-y-5"
          >
            {/* Director words */}
            <div className="space-y-2">
              <Label htmlFor="director-words" className="text-sm">
                In your own words{' '}
                <span className="text-muted-foreground font-normal">(feeds into AI prompt)</span>
              </Label>
              <Textarea
                id="director-words"
                placeholder="What does this moment feel like? Don't censor — just describe it."
                value={directorWords}
                onChange={(e) => setDirectorWords(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* What would be wrong */}
            <div className="space-y-2">
              <Label htmlFor="wrong" className="text-sm">
                What music would be <em>wrong</em> for this scene?
              </Label>
              <Textarea
                id="wrong"
                placeholder="e.g. 'Anything that tells the audience how to feel.'"
                value={whatWouldBeWrong}
                onChange={(e) => setWhatWouldBeWrong(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Musical spec preview */}
      {atmospheres.length > 0 && (
        <div className="rounded-lg bg-secondary/40 border border-border border-l-2 border-l-primary p-4">
          <button
            onClick={() => setShowPromptPreview((v) => !v)}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground w-full mb-1"
          >
            <Zap className="h-3.5 w-3.5 text-primary" />
            Generated musical spec
            {showPromptPreview ? (
              <ChevronUp className="h-3.5 w-3.5 ml-auto" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-auto" />
            )}
          </button>

          <div className="mt-3 space-y-1.5">
            {Object.entries(musicalSpec).map(([key, val]) => (
              <div key={key} className="text-xs">
                <span className="text-muted-foreground mr-2">{key}:</span>
                <span>{Array.isArray(val) ? val.join(', ') : val}</span>
              </div>
            ))}
          </div>

          {showPromptPreview && (
            <>
              <Separator className="my-3" />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Positive prompt (sent to AI model)</p>
                <p className="text-xs leading-relaxed text-foreground/80 bg-background/50 p-2.5 rounded border border-border font-mono">
                  {promptPreview.positivePrompt}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-2">Negative prompt</p>
                <p className="text-xs leading-relaxed text-foreground/60 bg-background/50 p-2.5 rounded border border-border font-mono">
                  {promptPreview.negativePrompt}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={saving || isPending || !atmospheres.length}
        className={cn(
          'w-full',
          atmospheres.length > 0 && !saving && !isPending && 'shadow-[0_0_12px_-3px] shadow-primary/25'
        )}
      >
        {saving ? 'Saving intent…' : 'Save intent'}
      </Button>

      {initialIntent && (
        <p className="text-xs text-center text-muted-foreground">
          Current intent: v{initialIntent.version_number} — saving creates a new version
        </p>
      )}
    </div>
  )
}
