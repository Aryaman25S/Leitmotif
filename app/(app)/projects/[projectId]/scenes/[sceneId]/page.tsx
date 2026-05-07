export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/session'
import {
  getSceneCard,
  getProjectWithOwner,
  getLatestIntent,
  getGenerationSettings,
  getMockCues,
  getLatestJob,
  getProjectRoleForProfile,
  getProjectBinder,
  getProjectMembers,
  getComments,
  getCommentCount,
} from '@/lib/store'
import { canDirect, canApprove, type EffectiveRole } from '@/lib/roles'
import { getFileUrl } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { LeitmotifWorld } from '@/components/landing/LeitmotifWorld'
import { Masthead } from '@/app/(app)/projects/[projectId]/parts'
import binderStyles from '@/app/(app)/projects/[projectId]/binder.module.css'
import SceneEditor, { type MockCueWithProvider } from './SceneEditor'
import { reelDisplayName, durationFromSmpte, formatVideoDuration } from '@/app/(app)/projects/[projectId]/lib'

export default async function ScenePage({
  params,
}: {
  params: Promise<{ projectId: string; sceneId: string }>
}) {
  const { projectId, sceneId } = await params

  const profile = await getSessionProfile()
  if (!profile) redirect('/sign-in')

  const viewerRole = (await getProjectRoleForProfile(profile.id, projectId)) as EffectiveRole | null
  if (!viewerRole) notFound()

  const scene = await getSceneCard(sceneId)
  if (!scene || scene.project_id !== projectId) notFound()

  // Single round of parallel reads — page renders once everything is in.
  const [projectAndOwner, latestIntent, genSettings, rawCues, latestJob, binder, members, commentsPage, commentTotal] =
    await Promise.all([
      getProjectWithOwner(projectId),
      getLatestIntent(sceneId),
      getGenerationSettings(projectId),
      getMockCues(sceneId),
      getLatestJob(sceneId),
      getProjectBinder(projectId),
      getProjectMembers(projectId),
      getComments(sceneId, { limit: 10 }),
      getCommentCount(sceneId),
    ])
  if (!projectAndOwner) notFound()
  const project = projectAndOwner.project

  // Decorate cues with provider for the version stack badge.
  const jobIds = [...new Set(rawCues.map((c) => c.generation_job_id))]
  const jobs = jobIds.length
    ? await prisma.generationJob.findMany({
        where: { id: { in: jobIds } },
        select: { id: true, model_provider: true, started_at: true, queued_at: true },
      })
    : []
  const providerByJob = Object.fromEntries(jobs.map((j) => [j.id, j.model_provider]))
  const mockCues: MockCueWithProvider[] = rawCues.map((c) => ({
    ...c,
    model_provider: providerByJob[c.generation_job_id] ?? null,
  }))

  // Reel + cue position for the slate.
  const reel = binder.reels.find((r) => r.id === scene.reel_id) ?? null
  const reelDisp = reel ? reelDisplayName(reel.name, reel.cue_position) : { positional: 'Reel', subtitle: null }
  const cuePosition = Math.max(1, binder.scenes.findIndex((s) => s.id === sceneId) + 1)
  const totalCues = binder.scenes.length || 1

  // Recipients line — rendered as a fixed-form sentence the editor can drop in
  // verbatim; we do the join here so the client doesn't need role-display
  // helpers. Keep it short — long lists get truncated.
  const acceptedMembers = members.filter((m) => m.accepted_at != null)
  const composers = acceptedMembers.filter((m) => m.role_on_project === 'composer')
  const supervisors = acceptedMembers.filter((m) => m.role_on_project === 'music_supervisor')
  const recipients = formatRecipients(composers, supervisors)

  // Time-of-day for the masthead. Server-only — user-TZ is a TODO.
  const now = new Date()
  const user = { name: profile.name, email: profile.email }

  // Intent count (for the delivery footer "intent v18" treatment).
  const intentVersionsCount = await prisma.intentVersion.count({ where: { scene_card_id: sceneId } })

  const videoUrl = scene.video_file_key ? getFileUrl(scene.video_file_key) : null
  const durationStr = scene.tc_in_smpte && scene.tc_out_smpte
    ? durationFromSmpte(scene.tc_in_smpte, scene.tc_out_smpte)
    : formatVideoDuration(scene.video_duration_sec)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''

  return (
    <LeitmotifWorld>
      <div className={binderStyles.page}>
        <Masthead user={user} productionTitle={project.title} now={now} />
        <SceneEditor
          sceneId={sceneId}
          projectId={projectId}
          projectTitle={project.title}
          reelLabel={reelDisp.positional}
          reelSubtitle={reelDisp.subtitle}
          cuePosition={cuePosition}
          totalCues={totalCues}
          cueNumber={scene.cue_number}
          sceneLabel={scene.label}
          tcIn={scene.tc_in_smpte}
          tcOut={scene.tc_out_smpte}
          durationStr={durationStr}
          videoUrl={videoUrl}
          videoDurationSec={scene.video_duration_sec}
          initialIntent={latestIntent ?? null}
          initialScreenplay={scene.screenplay_text}
          initialMockCues={mockCues}
          initialJobStatus={(latestJob?.status ?? null) as 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | null}
          initialJobStartedAt={latestJob?.started_at ?? latestJob?.queued_at ?? null}
          initialJobError={latestJob?.status === 'failed' ? latestJob.error_message ?? null : null}
          genSettings={genSettings ?? null}
          toneBrief={project.tone_brief}
          defaultModelProvider={genSettings?.model_provider ?? 'lyria'}
          canDirect={canDirect(viewerRole)}
          canApprove={canApprove(viewerRole)}
          recipients={recipients}
          appUrl={appUrl}
          intentVersionsCount={intentVersionsCount}
          initialComments={commentsPage.comments}
          initialCommentsHasMore={commentsPage.hasMore}
          initialCommentTotal={commentTotal}
        />
      </div>
    </LeitmotifWorld>
  )
}

interface MemberRow {
  user_id: string | null
  role_on_project: string
  invite_email: string | null
  profile?: { name: string | null; email: string } | null
}

function formatRecipients(composers: MemberRow[], supervisors: MemberRow[]): string {
  const display = (m: MemberRow): string =>
    m.profile?.name?.trim() ||
    m.profile?.email?.split('@')[0] ||
    m.invite_email?.split('@')[0] ||
    'collaborator'

  const tagged = (rows: MemberRow[], role: string): string[] =>
    rows.map((m) => `${display(m)} (${role})`)

  const all = [...tagged(composers, 'composer'), ...tagged(supervisors, 'music supervisor')]
  if (all.length === 0) return ''
  if (all.length === 1) return `Sent to ${all[0]}.`
  if (all.length === 2) return `Sent to ${all[0]} & ${all[1]}.`
  return `Sent to ${all.slice(0, -1).join(', ')}, & ${all[all.length - 1]}.`
}
