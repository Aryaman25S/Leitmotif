/**
 * Data access layer — wraps Prisma for use in API routes and Server Components.
 *
 * Domain types use ISO-string dates so the rest of the app is unchanged.
 * Prisma Date objects are converted here at the boundary.
 *
 * To swap the database backend: change only the implementations below.
 * Function signatures are the public contract — keep them stable.
 */

import { prisma } from './prisma'
import { randomUUID } from 'crypto'

// ── Domain types (ISO-string dates for serialisability) ───────────────────────
// Components and API routes import these from '@/lib/store'.

export interface Profile {
  id: string
  name: string | null
  email: string
  created_at: string
}

export interface Project {
  id: string
  title: string
  format: string
  tone_brief: string | null
  runtime_minutes: number | null
  slate: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Reel {
  id: string
  project_id: string
  name: string
  cue_position: number
  created_at: string
  updated_at: string
}

// TODO(settings-redesign): the project-settings redesign (Form 7B) drops the
// edit surface for instrumentation_families, era_reference, budget_reality,
// do_not_generate, and tone_brief on Project. These fields are still consumed
// by the prompt compiler (lib/prompts/buildGenerationPrompt.ts) — whatever is
// in the DB at strike time is what the generator sees. New projects fall back
// to schema defaults. A new edit surface needs to be designed and built; this
// is a known regression to address in a follow-on design pass.
export interface GenerationSettings {
  id: string
  project_id: string
  instrumentation_families: string[]
  era_reference: string | null
  budget_reality: string | null
  do_not_generate: string | null
  model_provider: string
  updated_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string | null
  role_on_project: string
  invite_email: string | null
  magic_token: string | null
  can_edit: boolean
  invited_at: string
  accepted_at: string | null
  profile?: { name: string | null; email: string } | null
}

export interface SceneCard {
  id: string
  project_id: string
  reel_id: string
  cue_number: string | null
  label: string
  sort_order: number
  tc_in_smpte: string | null
  tc_out_smpte: string | null
  picture_version_label: string | null
  video_file_key: string | null
  video_duration_sec: number | null
  status: string
  director_note: string | null
  created_at: string
  created_by: string | null
}

export interface IntentVersion {
  id: string
  scene_card_id: string
  version_number: number
  emotional_atmospheres: string[]
  narrative_function: string | null
  density: string | null
  director_words: string | null
  what_would_be_wrong: string | null
  handoff_setting: string | null
  diegetic_status: string | null
  frequency_note: string | null
  target_bpm: number | null
  key_signature: string | null
  featured_instruments: string | null
  recording_quality: string | null
  working_title: string | null
  format_tag: string | null
  positive_prompt: string | null
  negative_prompt: string | null
  spec_tempo_range: string | null
  spec_harmonic_character: string | null
  spec_density: string | null
  spec_register: string | null
  spec_dynamics: string | null
  spec_rhythm: string | null
  spec_instrumentation: string | null
  spec_do_not_use: string[] | null
  spec_confirmed_by: string | null
  spec_confirmed_at: string | null
  created_at: string
  created_by: string | null
}

export interface GenerationJob {
  id: string
  scene_card_id: string
  intent_version_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  model_provider: string
  positive_prompt: string
  negative_prompt: string | null
  duration_sec: number
  error_message: string | null
  queued_at: string
  started_at: string | null
  completed_at: string | null
  created_by: string | null
}

export interface MockCue {
  id: string
  generation_job_id: string
  scene_card_id: string
  intent_version_id: string
  version_number: number
  file_key: string
  file_name: string
  duration_sec: number
  is_mock: boolean
  is_approved: boolean
  approved_by: string | null
  approved_at: string | null
  composer_acknowledged: boolean
  composer_acknowledged_at: string | null
  composer_notes: string | null
  scored_at: string | null
  scored_by: string | null
  created_at: string
}

export interface Comment {
  id: string
  scene_card_id: string
  author_id: string | null
  body: string
  created_at: string
  author?: { name: string | null; email: string } | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function now(): string {
  return new Date().toISOString()
}

export function uid(): string {
  return randomUUID()
}

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

function isoRequired(d: Date): string {
  return d.toISOString()
}

// ── Projects ──────────────────────────────────────────────────────────────────

/** Projects the profile owns or is an accepted member of. */
export async function getProjectsForProfile(profileId: string): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    where: {
      OR: [
        { owner_id: profileId },
        {
          project_members: {
            some: {
              user_id: profileId,
              accepted_at: { not: null },
            },
          },
        },
      ],
    },
    orderBy: { updated_at: 'desc' },
  })
  return rows.map((p) => ({
    ...p,
    created_at: isoRequired(p.created_at),
    updated_at: isoRequired(p.updated_at),
    tone_brief: p.tone_brief ?? null,
    runtime_minutes: p.runtime_minutes ?? null,
    slate: p.slate ?? null,
  }))
}

export interface ProjectWithRole extends Project {
  viewerRole: string
}

