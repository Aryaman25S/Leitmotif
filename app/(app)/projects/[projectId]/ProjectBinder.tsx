'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { BinderData, BinderReel, BinderScene } from '@/lib/store'
import AddCueDialog from '@/components/generation/AddCueDialog'
import AddReelDialog from '@/components/generation/AddReelDialog'
import {
  STATUS_META,
  autoMarginNote,
  durationFromSmpte,
  formatLabel,
  formatVideoDuration,
  lastTouchedLabel,
  reelAttentionCount,
  reelDisplayName,
  reelSmpteRange,
  rowEnterLabel,
  runtimeDisplay,
  standingItems,
} from './lib'
import { initialsOf } from '@/app/(app)/projects/lib'
import s from './binder.module.css'

interface CollaboratorMember {
  user_id: string | null
  role: string
  name: string | null
  email: string
}

export interface ProjectBinderProps {
  projectId: string
  projectTitle: string
  format: string
  toneBrief: string | null
  runtimeMinutes: number | null
  slate: string | null
  era: string | null
  ownerName: string | null
  ownerEmail: string
  ownerRole: 'owner'
  viewer: { name: string | null; email: string }
  members: CollaboratorMember[]
  binder: BinderData
  canDirect: boolean
  canApprove: boolean
}

export default function ProjectBinder(props: ProjectBinderProps) {
  const {
    projectId, projectTitle, format, toneBrief, runtimeMinutes, slate, era,
    ownerName, ownerEmail, members, binder, canDirect, canApprove,
  } = props

  const reelsWithScenes = binder.reels
  const firstReel = reelsWithScenes[0]?.id ?? null
  const [activeReel, setActiveReel] = useState<string | null>(firstReel)

  // Dialog state — `addCueReelId` opens the cue dialog scoped to a specific reel.
  const [addCueReelId, setAddCueReelId] = useState<string | null>(null)
  const [addReelOpen, setAddReelOpen] = useState(false)

  // Approval count is what drives "for your eye" prominence — only directors
  // and music supervisors can act on it; everyone else sees "with composer"
  // in their face instead.
  const attentionCount = canApprove ? binder.standing.for_approval : 0
  const standing = standingItems(binder.standing, attentionCount)

  const totalCues = binder.scenes.length
  const reelCount = reelsWithScenes.length

  const addCueReel = addCueReelId ? reelsWithScenes.find((r) => r.id === addCueReelId) ?? null : null
  const addCueReelName = addCueReel
    ? reelDisplayName(addCueReel.name, addCueReel.cue_position)
    : null
  const addCueReelTitle = addCueReelName
    ? (addCueReelName.subtitle ? `${addCueReelName.positional} — ${addCueReelName.subtitle}` : addCueReelName.positional)
    : ''

  return (
    <div className={s.body}>
      <ReelRail
        reels={reelsWithScenes}
        activeReel={activeReel}
        onSelect={setActiveReel}
        canDirect={canDirect}
        onAddReel={() => setAddReelOpen(true)}
        owner={{ name: ownerName, email: ownerEmail }}
        viewerEmail={props.viewer.email}
        members={members}
      />

      <main className={s.main}>
        <ProductionHead
          projectId={projectId}
          title={projectTitle}
          format={format}
          slate={slate}
          runtimeMinutes={runtimeMinutes}
          era={era}
          toneBrief={toneBrief}
          standing={standing}
          canDirect={canDirect}
        />

        {totalCues === 0 ? (
          <BinderEmpty
            projectTitle={projectTitle}
            canDirect={canDirect}
            firstReelId={firstReel}
            onSpot={() => firstReel && setAddCueReelId(firstReel)}
          />
        ) : (
          <CueBinder
            reels={reelsWithScenes}
            projectId={projectId}
            totalCues={totalCues}
            reelCount={reelCount}
            canDirect={canDirect}
            onAddCueToReel={(reelId) => setAddCueReelId(reelId)}
            onAddReel={() => setAddReelOpen(true)}
          />
        )}
      </main>

      {addCueReel && (
        <AddCueDialog
          projectId={projectId}
          reelId={addCueReel.id}
          reelDisplayName={addCueReelTitle}
          sceneCount={addCueReel.scenes.length}
          open={addCueReelId !== null}
          onOpenChange={(o) => setAddCueReelId(o ? addCueReel.id : null)}
        />
      )}

      <AddReelDialog
        projectId={projectId}
        nextPositionHint={(reelsWithScenes[reelsWithScenes.length - 1]?.cue_position ?? 0) + 1}
        open={addReelOpen}
        onOpenChange={setAddReelOpen}
      />
    </div>
  )
}

