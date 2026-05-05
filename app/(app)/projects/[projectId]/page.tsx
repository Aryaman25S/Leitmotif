export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/session'
import {
  getProjectWithOwner,
  getProjectBinder,
  getProjectMembers,
  getProjectRoleForProfile,
  getGenerationSettings,
} from '@/lib/store'
import { canApprove, canDirect, type EffectiveRole } from '@/lib/roles'
import { LeitmotifWorld } from '@/components/landing/LeitmotifWorld'
import s from './binder.module.css'
import { Masthead, PageFooter } from './parts'
import ProjectBinder from './ProjectBinder'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const profile = await getSessionProfile()
  if (!profile) redirect('/sign-in')

  const viewerRole = (await getProjectRoleForProfile(profile.id, projectId)) as EffectiveRole | null
  if (!viewerRole) notFound()

  const [projectAndOwner, binder, members, settings] = await Promise.all([
    getProjectWithOwner(projectId),
    getProjectBinder(projectId),
    getProjectMembers(projectId),
    getGenerationSettings(projectId),
  ])
  if (!projectAndOwner) notFound()
  const { project, owner } = projectAndOwner

  // Members: keep the accepted ones (and pending invites with an email so they
  // can be shown as muted "Invited"), then strip the row that represents
  // the owner re-invited as a member (rare but possible).
  const acceptedMembers = members
    .filter((m) => m.accepted_at != null)
    .filter((m) => m.profile?.email !== owner?.email)
    .map((m) => ({
      user_id: m.user_id,
      role: m.role_on_project,
      name: m.profile?.name ?? null,
      email: m.profile?.email ?? m.invite_email ?? '',
    }))
    .filter((m) => m.email)

  const ownerName = owner?.name ?? null
  const ownerEmail = owner?.email ?? profile.email

  const user = { name: profile.name, email: profile.email }
  const now = new Date()

  return (
    <LeitmotifWorld>
      <div className={s.page}>
        <Masthead user={user} productionTitle={project.title} now={now} />
        <ProjectBinder
          projectId={project.id}
          projectTitle={project.title}
          format={project.format}
          toneBrief={project.tone_brief}
          runtimeMinutes={project.runtime_minutes}
          slate={project.slate}
          era={settings?.era_reference ?? null}
          ownerName={ownerName}
          ownerEmail={ownerEmail || profile.email}
          ownerRole="owner"
          viewer={user}
          members={acceptedMembers}
          binder={binder}
          canDirect={canDirect(viewerRole)}
          canApprove={canApprove(viewerRole)}
        />
        <PageFooter projectTitle={project.title} />
      </div>
    </LeitmotifWorld>
  )
}