/** Projects the profile owns or is an accepted member of, with their role on each. */
export async function getProjectsWithRoleForProfile(profileId: string): Promise<ProjectWithRole[]> {
  const rows = await prisma.project.findMany({
    where: {
      OR: [
        { owner_id: profileId },
        {
          project_members: {
            some: {
              user_id: profileId,
              accepted_at: { not: null },
            },
          },
        },
      ],
    },
    include: {
      project_members: {
        where: { user_id: profileId, accepted_at: { not: null } },
        select: { role_on_project: true },
        take: 1,
      },
    },
    orderBy: { updated_at: 'desc' },
  })
  return rows.map((p) => ({
    ...p,
    created_at: isoRequired(p.created_at),
    updated_at: isoRequired(p.updated_at),
    tone_brief: p.tone_brief ?? null,
    runtime_minutes: p.runtime_minutes ?? null,
    slate: p.slate ?? null,
    viewerRole: p.owner_id === profileId
      ? 'owner'
      : p.project_members[0]?.role_on_project ?? 'viewer',
  }))
}

export interface ProjectListRow extends ProjectWithRole {
  sceneCount: number
  scenesWithIntents: number
  cuesAwaitingApproval: number
  cuesAwaitingAck: number
  jobsInFlight: number
  /** Display name of a complementary collaborator chosen by viewer's role. */
  counterpartName: string | null
  /** The complementary role used to render the credit-line suffix ("comp.", "dir."). */
  counterpartRole: 'director' | 'composer' | 'music_supervisor' | 'sound_designer' | 'owner' | null
}

/**
 * Projects-list rollup. One read of the project rows + five grouped aggregates,
 * zipped in JS. For each project the viewer can see, returns counts the
 * Standing column needs and a single named counterpart for the credit line.
 */
export async function getProjectsListForProfile(profileId: string): Promise<ProjectListRow[]> {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { owner_id: profileId },
        { project_members: { some: { user_id: profileId, accepted_at: { not: null } } } },
      ],
    },
    include: {
      owner: { select: { name: true, email: true } },
      project_members: {
        where: { accepted_at: { not: null } },
        select: {
          user_id: true,
          role_on_project: true,
          profile: { select: { name: true, email: true } },
        },
      },
      _count: { select: { scene_cards: true } },
    },
    orderBy: { updated_at: 'desc' },
  })

  if (projects.length === 0) return []

  const projectIds = projects.map((p) => p.id)

  // Scenes with at least one intent_version — driven from SceneCard, scoped by project.
  const scenesWithIntentRows = await prisma.sceneCard.groupBy({
    by: ['project_id'],
    where: { project_id: { in: projectIds }, intent_versions: { some: {} } },
    _count: { _all: true },
  })
  const scenesWithIntents = new Map(scenesWithIntentRows.map((r) => [r.project_id, r._count._all]))

  // Approval / acknowledgement state is per-scene, not per-MockCue row. A scene
  // accumulates many MockCue versions across regenerations; only one can be
  // approved at a time, so the right unit of work is the scene:
  //   awaitingApproval := scene has cues but none are approved
  //   awaitingAck      := scene has an approved cue that hasn't been acknowledged
  const scenesWithCues = await prisma.sceneCard.findMany({
    where: { project_id: { in: projectIds }, mock_cues: { some: {} } },
    select: {
      project_id: true,
      mock_cues: { select: { is_approved: true, composer_acknowledged: true } },
    },
  })
  const cuesAwaitingApproval = new Map<string, number>()
  const cuesAwaitingAck = new Map<string, number>()
  for (const scene of scenesWithCues) {
    const approved = scene.mock_cues.find((c) => c.is_approved)
    if (!approved) {
      cuesAwaitingApproval.set(scene.project_id, (cuesAwaitingApproval.get(scene.project_id) ?? 0) + 1)
    } else if (!approved.composer_acknowledged) {
      cuesAwaitingAck.set(scene.project_id, (cuesAwaitingAck.get(scene.project_id) ?? 0) + 1)
    }
  }

  const jobRows = await prisma.generationJob.findMany({
    where: {
      scene_card: { project_id: { in: projectIds } },
      status: { in: ['queued', 'processing'] },
    },
    select: { scene_card: { select: { project_id: true } } },
  })
  const jobsInFlight = new Map<string, number>()
  for (const row of jobRows) {
    const pid = row.scene_card.project_id
    jobsInFlight.set(pid, (jobsInFlight.get(pid) ?? 0) + 1)
  }

  return projects.map((p) => {
    const isOwner = p.owner_id === profileId
    const memberRole = p.project_members.find((m) => m.user_id === profileId)?.role_on_project
    const viewerRole: string = isOwner ? 'owner' : (memberRole ?? 'viewer')

    // Counterpart: pick by viewer role. owner/director see a composer; composer/sound_designer
    // see the director (owner of the project, since intent ownership lives with the director);
    // music_supervisor sees the director; viewer sees the director.
    const composerMember = p.project_members.find((m) => m.role_on_project === 'composer')
    const composerName = displayName(composerMember?.profile)
    const ownerName = displayName(p.owner)
    let counterpartName: string | null
    let counterpartRole: ProjectListRow['counterpartRole']
    if (viewerRole === 'owner' || viewerRole === 'director') {
      counterpartName = composerName
      counterpartRole = composerName ? 'composer' : null
    } else {
      counterpartName = ownerName
      counterpartRole = ownerName ? 'director' : null
    }

    return {
      id: p.id,
      title: p.title,
      format: p.format,
      tone_brief: p.tone_brief ?? null,
      runtime_minutes: p.runtime_minutes ?? null,
      slate: p.slate ?? null,
      owner_id: p.owner_id,
      created_at: isoRequired(p.created_at),
      updated_at: isoRequired(p.updated_at),
      viewerRole,
      sceneCount: p._count.scene_cards,
      scenesWithIntents: scenesWithIntents.get(p.id) ?? 0,
      cuesAwaitingApproval: cuesAwaitingApproval.get(p.id) ?? 0,
      cuesAwaitingAck: cuesAwaitingAck.get(p.id) ?? 0,
      jobsInFlight: jobsInFlight.get(p.id) ?? 0,
      counterpartName,
      counterpartRole,
    }
  })
}