// ——————————————————————————————————————————

function ReelRail({
  reels, activeReel, onSelect, canDirect, onAddReel,
  owner, viewerEmail, members,
}: {
  reels: BinderReel[]
  activeReel: string | null
  onSelect: (id: string) => void
  canDirect: boolean
  onAddReel: () => void
  owner: { name: string | null; email: string }
  viewerEmail: string
  members: CollaboratorMember[]
}) {
  return (
    <nav className={s.rail}>
      <div className={s.railCap}>
        <span className={s.smallcaps}>Reels</span>
      </div>
      <ol className={s.railList}>
        {reels.map((r) => {
          const display = reelDisplayName(r.name, r.cue_position)
          const attn = reelAttentionCount(r.scenes)
          const active = activeReel === r.id
          const range = reelSmpteRange(r.scenes)
          return (
            <li key={r.id} className={`${s.railItem} ${active ? s.isActive : ''}`}>
              <button onClick={() => onSelect(r.id)} type="button">
                <span className={s.railMark}>{active ? '—' : '·'}</span>
                <span className={s.railBody}>
                  <span className={s.railNum}>{display.positional}</span>
                  {display.subtitle && <span className={s.railSub}>{display.subtitle}</span>}
                  {range && <span className={s.railSmpte}>{range}</span>}
                </span>
                <span className={s.railCount}>
                  {String(r.scenes.length).padStart(2, '0')}
                  {attn > 0 && <span className={s.railAttn}> · {attn}●</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      {canDirect && (
        <div className={s.railFoot}>
          <button type="button" className={s.railAdd} onClick={onAddReel}>
            <span className={s.railAddMark}>+</span>
            <span>Add a reel</span>
          </button>
        </div>
      )}
      {/* TODO: reel reordering, renaming, deletion — handled at the rail level. */}

      <CollaboratorsPanel owner={owner} viewerEmail={viewerEmail} members={members} />
    </nav>
  )
}

function CollaboratorsPanel({
  owner, viewerEmail, members,
}: {
  owner: { name: string | null; email: string }
  viewerEmail: string
  members: CollaboratorMember[]
}) {
  return (
    <div className={s.railCollab}>
      <div className={s.collabCap}>
        <span className={s.smallcaps}>In the room</span>
      </div>
      <ul className={s.collabList}>
        <li className={`${s.collabLi} ${owner.email === viewerEmail ? s.collabSelf : ''}`}>
          <span className={s.collabMono}>{initialsOf(owner.name, owner.email)}</span>
          <span className={s.collabBody}>
            <span className={s.collabName}>{owner.name?.trim() || owner.email.split('@')[0]}</span>
            <span className={s.collabRole}>Director · Owner</span>
          </span>
        </li>
        {members.map((m, i) => {
          const muted = m.role === 'viewer'
          const self = m.email === viewerEmail
          return (
            <li
              key={`${m.user_id ?? m.email}-${i}`}
              className={`${s.collabLi} ${muted ? s.collabMuted : ''} ${self ? s.collabSelf : ''}`}
            >
              <span className={s.collabMono}>{initialsOf(m.name, m.email)}</span>
              <span className={s.collabBody}>
                <span className={s.collabName}>{m.name?.trim() || m.email.split('@')[0]}</span>
                <span className={s.collabRole}>{prettyRole(m.role)}</span>
              </span>
            </li>
          )
        })}
      </ul>
      {/* TODO: build the invite-collaborator flow on this page. Project settings already
          has it; this rail entry should open a focused invite picker without leaving
          the binder. */}
      <span className={s.collabAdd}>+ Invite a collaborator</span>
    </div>
  )
}

function prettyRole(role: string): string {
  switch (role) {
    case 'director': return 'Director'
    case 'composer': return 'Composer'
    case 'music_supervisor': return 'Music supervisor'
    case 'sound_designer': return 'Sound designer'
    case 'viewer': return 'Viewer'
    default: return role.replace(/_/g, ' ')
  }
}

// ——————————————————————————————————————————

function ProductionHead({
  projectId, title, format, slate, runtimeMinutes, era, toneBrief, standing, canDirect,
}: {
  projectId: string
  title: string
  format: string
  slate: string | null
  runtimeMinutes: number | null
  era: string | null
  toneBrief: string | null
  standing: ReturnType<typeof standingItems>
  canDirect: boolean
}) {
  const fmt = formatLabel(format)
  const runtime = runtimeDisplay(runtimeMinutes)
  const fmtLine = runtime ? `${fmt} · ${runtime}` : fmt

  return (
    <section className={s.head}>
      <Link href="/projects" className={s.headBack}>
        <span className={s.headBackArrow}>←</span>
        <span>Tonight&rsquo;s bill</span>
      </Link>

      <div className={s.headCredit}>
        <span className={s.smallcaps}>Production</span>
        {slate && <span className={s.headNum}>{slate}</span>}
        <span className={s.greetRule} />
        <span className={s.smallcaps}>Format</span>
        <span className={s.headFmt}>{fmtLine}</span>
        {era && (
          <>
            <span className={s.greetRule} />
            <span className={s.smallcaps}>Era</span>
            <span className={s.headEra}>{era}</span>
          </>
        )}
      </div>

      <div className={s.headRow}>
        <h1 className={s.title}>{title}</h1>
        {canDirect && (
          <div className={s.headActions}>
            <Link className={s.headLink} href={`/projects/${projectId}/settings`}>
              <span className={s.headLinkCap}>Settings</span>
              <span className={s.headLinkSub}>collaborators · format · removal</span>
              <span className={s.headLinkArrow}>→</span>
            </Link>
          </div>
        )}
      </div>

      {toneBrief && (
        <p className={s.tone}>
          <span className={s.greetQ}>&ldquo;</span>
          {toneBrief}
          <span className={s.greetQ}>&rdquo;</span>
          {/* TODO: tone_brief_author_id when we want proper attribution. */}
        </p>
      )}

      {standing.length > 0 && (
        <div className={s.headFoot}>
          <span className={s.smallcaps}>Standing</span>
          <ul className={s.standing}>
            {standing.map((it, i) => {
              const cls = it.kind === 'attn' ? s.stAttn
                : it.kind === 'quiet' ? s.stQuiet
                : ''
              const dotCls = it.kind === 'warm' ? s.stDotWarm
                : it.kind === 'quiet' ? s.stDotQuiet
                : it.kind === 'ink' ? s.stDotInk
                : ''
              return (
                <li key={i} className={`${s.st} ${cls}`}>
                  <span className={`${s.stDot} ${dotCls}`}>{it.glyph}</span>
                  <em>{it.count}</em> {it.label}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

// ——————————————————————————————————————————

function CueBinder({
  reels, projectId, totalCues, reelCount, canDirect, onAddCueToReel, onAddReel,
}: {
  reels: BinderReel[]
  projectId: string
  totalCues: number
  reelCount: number
  canDirect: boolean
  onAddCueToReel: (reelId: string) => void
  onAddReel: () => void
}) {
  return (
    <section>
      <header className={s.binderHead}>
        <div className={s.binderHeadL}>
          <div>№</div>
          <div>Cue</div>
        </div>
        <div>Scene</div>
        <div>Intent</div>
        <div>Standing</div>
        <div className={s.binderCapEnter}>&nbsp;</div>
      </header>

      {reels.map((r) => (
        <ReelBlock
          key={r.id}
          reel={r}
          projectId={projectId}
          canDirect={canDirect}
          onAddCue={onAddCueToReel}
        />
      ))}

      <footer className={s.binderFoot}>
        <span className={s.binderFootL}>
          — end of binder · {totalCues} {totalCues === 1 ? 'cue' : 'cues'} across {reelCount} {reelCount === 1 ? 'reel' : 'reels'} —
        </span>
        {canDirect && (
          <button type="button" className={s.binderFootR} onClick={onAddReel}>
            <span className={s.binderFootArrow}>+</span>
            <span className={s.binderFootLabel}>Begin a new reel</span>
            <span className={s.binderFootSub}>label · subtitle · smpte range</span>
          </button>
        )}
      </footer>
    </section>
  )
}

function ReelBlock({
  reel, projectId, canDirect, onAddCue,
}: {
  reel: BinderReel
  projectId: string
  canDirect: boolean
  onAddCue: (reelId: string) => void
}) {
  const display = reelDisplayName(reel.name, reel.cue_position)
  const range = reelSmpteRange(reel.scenes)
  const attn = reelAttentionCount(reel.scenes)
  const sceneCount = reel.scenes.length

  return (
    <section className={s.reel} id={`reel-${reel.id}`}>
      <header className={s.reelHead}>
        <div className={s.reelHeadL}>
          <span className={s.reelNum}>{display.positional}</span>
          <span className={s.reelRule} />
          {display.subtitle && <span className={s.reelSub}>{display.subtitle}</span>}
        </div>
        <div className={s.reelHeadR}>
          {range && <span>{range}</span>}
          {range && <span className={s.reelDot}>·</span>}
          <span className={s.reelCount}>
            {sceneCount} {sceneCount === 1 ? 'cue' : 'cues'}
            {attn > 0 && <em> · {attn} for your eye</em>}
          </span>
        </div>
      </header>
      <ol className={s.rows}>
        {reel.scenes.map((scene, idx) => (
          <SceneRow key={scene.id} projectId={projectId} scene={scene} idx={idx} />
        ))}
        {canDirect && (
          <li className={s.rowAdd}>
            <button type="button" onClick={() => onAddCue(reel.id)}>
              <span className={s.rowAddMark}>+</span>
              <span className={s.rowAddLabel}>Add a cue to {display.positional}</span>
              <span className={s.rowAddSub}>title · timecode in/out · cue number</span>
            </button>
          </li>
        )}
      </ol>
    </section>
  )
}

function SceneRow({
  projectId, scene, idx,
}: {
  projectId: string
  scene: BinderScene
  idx: number
}) {
  const meta = STATUS_META[scene.state]
  const attn = scene.state === 'for_approval'
  const cue = scene.cue_number ?? String(idx + 1).padStart(2, '0')

  // director_note from schema preempts auto-derived state notes.
  const note = scene.director_note?.trim() || autoMarginNote(scene)

  const dur = scene.tc_in_smpte && scene.tc_out_smpte
    ? durationFromSmpte(scene.tc_in_smpte, scene.tc_out_smpte)
    : formatVideoDuration(scene.duration_sec)

  const lastTouched = lastTouchedLabel(scene.last_touched_at)

  const toneCls = meta.tone === 'ember' ? s.statEmber
    : meta.tone === 'warm' ? s.statWarm
    : meta.tone === 'ink' ? s.statInk
    : s.statMuted

  return (
    <li className={`${s.row} ${attn ? s.rowAttn : ''}`}>
      <Link
        href={`/projects/${projectId}/scenes/${scene.id}`}
        className={s.rowCue}
        aria-label={`Open ${scene.label}`}
      >
        <span className={s.rowCueNum}>{cue}</span>
        <span className={s.rowCueGlyph}>{meta.mark}</span>
      </Link>

      <Link href={`/projects/${projectId}/scenes/${scene.id}`} className={s.rowTitle}>
        <h3>{scene.label}</h3>
        {scene.tc_in_smpte || scene.tc_out_smpte ? (
          <div className={s.rowTcs}>
            <span>{scene.tc_in_smpte ?? '—'}</span>
            <span className={s.tcArrow}>→</span>
            <span>{scene.tc_out_smpte ?? '—'}</span>
            {dur && <span className={s.tcDur}>· {dur}</span>}
          </div>
        ) : (
          <div className={s.tcsEmpty}>— timecodes pending —</div>
        )}
      </Link>

      <Link href={`/projects/${projectId}/scenes/${scene.id}`} className={s.rowIntent}>
        {scene.atmospheres.length > 0 ? (
          <ul className={s.atms}>
            {scene.atmospheres.map((a, i) => (
              <li key={i} className={s.atm}>{a}</li>
            ))}
          </ul>
        ) : (
          <span className={s.atmsEmpty}>— intent not yet tagged —</span>
        )}
      </Link>

      <Link href={`/projects/${projectId}/scenes/${scene.id}`} className={s.rowStatus}>
        <span className={`${s.stat} ${toneCls}`}>
          <span className={s.statMark}>{meta.mark}</span>
          <span className={s.statLabel}>{meta.label}</span>
        </span>
        {scene.versions > 0 && (
          <div className={s.rowVersions}>
            v{scene.versions}{scene.versions > 1 ? ` of ${scene.versions}` : ''}
            <span className={s.rowVersionsSub}>{lastTouched}</span>
          </div>
        )}
      </Link>

      <Link href={`/projects/${projectId}/scenes/${scene.id}`} className={s.rowEnter}>
        <span className={s.rowArrow}>→</span>
        <span className={s.rowEnterLabel}>{rowEnterLabel(scene.state)}</span>
      </Link>

      {note && (
        <aside className={s.rowMargin}>
          <span className={s.marginBracket}>[</span>
          <span>{note}</span>
          <span className={s.marginBracket}>]</span>
        </aside>
      )}
    </li>
  )
}

// ——————————————————————————————————————————

function BinderEmpty({
  projectTitle, canDirect, firstReelId, onSpot,
}: {
  projectTitle: string
  canDirect: boolean
  firstReelId: string | null
  onSpot: () => void
}) {
  return (
    <section className={s.empty}>
      <div className={s.emptyRuleTop} />
      <div className={s.emptyFolio}>
        <span className={s.folioOrn} />
        <span className={s.smallcaps}>An empty binder</span>
        <span className={s.folioOrn} />
      </div>
      <h2 className={s.emptyTitle}>
        <span className={s.greetQ}>&ldquo;</span>
        {projectTitle} has no cues yet.
        <span className={s.greetQ}>&rdquo;</span>
      </h2>
      <p className={s.emptySub}>
        Spot your first scene — give it a working title, a timecode, and an optional cue number.
        From there you&rsquo;ll tag intent, generate a mock cue for the room, and hand a brief to your composer.
      </p>
      {canDirect && firstReelId && (
        <div className={s.emptyActions}>
          <button type="button" className={s.btnPrimary} onClick={onSpot}>
            Spot the first cue
          </button>
        </div>
      )}
      <div className={s.emptyRuleBot} />
      <div className={s.emptyMargin}>
        <span className={s.smallcaps}>Footnote</span>
        <p>A cue is a passage of music in the picture. One scene can hold one cue, or several. You decide where each begins and ends.</p>
      </div>
    </section>
  )
}
