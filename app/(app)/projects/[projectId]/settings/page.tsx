// Project settings — Form 7B · Production Record. The "back of the clipboard"
// administrative surface for a production. Server-rendered shell; the form
// itself is a client island in ./SettingsForm.
//
// TODO(settings-redesign): this redesign drops the edit surface for
// tone_brief, instrumentation_families, era_reference, budget_reality, and
// do_not_generate. They still feed lib/prompts/buildGenerationPrompt.ts —
// whatever is in the DB at strike time is what the generator sees. New
// projects fall back to schema defaults. A new edit surface is needed; this
// is a known regression to be addressed in a follow-on design pass.

export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/session'
import {
  getProjectWithOwner,
  getProjectMembers,
  getProjectRoleForProfile,
  getGenerationSettings,
  getProjectBinder,
  getStrikeManifest,
} from '@/lib/store'
import { canDirect, canManage, type EffectiveRole } from '@/lib/roles'
import { LeitmotifWorld } from '@/components/landing/LeitmotifWorld'
import { Masthead } from '../parts'
import SettingsForm from './SettingsForm'

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const profile = await getSessionProfile()
  if (!profile) redirect('/sign-in')

  const viewerRole = (await getProjectRoleForProfile(profile.id, projectId)) as EffectiveRole | null
  if (!viewerRole) notFound()

  const [projectAndOwner, members, settings, binder, strikeManifest] = await Promise.all([
    getProjectWithOwner(projectId),
    getProjectMembers(projectId),
    getGenerationSettings(projectId),
    getProjectBinder(projectId),
    getStrikeManifest(projectId),
  ])
  if (!projectAndOwner) notFound()
  const { project, owner } = projectAndOwner

  const totalCues = binder.scenes.length
  const openCues =
    binder.standing.spotting +
    binder.standing.intent +
    binder.standing.rendering +
    binder.standing.for_approval

  // Owner appears as roster row 01 — sourced from Project.owner, not from
  // project_members. Other rows are accepted-or-pending members, in invite
  // order. The viewer's own row gets a `you` smallcaps; owner row also gets
  // a "signed the production" credit.
  const owners = {
    profile_id: project.owner_id,
    name: owner?.name ?? null,
    email: owner?.email ?? '',
    invited_at: project.created_at,
  }

  const memberRows = members
    // The owner is shown as row 01 from Project.owner. If the owner ever
    // appears in project_members (rare — old data), strip the duplicate.
    .filter((m) => m.profile?.email !== owner?.email && m.user_id !== project.owner_id)
    .map((m) => ({
      id: m.id,
      name: m.profile?.name ?? null,
      email: m.profile?.email ?? m.invite_email ?? '',
      role: m.role_on_project,
      invited_at: m.invited_at,
      accepted_at: m.accepted_at,
      is_pending: m.accepted_at == null,
    }))
    .filter((m) => m.email)

  const acceptedCount = memberRows.filter((m) => !m.is_pending).length
  const pendingCount = memberRows.filter((m) => m.is_pending).length

  const user = { name: profile.name, email: profile.email }
  const viewerIsOwner = canManage(viewerRole)
  const viewerCanDirect = canDirect(viewerRole)
  const viewerProfileId = profile.id

  return (
    <LeitmotifWorld>
      <SettingsShellClient
        user={user}
        project={{
          id: project.id,
          title: project.title,
          format: project.format,
          runtime_minutes: project.runtime_minutes,
          slate: project.slate,
          created_at: project.created_at,
          updated_at: project.updated_at,
        }}
        modelProvider={settings?.model_provider ?? 'lyria'}
        owner={owners}
        members={memberRows}
        acceptedCount={acceptedCount + 1 /* +1 for owner */}
        pendingCount={pendingCount}
        totalCues={totalCues}
        openCues={openCues}
        reelCount={binder.reels.length}
        strikeManifest={strikeManifest}
        viewerIsOwner={viewerIsOwner}
        viewerCanDirect={viewerCanDirect}
        viewerProfileId={viewerProfileId}
      />
    </LeitmotifWorld>
  )
}

// Thin wrapper so we can render the masthead (a server-friendly component)
// adjacent to the client-island form without leaking a "use client" boundary
// around the masthead itself.
function SettingsShellClient(props: React.ComponentProps<typeof SettingsForm>) {
  const now = new Date()
  return (
    <>
      <Masthead user={props.user} caption="In the production office" now={now} />
      <SettingsForm {...props} />
    </>
  )
}