function displayName(p: { name: string | null; email: string } | null | undefined): string | null {
  if (!p) return null
  const n = p.name?.trim()
  if (n) return n
  // Strip the local-part @host so a fallback is still presentable in the credit line.
  const local = p.email.split('@')[0]
  return local || null
}

export async function profileCanAccessProject(
  profileId: string,
  projectId: string
): Promise<boolean> {
  const row = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { owner_id: profileId },
        {
          project_members: {
            some: {
              user_id: profileId,
              accepted_at: { not: null },
            },
          },
        },
      ],
    },
    select: { id: true },
  })
  return !!row
}

/**
 * Returns the effective role a profile holds on a project:
 * 'owner' if they own it, the `role_on_project` string if they are an accepted
 * member, or `null` if they have no access.
 */
export async function getProjectRoleForProfile(
  profileId: string,
  projectId: string
): Promise<'owner' | string | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { owner_id: true },
  })
  if (!project) return null
  if (project.owner_id === profileId) return 'owner'

  const member = await prisma.projectMember.findFirst({
    where: {
      project_id: projectId,
      user_id: profileId,
      accepted_at: { not: null },
    },
    select: { role_on_project: true },
  })
  return member?.role_on_project ?? null
}

export async function getProject(id: string): Promise<Project | undefined> {
  const p = await prisma.project.findUnique({ where: { id } })
  if (!p) return undefined
  return {
    ...p,
    created_at: isoRequired(p.created_at),
    updated_at: isoRequired(p.updated_at),
    tone_brief: p.tone_brief ?? null,
    runtime_minutes: p.runtime_minutes ?? null,
    slate: p.slate ?? null,
  }
}

/** Project + the owner profile's display fields. The binder page needs the
 *  owner shown in the "In the room" panel even though the owner isn't a
 *  ProjectMember row. */
export async function getProjectWithOwner(
  id: string
): Promise<{ project: Project; owner: { name: string | null; email: string } | null } | undefined> {
  const p = await prisma.project.findUnique({
    where: { id },
    include: { owner: { select: { name: true, email: true } } },
  })
  if (!p) return undefined
  const { owner: ownerRow, ...rest } = p
  const project: Project = {
    ...rest,
    created_at: isoRequired(rest.created_at),
    updated_at: isoRequired(rest.updated_at),
    tone_brief: rest.tone_brief ?? null,
    runtime_minutes: rest.runtime_minutes ?? null,
    slate: rest.slate ?? null,
  }
  return { project, owner: ownerRow ?? null }
}

export async function createProject(
  data: Omit<Project, 'id' | 'created_at' | 'updated_at'>
): Promise<Project> {
  // Every new project ships with a default "Reel 1" so the binder UI never
  // sees a project without at least one reel. Add-reel/move-scene affordances
  // grow from here, but a project is never reel-less.
  const p = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        title: data.title,
        format: data.format,
        tone_brief: data.tone_brief,
        runtime_minutes: data.runtime_minutes ?? null,
        slate: data.slate ?? null,
        owner_id: data.owner_id,
      },
    })
    await tx.reel.create({
      data: {
        project_id: project.id,
        name: 'Reel 1',
        cue_position: 1,
      },
    })
    return project
  })
  return {
    ...p,
    created_at: isoRequired(p.created_at),
    updated_at: isoRequired(p.updated_at),
    tone_brief: p.tone_brief ?? null,
    runtime_minutes: p.runtime_minutes ?? null,
    slate: p.slate ?? null,
  }
}

export async function updateProject(
  id: string,
  data: Partial<Project>
): Promise<Project | undefined> {
  try {
    const p = await prisma.project.update({
      where: { id },
      data: {
        title: data.title,
        tone_brief: data.tone_brief,
        format: data.format,
        runtime_minutes: data.runtime_minutes,
        slate: data.slate,
      },
    })
    return {
      ...p,
      created_at: isoRequired(p.created_at),
      updated_at: isoRequired(p.updated_at),
      tone_brief: p.tone_brief ?? null,
      runtime_minutes: p.runtime_minutes ?? null,
      slate: p.slate ?? null,
    }
  } catch {
    return undefined
  }
}

// ── Generation Settings ───────────────────────────────────────────────────────

export async function getGenerationSettings(
  projectId: string
): Promise<GenerationSettings | undefined> {
  const s = await prisma.generationSettings.findUnique({ where: { project_id: projectId } })
  if (!s) return undefined
  return { ...s, updated_at: isoRequired(s.updated_at) }
}

