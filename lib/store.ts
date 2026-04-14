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
  role_default: string | null
  created_at: string
}

export interface Project {
  id: string
  title: string
  format: string
  tone_brief: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

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
  cue_number: string | null
  label: string
  sort_order: number
  tc_in_smpte: string | null
  tc_out_smpte: string | null
  picture_version_label: string | null
  video_file_key: string | null
  video_duration_sec: number | null
  status: string
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
  }))
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

export async function getProject(id: string): Promise<Project | undefined> {
  const p = await prisma.project.findUnique({ where: { id } })
  if (!p) return undefined
  return {
    ...p,
    created_at: isoRequired(p.created_at),
    updated_at: isoRequired(p.updated_at),
    tone_brief: p.tone_brief ?? null,
  }
}

export async function createProject(
  data: Omit<Project, 'id' | 'created_at' | 'updated_at'>
): Promise<Project> {
  const p = await prisma.project.create({
    data: {
      title: data.title,
      format: data.format,
      tone_brief: data.tone_brief,
      owner_id: data.owner_id,
    },
  })
  return {
    ...p,
    created_at: isoRequired(p.created_at),
    updated_at: isoRequired(p.updated_at),
    tone_brief: p.tone_brief ?? null,
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
      },
    })
    return {
      ...p,
      created_at: isoRequired(p.created_at),
      updated_at: isoRequired(p.updated_at),
      tone_brief: p.tone_brief ?? null,
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
      cue_number: data.cue_number,
      label: data.label,
      sort_order: data.sort_order,
      tc_in_smpte: data.tc_in_smpte,
      tc_out_smpte: data.tc_out_smpte,
      picture_version_label: data.picture_version_label,
      video_file_key: data.video_file_key,
      video_duration_sec: data.video_duration_sec,
      status: data.status,
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
        cue_number: data.cue_number,
        label: data.label,
        sort_order: data.sort_order,
        tc_in_smpte: data.tc_in_smpte,
        tc_out_smpte: data.tc_out_smpte,
        picture_version_label: data.picture_version_label,
        video_file_key: data.video_file_key,
        video_duration_sec: data.video_duration_sec,
        status: data.status,
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
    }
  } catch {
    return undefined
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
