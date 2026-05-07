export const dynamic = 'force-dynamic'

import { Fragment } from 'react'
import { notFound } from 'next/navigation'
import { getMockCue, getIntent, getSceneCard, getProject } from '@/lib/store'
import { getFileUrl } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import BriefUtilityRibbon from '@/components/generation/BriefUtilityRibbon'
import BriefSheetPlayer from '@/components/generation/BriefSheetPlayer'
import BriefReceipt from '@/components/generation/BriefReceipt'
import { LeitmotifWorld } from '@/components/landing/LeitmotifWorld'
import {
  atmosphereLabel,
  diegeticLabel,
  handoffLabel,
  narrativeFunctionLabel,
  recordingQualityLabel,
} from '@/lib/prompts/intentDisplay'

function formatBriefDuration(sec: number | null): string {
  if (!sec || !Number.isFinite(sec)) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}′ ${String(s).padStart(2, '0')}″`
}

function formatFiledLine(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return '—'
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
  return `Filed ${date} · ${time}`
}

function formatFiledShort(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatFiledTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
}

function projectAcronym(title: string | undefined): string {
  if (!title) return 'LM'
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  return initials || 'LM'
}

const DENSITY_ORDER = ['silence', 'sparse', 'textural', 'melodic', 'layered', 'saturated']

function densityPip(value: string | null): { idx: number; label: string; em: string } | null {
  if (!value) return null
  const i = DENSITY_ORDER.indexOf(value)
  if (i < 0) return null
  // Map 6 values to 5 positions (0..4).
  const idx = Math.round((i * 4) / (DENSITY_ORDER.length - 1))
  const labels: Record<string, [string, string]> = {
    silence: ['Silence', 'near-silence, breath only'],
    sparse: ['Spare', 'fewer voices, more air'],
    textural: ['Textural', 'atmosphere without melody'],
    melodic: ['Melodic', 'one voice carries it'],
    layered: ['Layered', 'multiple voices, articulated'],
    saturated: ['Saturated', 'fully voiced, no daylight'],
  }
  const [label, em] = labels[value] || [value, '']
  return { idx, label, em }
}

function handoffPip(value: string | null): { idx: number; label: string; em: string } | null {
  if (!value) return null
  // 0 = lean to score; 4 = lean to sound.
  const map: Record<string, [number, string, string]> = {
    score_forward: [0, 'Lean to score', 'music leads'],
    equal_negotiated: [2, 'Negotiated', 'equal — clearly delineated'],
    diegetic_transition: [3, 'Source bleeding', 'diegetic into score'],
    sound_forward: [4, 'Lean to sound', 'let design carry'],
    no_music: [4, 'No music', 'silence is the decision'],
  }
  const m = map[value]
  if (!m) return null
  return { idx: m[0], label: m[1], em: m[2] }
}

function diegesisPip(value: string | null): { idx: number; label: string; em: string } | null {
  if (!value) return null
  const map: Record<string, [number, string, string]> = {
    diegetic: [0, 'Diegetic', 'in-room source'],
    meta_diegetic: [1, 'Meta-diegetic', 'inside her head'],
    ambiguous: [2, 'Source into score', 'blurred line'],
    non_diegetic: [4, 'Non-diegetic', 'pure score'],
  }
  const m = map[value]
  if (!m) return null
  return { idx: m[0], label: m[1], em: m[2] }
}

function Dial({ idx, label, em }: { idx: number; label: string; em: string }) {
  const cells = []
  for (let i = 0; i < 5; i++) {
    cells.push(<span key={`n${i}a`} className="notch" />)
    cells.push(<span key={`p${i}`} className={`pip${idx === i ? ' on' : ''}`} aria-hidden />)
  }
  cells.push(<span key="n-tail" className="notch" />)
  return (
    <span className="bd-dial" aria-label={`${label}: ${em}`}>
      {cells}
      <span className="label">{label}{em && (<> · <em>{em}</em></>)}</span>
    </span>
  )
}

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

  const approver = cue.approved_by
    ? await prisma.profile.findUnique({
        where: { id: cue.approved_by },
        select: { name: true, email: true },
      })
    : null

  // Whoever marked the cue as scored — surfaced in the receipt's score
  // panel as "Scored {date} · by {name}".
  const scorer = cue.scored_by
    ? await prisma.profile.findUnique({
        where: { id: cue.scored_by },
        select: { name: true, email: true },
      })
    : null
  const scoredByDisplay = scorer?.name?.trim() || scorer?.email?.split('@')[0] || null

  // Find a designated composer (or sound designer) project member for the
  // "To" addressing. Anonymous public viewers see the generic line.
  const composerMember = project
    ? await prisma.projectMember.findFirst({
        where: {
          project_id: project.id,
          accepted_at: { not: null },
          role_on_project: { in: ['composer', 'sound_designer'] },
        },
        select: {
          role_on_project: true,
          profile: { select: { name: true, email: true } },
        },
      })
    : null

  const reel = scene
    ? await prisma.reel.findUnique({
        where: { id: scene.reel_id },
        select: { name: true, cue_position: true },
      })
    : null

  const audioUrl = getFileUrl(cue.file_key)
  const videoUrl = scene?.video_file_key ? getFileUrl(scene.video_file_key) : null
  const isVideo = Boolean(videoUrl && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(videoUrl))
  // Poster takes precedence over the placeholder when no video is set; when
  // both exist, the video stays primary and the poster falls in via `<video
  // poster=…>` so the first frame paints instantly even on slow networks.
  const posterUrl = scene?.poster_file_key ? getFileUrl(scene.poster_file_key) : null

  const productionAcronym = projectAcronym(project?.title)
  const cueRefShort = scene?.cue_number?.trim() || `v${cue.version_number}`
  const fileTag = `Brief · ${productionAcronym}-${cueRefShort}`

  const briefTitle = intent?.working_title?.trim() || scene?.label?.trim() || 'Untitled cue'

  const reelLabel = reel?.name?.trim() || (reel?.cue_position != null ? `Reel ${reel.cue_position}` : '—')
  const reelMetaValue = reel?.cue_position != null ? String(reel.cue_position) : (reel?.name?.trim() || '—')

  const directorName = approver?.name?.trim() || approver?.email || 'Pending'
  const directorRole = project ? `Director · ${project.title}` : 'Director'

  const composerName =
    composerMember?.profile?.name?.trim() || composerMember?.profile?.email || 'Composer'
  const composerRole = composerMember?.role_on_project === 'sound_designer'
    ? 'Sound design · contracted'
    : 'Composer · contracted'

  // Atmosphere chips: first → ember, rest plain. Function chips dashed.
  const atmosphereChips = (intent?.emotional_atmospheres ?? []).map((key, i) => ({
    key,
    label: atmosphereLabel(key),
    ember: i === 0,
  }))
  const functionChips: string[] = []
  if (intent?.narrative_function) {
    functionChips.push(narrativeFunctionLabel(intent.narrative_function))
  }

  // Spec rows
  type SpecRow = { label: string; value: string }
  const specRows: SpecRow[] = []
  if (intent?.spec_tempo_range) specRows.push({ label: 'Tempo', value: intent.spec_tempo_range })
  else if (intent?.target_bpm) specRows.push({ label: 'Tempo', value: `${intent.target_bpm} bpm` })
  if (intent?.key_signature) specRows.push({ label: 'Key', value: intent.key_signature })
  if (intent?.spec_harmonic_character) specRows.push({ label: 'Harmony', value: intent.spec_harmonic_character })
  if (intent?.spec_register) specRows.push({ label: 'Register', value: intent.spec_register })
  if (intent?.spec_dynamics) specRows.push({ label: 'Dynamics', value: intent.spec_dynamics })
  if (intent?.spec_rhythm) specRows.push({ label: 'Rhythm', value: intent.spec_rhythm })
  if (intent?.featured_instruments) specRows.push({ label: 'Timbre', value: intent.featured_instruments })
  else if (intent?.spec_instrumentation) specRows.push({ label: 'Timbre', value: intent.spec_instrumentation })
  if (intent?.recording_quality) specRows.push({ label: 'Quality', value: recordingQualityLabel(intent.recording_quality) })

  const excludeItems = intent?.spec_do_not_use ?? []

  const density = densityPip(intent?.density ?? null)
  const handoff = handoffPip(intent?.handoff_setting ?? null)
  const diegesis = diegesisPip(intent?.diegetic_status ?? null)
  const hasNotations = Boolean(density || handoff || diegesis)

  // Diegesis label fallback for chips when no dial info applies.
  const diegesisChip = !diegesis && intent?.diegetic_status ? diegeticLabel(intent.diegetic_status) : null
  const handoffChip = !handoff && intent?.handoff_setting ? handoffLabel(intent.handoff_setting) : null

  const filedAtIso = cue.approved_at ?? cue.created_at
  const filedShort = formatFiledShort(filedAtIso)
  const filedTime = formatFiledTime(filedAtIso)
  const filedLine = formatFiledLine(filedAtIso)

  return (
    <LeitmotifWorld>
      <div className="brief-doc-page">
        <BriefUtilityRibbon fileTag={fileTag} />

        <div className="brief-doc-stage">
          <article className="brief-doc" aria-label={`Composer brief, cue ${cueRefShort}`}>
            <div className="bd-folio">
              <div className="L">{`Composer brief · ${fileTag.replace(/^Brief · /, '')}`}</div>
              <div className="C">
                <span className="perf" aria-hidden />
                Leitmotif
              </div>
              <div className="R">{filedLine}</div>
            </div>

            <header className="bd-head">
              <div className="from">
                From
                <span className="name">{directorName}</span>
                <span>{directorRole}</span>
              </div>
              <div className="title-block">
                <div className="eyebrow">{`Cue brief · ${cueRefShort}`}</div>
                <h1>{briefTitle}</h1>
                <div className="ref">
                  <span>{reelLabel}</span>
                  <span className="sep">·</span>
                  <span>{`Cue ${cueRefShort}`}</span>
                  {scene?.picture_version_label?.trim() && (
                    <>
                      <span className="sep">·</span>
                      <span>{scene.picture_version_label.trim()}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="to">
                To
                <span className="name">{composerName}</span>
                <span>{composerRole}</span>
              </div>
            </header>

            <div className="bd-meta">
              <div>Production <strong>{project?.title ?? '—'}</strong></div>
              <div>Reel <strong>{reelMetaValue}</strong></div>
              <div>TC In <strong>{scene?.tc_in_smpte || '—'}</strong></div>
              <div>TC Out <strong>{scene?.tc_out_smpte || '—'}</strong></div>
              <div>Length <strong>{formatBriefDuration(cue.duration_sec)}</strong></div>
            </div>

            <section className="bd-picture">
              <div className="bd-frame" aria-label="Scene reference frame">
                <div className="perf-strip left" aria-hidden />
                <div className="perf-strip right" aria-hidden />
                {videoUrl && isVideo ? (
                  <video
                    src={videoUrl}
                    poster={posterUrl ?? undefined}
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : videoUrl ? (
                  // Non-video upload (image / unknown) — render via <img>; falls back if it errors.
                  // Next/Image isn't used here because the file is served by /api/files and we don't
                  // want optimization on potentially-private cuts.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={videoUrl} alt={`Scene reference for cue ${cueRefShort}`} />
                ) : posterUrl ? (
                  // No video clip but a stripped frame exists — render it as the still reference.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={posterUrl} alt={`Scene reference for cue ${cueRefShort}`} />
                ) : (
                  <div className="placeholder">
                    <div>
                      Scene reference
                      <small>{`${cueRefShort} · ${formatBriefDuration(cue.duration_sec)}`}</small>
                    </div>
                  </div>
                )}
                {(scene?.tc_in_smpte || scene?.tc_out_smpte) && (
                  <div className="tc-overlay">
                    <span className="tag">{`IN  ${scene?.tc_in_smpte || '—'}`}</span>
                    <span className="tag">{`OUT ${scene?.tc_out_smpte || '—'}`}</span>
                  </div>
                )}
              </div>
              <div className="bd-scene-card">
                <div>
                  <div className="label">Scene</div>
                  <div className="scene">{scene?.label ?? 'Untitled scene'}</div>
                </div>
                <div className="specs">
                  {scene?.picture_version_label?.trim() && (
                    <div><span className="k">Picture</span> {scene.picture_version_label.trim()}</div>
                  )}
                  <div><span className="k">Cue №</span> {cueRefShort}</div>
                  {scene?.tc_in_smpte && (
                    <div><span className="k">In</span> {scene.tc_in_smpte}</div>
                  )}
                  {scene?.tc_out_smpte && (
                    <div><span className="k">Out</span> {scene.tc_out_smpte}</div>
                  )}
                </div>
              </div>
            </section>

            <section className="bd-body">
              <div className="bd-col left">
                {intent?.director_words?.trim() && (
                  <section className="bd-field">
                    <h5><span className="num">i.</span> In their own words</h5>
                    <p className="bd-direction">
                      {intent.director_words.trim()}
                      <span className="attr">— {directorName}, in spotting</span>
                    </p>
                  </section>
                )}

                {atmosphereChips.length > 0 && (
                  <section className="bd-field">
                    <h5><span className="num">ii.</span> Atmosphere</h5>
                    <ul className="bd-tags" aria-label="Atmosphere tags">
                      {atmosphereChips.map((c) => (
                        <li key={c.key} className={c.ember ? 'ember' : undefined}>
                          {c.label}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {(functionChips.length > 0 || diegesisChip || handoffChip) && (
                  <section className="bd-field">
                    <h5><span className="num">iii.</span> Narrative function</h5>
                    <ul className="bd-tags" aria-label="Function tags">
                      {functionChips.map((label) => (
                        <li key={label} className="fn">{label}</li>
                      ))}
                      {diegesisChip && <li key="dieg" className="fn">{diegesisChip}</li>}
                      {handoffChip && <li key="hand" className="fn">{handoffChip}</li>}
                    </ul>
                  </section>
                )}

                {hasNotations && (
                  <section className="bd-field">
                    <h5><span className="num">iv.</span> Density · balance · diegesis</h5>
                    <div className="bd-notations">
                      {density && (
                        <div className="row">
                          <span className="k">Density</span>
                          <Dial idx={density.idx} label={density.label} em={density.em} />
                        </div>
                      )}
                      {handoff && (
                        <div className="row">
                          <span className="k">Score / sound</span>
                          <Dial idx={handoff.idx} label={handoff.label} em={handoff.em} />
                        </div>
                      )}
                      {diegesis && (
                        <div className="row">
                          <span className="k">Diegesis</span>
                          <Dial idx={diegesis.idx} label={diegesis.label} em={diegesis.em} />
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {intent?.frequency_note?.trim() && (
                  <section className="bd-field">
                    <h5><span className="num">v.</span> Recurrence</h5>
                    <div className="bd-recurrence">
                      <span className="glyph">𝄋</span>
                      <div>
                        {intent.frequency_note.trim()}
                        <small>Motif marker</small>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              <div className="bd-col right">
                {specRows.length > 0 && (
                  <section className="bd-field">
                    <h5><span className="num">vi.</span> Musical specification</h5>
                    <dl className="bd-spec">
                      {specRows.map((row) => (
                        <Fragment key={row.label}>
                          <dt>{row.label}</dt>
                          <dd>{row.value}</dd>
                        </Fragment>
                      ))}
                      {excludeItems.length > 0 && (
                        <>
                          <dt>Exclude</dt>
                          <dd className="exclude">
                            {excludeItems.map((x, i) => (
                              <Fragment key={x}>
                                <span>{x}</span>
                                {i < excludeItems.length - 1 && <span className="sep"> · </span>}
                              </Fragment>
                            ))}
                          </dd>
                        </>
                      )}
                    </dl>
                  </section>
                )}

                {intent?.what_would_be_wrong?.trim() && (
                  <section className="bd-field">
                    <p className="bd-anno">
                      Margin note — {intent.what_would_be_wrong.trim()}
                    </p>
                  </section>
                )}
              </div>
            </section>

            <section className="bd-cue-block" aria-label="Reference cue">
              <div className="cap">
                <span><span className="num">vii.</span> Reference cue · mock</span>
                <em>not final music</em>
              </div>
              <h3>{`${cueRefShort} / ${briefTitle} — sketch v${cue.version_number}`}</h3>

              <BriefSheetPlayer src={audioUrl} durationHint={cue.duration_sec} />

              <div className="bd-cue-foot">
                <div className="L">
                  <span className="k">Generated</span>
                  <span className="v">{filedShort}{filedTime ? ` · ${filedTime}` : ''}</span>
                </div>
                <div className="R">
                  <span className="k">Source</span>
                  <span className="v">AI mock cue · v{cue.version_number}</span>
                </div>
              </div>

              <p className="bd-disclaimer">
                Reference cue, not final music. AI-generated to communicate emotional intent —
                treat as directorial guidance, not a creative template.
              </p>
            </section>

            <footer className="bd-sign">
              <div>
                Director
                <span>{directorName}</span>
                {approver?.email && <small>{approver.email}</small>}
              </div>
              <div>
                {composerMember?.role_on_project === 'sound_designer' ? 'Sound design' : 'Composer'}
                <span>{composerName}</span>
                <small>{cue.composer_acknowledged ? 'received' : 'awaiting acknowledgement'}</small>
              </div>
              <div>
                Filed
                <span>{filedShort}</span>
                <small>{filedTime ? `${filedTime} · approved by director` : 'approved by director'}</small>
              </div>
            </footer>

            <div className="bd-perf-divider" aria-hidden>
              <span className="label">
                <span className="scissor">✂</span>
                Detach &amp; return
              </span>
            </div>

            <BriefReceipt
              cueId={cue.id}
              cueRef={cueRefShort}
              fileTag={fileTag.replace(/^Brief · /, '')}
              alreadyAcknowledged={cue.composer_acknowledged}
              existingNotes={cue.composer_notes}
              existingSignedName={cue.composer_signed_name}
              existingSignedInitials={cue.composer_signed_initials}
              acknowledgedAt={cue.composer_acknowledged_at}
              existingScoredAt={cue.scored_at}
              existingScoredByName={scoredByDisplay}
            />

            <div className="bd-colophon">
              <div className="L">Set in Cormorant Garamond &amp; JetBrains Mono</div>
              <div className="C">Leitmotif · a vocabulary bridge</div>
              <div className="R">{`brief · ${productionAcronym}-${cueRefShort}`}</div>
            </div>
          </article>
        </div>
      </div>
    </LeitmotifWorld>
  )
}