export async function upsertGenerationSettings(
  data: Omit<GenerationSettings, 'id' | 'updated_at'>
): Promise<GenerationSettings> {
  const s = await prisma.generationSettings.upsert({
    where: { project_id: data.project_id },
    update: {
      instrumentation_families: data.instrumentation_families,
      era_reference: data.era_reference,
      budget_reality: data.budget_reality,
      do_not_generate: data.do_not_generate,
      model_provider: data.model_provider,
    },
    create: {
      project_id: data.project_id,
      instrumentation_families: data.instrumentation_families,
      era_reference: data.era_reference,
      budget_reality: data.budget_reality,
      do_not_generate: data.do_not_generate,
      model_provider: data.model_provider,
    },
  })
  return { ...s, updated_at: isoRequired(s.updated_at) }
}

// ── Project Members ───────────────────────────────────────────────────────────

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const rows = await prisma.projectMember.findMany({
    where: { project_id: projectId },
    include: { profile: { select: { name: true, email: true } } },
  })
  return rows.map((m) => ({
    id: m.id,
    project_id: m.project_id,
    user_id: m.user_id,
    role_on_project: m.role_on_project,
    invite_email: m.invite_email,
    magic_token: m.magic_token,
    can_edit: m.can_edit,
    invited_at: isoRequired(m.invited_at),
    accepted_at: iso(m.accepted_at),
    profile: m.profile ?? null,
  }))
}

/** Distinct lowercased emails for members whose `role_on_project` is in `roles`. Uses `profile.email` when linked, else pending `invite_email`. */
export async function getMemberEmailsByRoles(
  projectId: string,
  roles: readonly string[]
): Promise<string[]> {
  const roleSet = new Set(roles)
  const members = await getProjectMembers(projectId)
  const emails = new Set<string>()
  for (const m of members) {
    if (!roleSet.has(m.role_on_project)) continue
    const raw = m.profile?.email ?? m.invite_email
    const addr = raw?.trim().toLowerCase()
    if (addr && addr.includes('@')) emails.add(addr)
  }
  return [...emails]
}

/** Remove a collaborator row. Returns true if a row was deleted. */
export async function deleteProjectMember(memberId: string, projectId: string): Promise<boolean> {
  const result = await prisma.projectMember.deleteMany({
    where: { id: memberId, project_id: projectId },
  })
  return result.count > 0
}

// ── Strike (project deletion) helpers ────────────────────────────────────────

/**
 * Counts surfaced in the §3 "Strike the production" confirmation. Mirrors the
 * design's struck-through list 1:1 — what the user is told will be destroyed
 * is what the route actually destroys.
 */
export interface StrikeManifest {
  reels: number
  cues: number
  intent_versions: number
  reference_recordings: number
  approved_briefs: number
  comments: number
  members_accepted: number
  members_pending: number
}

export async function getStrikeManifest(projectId: string): Promise<StrikeManifest> {
  const [reels, cues, intentVersions, mockCues, approvedBriefs, comments, members] =
    await Promise.all([
      prisma.reel.count({ where: { project_id: projectId } }),
      prisma.sceneCard.count({ where: { project_id: projectId } }),
      prisma.intentVersion.count({ where: { scene_card: { project_id: projectId } } }),
      prisma.mockCue.count({ where: { scene_card: { project_id: projectId } } }),
      prisma.mockCue.count({
        where: { scene_card: { project_id: projectId }, is_approved: true },
      }),
      prisma.comment.count({ where: { scene_card: { project_id: projectId } } }),
      prisma.projectMember.findMany({
        where: { project_id: projectId },
        select: { accepted_at: true },
      }),
    ])
  let accepted = 0
  let pending = 0
  for (const m of members) {
    if (m.accepted_at) accepted++
    else pending++
  }
  return {
    reels,
    cues,
    intent_versions: intentVersions,
    reference_recordings: mockCues,
    approved_briefs: approvedBriefs,
    comments,
    members_accepted: accepted,
    members_pending: pending,
  }
}

/**
 * R2/local-storage object keys owned by a project. The strike route deletes
 * these *after* the DB cascade so the design's "reference recordings" line is
 * an honest promise. Returned in a single round-trip for use inside a tx.
 */
export async function getProjectStorageKeys(projectId: string): Promise<{
  audio: string[]
  video: string[]
}> {
  const [mockCues, scenes] = await Promise.all([
    prisma.mockCue.findMany({
      where: { scene_card: { project_id: projectId } },
      select: { file_key: true },
    }),
    prisma.sceneCard.findMany({
      where: { project_id: projectId },
      select: { video_file_key: true },
    }),
  ])
  return {
    audio: mockCues.map((m) => m.file_key).filter((k): k is string => Boolean(k)),
    video: scenes.map((s) => s.video_file_key).filter((k): k is string => Boolean(k)),
  }
}

export async function createProjectMember(
  data: Omit<ProjectMember, 'id' | 'invited_at' | 'profile'>
): Promise<ProjectMember> {
  const m = await prisma.projectMember.create({
    data: {
      project_id: data.project_id,
      user_id: data.user_id,
      invite_email: data.invite_email,
      role_on_project: data.role_on_project,
      magic_token: data.magic_token,
      can_edit: data.can_edit,
      accepted_at: data.accepted_at ? new Date(data.accepted_at) : null,
    },
  })
  return {
    id: m.id,
    project_id: m.project_id,
    user_id: m.user_id,
    role_on_project: m.role_on_project,
    invite_email: m.invite_email,
    magic_token: m.magic_token,
    can_edit: m.can_edit,
    invited_at: isoRequired(m.invited_at),
    accepted_at: iso(m.accepted_at),
    profile: null,
  }
}

