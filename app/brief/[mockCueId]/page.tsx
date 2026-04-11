export const dynamic = 'force-dynamic'

import { getMockCue, getIntent, getSceneCard, getProject } from '@/lib/store'
import { notFound } from 'next/navigation'
import { getFileUrl } from '@/lib/storage'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import MockCuePlayerStatic from '@/components/generation/MockCuePlayerStatic'
import PrintBriefButton from '@/components/generation/PrintBriefButton'
import ComposerAcknowledge from '@/components/generation/ComposerAcknowledge'
import { Music2, AlertTriangle } from 'lucide-react'
import {
  atmosphereLabel,
  diegeticLabel,
  handoffLabel,
  narrativeFunctionLabel,
  recordingQualityLabel,
} from '@/lib/prompts/intentDisplay'
import { RECORDING_QUALITY_PHRASES } from '@/lib/prompts/taxonomy'

export default async function BriefPage({
  params,
}: {
  params: Promise<{ mockCueId: string }>
}) {
  const { mockCueId } = await params

  const cue = await getMockCue(mockCueId)
  if (!cue || !cue.is_approved) notFound()

  const intent = await getIntent(cue.intent_version_id)
  const scene = await getSceneCard(cue.scene_card_id)
  const project = scene ? await getProject(scene.project_id) : undefined

  const audioUrl = getFileUrl(cue.file_key)

  const recordingDetail =
    intent?.recording_quality && RECORDING_QUALITY_PHRASES[intent.recording_quality]
      ? RECORDING_QUALITY_PHRASES[intent.recording_quality]
      : null

  const specRows: { label: string; value: string }[] = []
  if (intent?.spec_tempo_range) specRows.push({ label: 'Tempo', value: intent.spec_tempo_range })
  if (intent?.spec_harmonic_character) specRows.push({ label: 'Harmonic character', value: intent.spec_harmonic_character })
  if (intent?.spec_register) specRows.push({ label: 'Register', value: intent.spec_register })
  if (intent?.spec_dynamics) specRows.push({ label: 'Dynamics', value: intent.spec_dynamics })
  if (intent?.spec_rhythm) specRows.push({ label: 'Rhythm', value: intent.spec_rhythm })
  if (intent?.spec_do_not_use?.length) specRows.push({ label: 'Do not use', value: intent.spec_do_not_use.join(', ') })

  return (
    <div className="min-h-screen bg-background">
      {/* Brief header bar */}
      <header className="border-b border-border bg-card/50 print:hidden">
        <div className="max-w-2xl mx-auto px-6 h-11 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Music2 className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">Leitmotif</span>
            <span className="text-muted-foreground/40">·</span>
            <span>Composer Brief</span>
          </div>
          <PrintBriefButton />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Title block */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{scene?.label ?? 'Scene'}</h1>
            {project && (
              <p className="text-sm text-muted-foreground mt-1">{project.title}</p>
            )}
          </div>
          <div className="shrink-0">
            {cue.is_approved ? (
              <Badge className="text-xs">Approved</Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Draft</Badge>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-6 print:hidden">
          This page is a shareable link — Leitmotif does not email composers automatically yet. The
          director shares this URL with you.
        </p>

        {/* Mock cue disclaimer */}
        <div className="flex gap-3 rounded-lg border border-yellow-600/30 bg-yellow-950/20 p-3.5 mb-6 text-sm text-yellow-200/80 print:hidden">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-500" />
          <div>
            <strong className="text-yellow-400">Reference mock cue — not final music.</strong>{' '}
            The audio below is AI-generated to communicate emotional intent only.
            Please use it as a directorial guide, not a creative template.
          </div>
        </div>

        {/* Audio player */}
        <div className="mb-8">
          <MockCuePlayerStatic src={audioUrl} label={cue.file_name} />
        </div>

        <Separator className="mb-8" />

        {/* Scene info */}
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">Scene</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {scene?.cue_number && <InfoRow label="Cue number" value={scene.cue_number} />}
            {scene?.tc_in_smpte && <InfoRow label="TC in" value={scene.tc_in_smpte} />}
            {scene?.tc_out_smpte && <InfoRow label="TC out" value={scene.tc_out_smpte} />}
            {cue.duration_sec ? (
              <InfoRow label="Duration" value={`${cue.duration_sec}s`} />
            ) : null}
          </div>
        </section>

        {intent && (
          <>
            <Separator className="mb-8" />

            {/* Director intent */}
            <section className="mb-8">
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">
                Director&apos;s intent
              </h2>
              <div className="space-y-4">
                {intent.working_title && (
                  <InfoRow label="Working title" value={intent.working_title} capitalize={false} />
                )}
                {intent.emotional_atmospheres?.length > 0 && (
                  <InfoRow label="Emotional atmosphere">
                    <div className="flex flex-wrap gap-1.5">
                      {intent.emotional_atmospheres.map((a) => (
                        <Badge key={a} variant="secondary" className="text-xs font-normal">
                          {atmosphereLabel(a)}
                        </Badge>
                      ))}
                    </div>
                  </InfoRow>
                )}
                {intent.narrative_function && (
                  <InfoRow
                    label="Narrative function"
                    value={narrativeFunctionLabel(intent.narrative_function)}
                  />
                )}
                {intent.density && (
                  <InfoRow label="Music density" value={intent.density} />
                )}
                {intent.handoff_setting && (
                  <InfoRow label="Score / sound design balance" value={handoffLabel(intent.handoff_setting)} />
                )}
                {intent.diegetic_status && (
                  <InfoRow label="Diegetic status" value={diegeticLabel(intent.diegetic_status)} />
                )}
                {intent.format_tag && (
                  <InfoRow label="Format" value={intent.format_tag} capitalize={false} />
                )}
                {intent.target_bpm != null && intent.target_bpm > 0 && (
                  <InfoRow label="Target BPM" value={String(intent.target_bpm)} capitalize={false} />
                )}
                {intent.key_signature && (
                  <InfoRow label="Key signature" value={intent.key_signature} capitalize={false} />
                )}
                {intent.featured_instruments && (
                  <InfoRow
                    label="Featured instruments"
                    value={intent.featured_instruments}
                    capitalize={false}
                  />
                )}
                {intent.recording_quality && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Recording quality</p>
                    <p className="font-medium text-sm">{recordingQualityLabel(intent.recording_quality)}</p>
                    {recordingDetail && (
                      <p className="text-xs text-muted-foreground mt-1">{recordingDetail}</p>
                    )}
                  </div>
                )}
                {intent.frequency_note && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">How often music appears</p>
                    <p className="text-sm leading-relaxed">{intent.frequency_note}</p>
                  </div>
                )}
                {intent.director_words && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">In the director&apos;s words</p>
                    <p className="text-sm italic leading-relaxed">&ldquo;{intent.director_words}&rdquo;</p>
                  </div>
                )}
                {intent.what_would_be_wrong && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">What would be wrong</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {intent.what_would_be_wrong}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Musical spec — alternating row table */}
            {specRows.length > 0 && (
              <>
                <Separator className="mb-8" />
                <section className="mb-8">
                  <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">
                    Musical specification
                  </h2>
                  <div className="rounded-lg border border-border overflow-hidden">
                    {specRows.map((row, i) => (
                      <div
                        key={row.label}
                        className={`flex gap-4 px-4 py-2.5 text-sm ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}
                      >
                        <span className="text-muted-foreground w-40 shrink-0 text-xs pt-0.5">{row.label}</span>
                        <span className="text-foreground/90 leading-relaxed">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {(intent.positive_prompt || intent.negative_prompt) && (
              <>
                <Separator className="mb-8" />
                <section className="mb-8 print:break-inside-avoid">
                  <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">
                    Model prompts (reference)
                  </h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    Exact strings used for the mock-cue generator. Your final score is not bound to
                    these tokens.
                  </p>
                  {intent.positive_prompt && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Positive</p>
                      <pre className="text-xs whitespace-pre-wrap break-words rounded-md border border-border bg-muted/40 p-3 font-mono">
                        {intent.positive_prompt}
                      </pre>
                    </div>
                  )}
                  {intent.negative_prompt && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Negative</p>
                      <pre className="text-xs whitespace-pre-wrap break-words rounded-md border border-border bg-muted/40 p-3 font-mono">
                        {intent.negative_prompt}
                      </pre>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}

        <Separator className="mb-8" />

        {/* Composer acknowledgement */}
        <ComposerAcknowledge
          cueId={cue.id}
          alreadyAcknowledged={cue.composer_acknowledged}
          existingNotes={cue.composer_notes}
          acknowledgedAt={cue.composer_acknowledged_at}
        />

        <Separator className="mb-6 mt-8" />
        <p className="text-xs text-center text-muted-foreground">
          Generated by Leitmotif · {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  children,
  capitalize = true,
}: {
  label: string
  value?: string
  children?: React.ReactNode
  capitalize?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      {value ? (
        <p className={`font-medium text-sm ${capitalize ? 'capitalize' : ''}`}>{value}</p>
      ) : (
        children
      )}
    </div>
  )
}