export interface PendingInvitePreview {
  project_id: string
  project_title: string
  invite_email: string | null
  role_on_project: string
}

/** Pending invite row for magic-link acceptance (token is single-use until accepted). */
export async function getPendingInvitePreview(
  magicToken: string
): Promise<PendingInvitePreview | null> {
  const m = await prisma.projectMember.findFirst({
    where: { magic_token: magicToken, accepted_at: null },
    include: { project: { select: { id: true, title: true } } },
  })
  if (!m) return null
  return {
    project_id: m.project_id,
    project_title: m.project.title,
    invite_email: m.invite_email,
    role_on_project: m.role_on_project,
  }
}

/** Links invitee profile and clears token. Returns project id for redirect. */
export async function acceptProjectInviteByToken(
  magicToken: string,
  userId: string
): Promise<{ project_id: string } | null> {
  const m = await prisma.projectMember.findFirst({
    where: { magic_token: magicToken, accepted_at: null },
  })
  if (!m) return null
  await prisma.projectMember.update({
    where: { id: m.id },
    data: {
      user_id: userId,
      accepted_at: new Date(),
      magic_token: null,
    },
  })
  return { project_id: m.project_id }
}

// ── Project binder aggregate ──────────────────────────────────────────────────

/** A scene state vocabulary derived from intent/job/cue history. Maps to the
 *  design's per-scene language: "To be spotted", "Intent saved", "Mock generating",
 *  "Awaiting your eye", "With composer", "In composer's hand", "Scored". */
export type SceneState =
  | 'spotting'
  | 'intent'
  | 'rendering'
  | 'for_approval'
  | 'delivered'
  | 'acknowledged'
  | 'scored'

export interface BinderScene {
  id: string
  reel_id: string
  cue_number: string | null
  label: string
  sort_order: number
  tc_in_smpte: string | null
  tc_out_smpte: string | null
  duration_sec: number | null
  director_note: string | null
  state: SceneState
  atmospheres: string[]
  /** Total mock cue versions ever generated for this scene. */
  versions: number
  /** ISO timestamp of the most recent activity touching this scene. */
  last_touched_at: string | null
  /** Provider of the in-flight job, when state === 'rendering'. */
  rendering_provider: string | null
}

export interface BinderReel {
  id: string
  cue_position: number
  name: string
  scenes: BinderScene[]
}

export interface BinderData {
  reels: BinderReel[]
  scenes: BinderScene[]
  scenesByReel: Record<string, BinderScene[]>
  /** Project-level scene counts by state, for the standing summary. */
  standing: Record<SceneState, number>
  /** Total minutes of music across scenes that have a duration. */
  scoredDurationMin: number | null
}

/**
 * Single-pass binder rollup. One read per relation, zipped in JS.
 * Per-scene state is the highest-progress signal across:
 *   approved cue + scored_at         → scored
 *   approved cue + acknowledged      → acknowledged
 *   approved cue                     → delivered
 *   any cue, in-flight job           → rendering
 *   any cue                          → for_approval
 *   intent_versions but no cue       → intent
 *   nothing                          → spotting
 */
export async function getProjectBinder(projectId: string): Promise<BinderData> {
  const [reels, scenes, intents, jobs, cues] = await Promise.all([
    prisma.reel.findMany({
      where: { project_id: projectId },
      orderBy: { cue_position: 'asc' },
    }),
    prisma.sceneCard.findMany({
      where: { project_id: projectId },
      orderBy: [{ reel_id: 'asc' }, { sort_order: 'asc' }],
    }),
    prisma.intentVersion.findMany({
      where: { scene_card: { project_id: projectId } },
      orderBy: { version_number: 'desc' },
      select: {
        scene_card_id: true,
        version_number: true,
        emotional_atmospheres: true,
        created_at: true,
      },
    }),
    prisma.generationJob.findMany({
      where: { scene_card: { project_id: projectId } },
      orderBy: { queued_at: 'desc' },
      select: {
        scene_card_id: true,
        status: true,
        model_provider: true,
        queued_at: true,
      },
    }),
    prisma.mockCue.findMany({
      where: { scene_card: { project_id: projectId } },
      orderBy: { version_number: 'desc' },
      select: {
        scene_card_id: true,
        is_approved: true,
        composer_acknowledged: true,
        scored_at: true,
        created_at: true,
      },
    }),
  ])

  // Latest IntentVersion per scene (intents are pre-sorted desc).
  const latestIntent = new Map<string, (typeof intents)[number]>()
  for (const iv of intents) if (!latestIntent.has(iv.scene_card_id)) latestIntent.set(iv.scene_card_id, iv)

  // Versions count + latest cue per scene.
  const cueCount = new Map<string, number>()
  const latestCue = new Map<string, (typeof cues)[number]>()
  const approvedCue = new Map<string, (typeof cues)[number]>()
  for (const c of cues) {
    cueCount.set(c.scene_card_id, (cueCount.get(c.scene_card_id) ?? 0) + 1)
    if (!latestCue.has(c.scene_card_id)) latestCue.set(c.scene_card_id, c)
    if (c.is_approved && !approvedCue.has(c.scene_card_id)) approvedCue.set(c.scene_card_id, c)
  }

  // In-flight job per scene.
  const liveJob = new Map<string, (typeof jobs)[number]>()
  for (const j of jobs) {
    if (j.status === 'queued' || j.status === 'processing') {
      if (!liveJob.has(j.scene_card_id)) liveJob.set(j.scene_card_id, j)
    }
  }
  const latestJob = new Map<string, (typeof jobs)[number]>()
  for (const j of jobs) if (!latestJob.has(j.scene_card_id)) latestJob.set(j.scene_card_id, j)

  const binderScenes: BinderScene[] = scenes.map((s) => {
    const intent = latestIntent.get(s.id)
    const live = liveJob.get(s.id)
    const approved = approvedCue.get(s.id)
    const cue = latestCue.get(s.id)
    const cueN = cueCount.get(s.id) ?? 0

    let state: SceneState
    if (approved && approved.scored_at) state = 'scored'
    else if (approved && approved.composer_acknowledged) state = 'acknowledged'
    else if (approved) state = 'delivered'
    else if (live) state = 'rendering'
    else if (cueN > 0) state = 'for_approval'
    else if (intent) state = 'intent'
    else state = 'spotting'

    const lastJob = latestJob.get(s.id)
    const touchTimes: number[] = []
    if (intent) touchTimes.push(intent.created_at.getTime())
    if (cue) touchTimes.push(cue.created_at.getTime())
    if (lastJob) touchTimes.push(lastJob.queued_at.getTime())
    const last = touchTimes.length ? new Date(Math.max(...touchTimes)).toISOString() : null

    return {
      id: s.id,
      reel_id: s.reel_id,
      cue_number: s.cue_number,
      label: s.label,
      sort_order: s.sort_order,
      tc_in_smpte: s.tc_in_smpte,
      tc_out_smpte: s.tc_out_smpte,
      duration_sec: s.video_duration_sec,
      director_note: s.director_note,
      state,
      atmospheres: intent?.emotional_atmospheres ?? [],
      versions: cueN,
      last_touched_at: last,
      rendering_provider: state === 'rendering' ? live?.model_provider ?? null : null,
    }
  })

  const scenesByReel: Record<string, BinderScene[]> = {}
  for (const r of reels) scenesByReel[r.id] = []
  for (const s of binderScenes) {
    if (!scenesByReel[s.reel_id]) scenesByReel[s.reel_id] = []
    scenesByReel[s.reel_id].push(s)
  }

  const binderReels: BinderReel[] = reels.map((r) => ({
    id: r.id,
    cue_position: r.cue_position,
    name: r.name,
    scenes: scenesByReel[r.id] ?? [],
  }))

  const standing: Record<SceneState, number> = {
    spotting: 0, intent: 0, rendering: 0, for_approval: 0,
    delivered: 0, acknowledged: 0, scored: 0,
  }
  for (const s of binderScenes) standing[s.state] += 1

  let scoredMin = 0
  let any = false
  for (const s of binderScenes) {
    if (s.duration_sec != null) {
      scoredMin += s.duration_sec / 60
      any = true
    }
  }

  return {
    reels: binderReels,
    scenes: binderScenes,
    scenesByReel,
    standing,
    scoredDurationMin: any ? Math.round(scoredMin) : null,
  }
}

// ── Reels ─────────────────────────────────────────────────────────────────────

export async function getReels(projectId: string): Promise<Reel[]> {
  const rows = await prisma.reel.findMany({
    where: { project_id: projectId },
    orderBy: { cue_position: 'asc' },
  })
  return rows.map((r) => ({
    ...r,
    created_at: isoRequired(r.created_at),
    updated_at: isoRequired(r.updated_at),
  }))
}

/**
 * Append a new reel at the next cue_position. The default name is "Reel N"
 * to match the post-migration default; callers can pass a name through later
 * once a rename UI exists.
 */
// TODO: rename-reel API + UI — pair with a PATCH /api/projects/[id]/reels/[reelId].
export async function createReel(projectId: string, name?: string): Promise<Reel> {
  const last = await prisma.reel.findFirst({
    where: { project_id: projectId },
    orderBy: { cue_position: 'desc' },
    select: { cue_position: true },
  })
  const nextPosition = (last?.cue_position ?? 0) + 1
  const r = await prisma.reel.create({
    data: {
      project_id: projectId,
      name: name?.trim() || `Reel ${nextPosition}`,
      cue_position: nextPosition,
    },
  })
  return {
    ...r,
    created_at: isoRequired(r.created_at),
    updated_at: isoRequired(r.updated_at),
  }
}

// TODO: deleteReel + reorderReels — needs to handle scene reassignment.

// ── Scene Cards ───────────────────────────────────────────────────────────────

export async function getSceneCards(projectId: string): Promise<SceneCard[]> {
  const rows = await prisma.sceneCard.findMany({
    where: { project_id: projectId },
    orderBy: { sort_order: 'asc' },
  })
  return rows.map((s) => ({ ...s, created_at: isoRequired(s.created_at) }))
}

export async function getSceneCard(id: string): Promise<SceneCard | undefined> {
  const s = await prisma.sceneCard.findUnique({ where: { id } })
  if (!s) return undefined
  return { ...s, created_at: isoRequired(s.created_at) }
}

export async function createSceneCard(
  data: Omit<SceneCard, 'id' | 'created_at'>
): Promise<SceneCard> {
  const s = await prisma.sceneCard.create({
    data: {
      project_id: data.project_id,
      reel_id: data.reel_id,
      cue_number: data.cue_number,
      label: data.label,
      sort_order: data.sort_order,
      tc_in_smpte: data.tc_in_smpte,
      tc_out_smpte: data.tc_out_smpte,
      picture_version_label: data.picture_version_label,
      video_file_key: data.video_file_key,
      video_duration_sec: data.video_duration_sec,
      status: data.status,
      director_note: data.director_note,
      created_by: data.created_by,
    },
  })
  return { ...s, created_at: isoRequired(s.created_at) }
}

export async function updateSceneCard(
  id: string,
  data: Partial<SceneCard>
): Promise<SceneCard | undefined> {
  try {
    const s = await prisma.sceneCard.update({
      where: { id },
      data: {
        // TODO: scene-moves-between-reels — accept reel_id here once the move UI exists.
        cue_number: data.cue_number,
        label: data.label,
        sort_order: data.sort_order,
        tc_in_smpte: data.tc_in_smpte,
        tc_out_smpte: data.tc_out_smpte,
        picture_version_label: data.picture_version_label,
        video_file_key: data.video_file_key,
        video_duration_sec: data.video_duration_sec,
        status: data.status,
        director_note: data.director_note,
      },
    })
    return { ...s, created_at: isoRequired(s.created_at) }
  } catch {
    return undefined
  }
}

// ── Intent Versions ───────────────────────────────────────────────────────────

export async function getLatestIntent(sceneCardId: string): Promise<IntentVersion | undefined> {
  const iv = await prisma.intentVersion.findFirst({
    where: { scene_card_id: sceneCardId },
    orderBy: { version_number: 'desc' },
  })
  if (!iv) return undefined
  return {
    ...iv,
    created_at: isoRequired(iv.created_at),
    spec_confirmed_at: iso(iv.spec_confirmed_at),
  }
}

export async function getIntent(id: string): Promise<IntentVersion | undefined> {
  const iv = await prisma.intentVersion.findUnique({ where: { id } })
  if (!iv) return undefined
  return {
    ...iv,
    created_at: isoRequired(iv.created_at),
    spec_confirmed_at: iso(iv.spec_confirmed_at),
  }
}

export async function createIntentVersion(
  data: Omit<IntentVersion, 'id' | 'created_at'>
): Promise<IntentVersion> {
  const count = await prisma.intentVersion.count({
    where: { scene_card_id: data.scene_card_id },
  })
  const iv = await prisma.intentVersion.create({
    data: {
      scene_card_id: data.scene_card_id,
      version_number: count + 1,
      emotional_atmospheres: data.emotional_atmospheres,
      narrative_function: data.narrative_function,
      density: data.density,
      director_words: data.director_words,
      what_would_be_wrong: data.what_would_be_wrong,
      handoff_setting: data.handoff_setting,
      diegetic_status: data.diegetic_status,
      frequency_note: data.frequency_note,
      target_bpm: data.target_bpm,
      key_signature: data.key_signature,
      featured_instruments: data.featured_instruments,
      recording_quality: data.recording_quality,
      working_title: data.working_title,
      format_tag: data.format_tag,
      positive_prompt: data.positive_prompt,
      negative_prompt: data.negative_prompt,
      spec_tempo_range: data.spec_tempo_range,
      spec_harmonic_character: data.spec_harmonic_character,
      spec_density: data.spec_density,
      spec_register: data.spec_register,
      spec_dynamics: data.spec_dynamics,
      spec_rhythm: data.spec_rhythm,
      spec_instrumentation: data.spec_instrumentation,
      spec_do_not_use: data.spec_do_not_use ?? [],
      spec_confirmed_by: data.spec_confirmed_by,
      spec_confirmed_at: data.spec_confirmed_at ? new Date(data.spec_confirmed_at) : null,
      created_by: data.created_by,
    },
  })
  return {
    ...iv,
    created_at: isoRequired(iv.created_at),
    spec_confirmed_at: iso(iv.spec_confirmed_at),
  }
}

// ── Generation Jobs ───────────────────────────────────────────────────────────

export async function getLatestJob(sceneCardId: string): Promise<GenerationJob | undefined> {
  const job = await prisma.generationJob.findFirst({
    where: { scene_card_id: sceneCardId },
    orderBy: { queued_at: 'desc' },
  })
  if (!job) return undefined
  return {
    ...job,
    status: job.status as GenerationJob['status'],
    queued_at: isoRequired(job.queued_at),
    started_at: iso(job.started_at),
    completed_at: iso(job.completed_at),
  }
}

export async function createJob(
  data: Omit<GenerationJob, 'id' | 'queued_at'>
): Promise<GenerationJob> {
  const job = await prisma.generationJob.create({
    data: {
      scene_card_id: data.scene_card_id,
      intent_version_id: data.intent_version_id,
      status: data.status,
      model_provider: data.model_provider,
      positive_prompt: data.positive_prompt,
      negative_prompt: data.negative_prompt,
      duration_sec: data.duration_sec,
      error_message: data.error_message,
      started_at: data.started_at ? new Date(data.started_at) : null,
      completed_at: data.completed_at ? new Date(data.completed_at) : null,
      created_by: data.created_by,
    },
  })
  return {
    ...job,
    status: job.status as GenerationJob['status'],
    queued_at: isoRequired(job.queued_at),
    started_at: iso(job.started_at),
    completed_at: iso(job.completed_at),
  }
}

export async function updateJob(
  id: string,
  data: Partial<GenerationJob>
): Promise<GenerationJob | undefined> {
  try {
    const job = await prisma.generationJob.update({
      where: { id },
      data: {
        status: data.status,
        error_message: data.error_message,
        started_at:
          data.started_at !== undefined
            ? data.started_at ? new Date(data.started_at) : null
            : undefined,
        completed_at:
          data.completed_at !== undefined
            ? data.completed_at ? new Date(data.completed_at) : null
            : undefined,
      },
    })
    return {
      ...job,
      status: job.status as GenerationJob['status'],
      queued_at: isoRequired(job.queued_at),
      started_at: iso(job.started_at),
      completed_at: iso(job.completed_at),
    }
  } catch {
    return undefined
  }
}

// ── Mock Cues ─────────────────────────────────────────────────────────────────

export async function getMockCues(sceneCardId: string): Promise<MockCue[]> {
  const rows = await prisma.mockCue.findMany({
    where: { scene_card_id: sceneCardId },
    orderBy: { version_number: 'desc' },
  })
  return rows.map((c) => ({
    ...c,
    created_at: isoRequired(c.created_at),
    approved_at: iso(c.approved_at),
    composer_acknowledged_at: iso(c.composer_acknowledged_at),
    scored_at: iso(c.scored_at),
  }))
}

export async function getMockCue(id: string): Promise<MockCue | undefined> {
  const c = await prisma.mockCue.findUnique({ where: { id } })
  if (!c) return undefined
  return {
    ...c,
    created_at: isoRequired(c.created_at),
    approved_at: iso(c.approved_at),
    composer_acknowledged_at: iso(c.composer_acknowledged_at),
    scored_at: iso(c.scored_at),
  }
}

export async function createMockCue(
  data: Omit<MockCue, 'id' | 'created_at'>
): Promise<MockCue> {
  const c = await prisma.mockCue.create({
    data: {
      generation_job_id: data.generation_job_id,
      scene_card_id: data.scene_card_id,
      intent_version_id: data.intent_version_id,
      version_number: data.version_number,
      file_key: data.file_key,
      file_name: data.file_name,
      duration_sec: data.duration_sec,
      is_mock: data.is_mock,
      is_approved: data.is_approved,
      approved_by: data.approved_by,
      approved_at: data.approved_at ? new Date(data.approved_at) : null,
      composer_acknowledged: data.composer_acknowledged,
      composer_acknowledged_at: data.composer_acknowledged_at
        ? new Date(data.composer_acknowledged_at)
        : null,
      composer_notes: data.composer_notes,
    },
  })
  return {
    ...c,
    created_at: isoRequired(c.created_at),
    approved_at: iso(c.approved_at),
    composer_acknowledged_at: iso(c.composer_acknowledged_at),
    scored_at: iso(c.scored_at),
  }
}

export async function updateMockCue(
  id: string,
  data: Partial<MockCue>
): Promise<MockCue | undefined> {
  try {
    const c = await prisma.mockCue.update({
      where: { id },
      data: {
        is_approved: data.is_approved,
        approved_by: data.approved_by,
        approved_at:
          data.approved_at !== undefined
            ? data.approved_at ? new Date(data.approved_at) : null
            : undefined,
        composer_acknowledged: data.composer_acknowledged,
        composer_acknowledged_at:
          data.composer_acknowledged_at !== undefined
            ? data.composer_acknowledged_at ? new Date(data.composer_acknowledged_at) : null
            : undefined,
        composer_notes: data.composer_notes,
      },
    })
    return {
      ...c,
      created_at: isoRequired(c.created_at),
      approved_at: iso(c.approved_at),
      composer_acknowledged_at: iso(c.composer_acknowledged_at),
      scored_at: iso(c.scored_at),
    }
  } catch {
    return undefined
  }
}

export async function deleteMockCue(id: string): Promise<boolean> {
  try {
    await prisma.mockCue.delete({ where: { id } })
    return true
  } catch {
    return false
  }
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function getComments(sceneCardId: string): Promise<Comment[]> {
  const rows = await prisma.comment.findMany({
    where: { scene_card_id: sceneCardId },
    orderBy: { created_at: 'asc' },
  })
  return rows.map((c) => ({
    ...c,
    created_at: isoRequired(c.created_at),
  }))
}

export async function createComment(
  data: Omit<Comment, 'id' | 'created_at' | 'author'>
): Promise<Comment> {
  const c = await prisma.comment.create({
    data: {
      scene_card_id: data.scene_card_id,
      author_id: data.author_id,
      body: data.body,
    },
  })
  return { ...c, created_at: isoRequired(c.created_at) }
}
