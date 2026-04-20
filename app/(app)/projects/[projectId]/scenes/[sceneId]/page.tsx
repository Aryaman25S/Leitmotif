export const dynamic = 'force-dynamic'

import {
  getSceneCard,
  getProject,
  getLatestIntent,
  getGenerationSettings,
  getMockCues,
  getLatestJob,
  getComments,
  getProjectRoleForProfile,
} from '@/lib/store'
import { notFound, redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/session'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SceneIntentEditor from '@/components/vocabulary-bridge/SceneIntentEditor'
import GenerationWorkspace from '@/components/generation/GenerationWorkspace'
import SceneVideoUpload from '@/components/player/SceneVideoUpload'
import CommentThread from '@/components/generation/CommentThread'
import SceneMetaEditor from '@/components/scene/SceneMetaEditor'
import SceneTabs from '@/components/scene/SceneTabs'
import DeleteSceneButton from '@/components/scene/DeleteSceneButton'
import { getFileUrl } from '@/lib/storage'
import type { Comment } from '@/lib/store'
import { prisma } from '@/lib/prisma'
import { canDirect, canApprove, type EffectiveRole } from '@/lib/roles'

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
  const viewerCanDirect = canDirect(viewerRole)
  const viewerCanApprove = canApprove(viewerRole)

  const scene = await getSceneCard(sceneId)
  if (!scene || scene.project_id !== projectId) notFound()

  const project = await getProject(projectId)
  const latestIntent = await getLatestIntent(sceneId)
  const genSettings = await getGenerationSettings(projectId)
  const rawMockCues = await getMockCues(sceneId)
  const latestJob = await getLatestJob(sceneId)

  const jobIds = [...new Set(rawMockCues.map((c) => c.generation_job_id))]
  const jobs = jobIds.length
    ? await prisma.generationJob.findMany({
        where: { id: { in: jobIds } },
        select: { id: true, model_provider: true },
      })
    : []
  const providerByJob = Object.fromEntries(jobs.map((j) => [j.id, j.model_provider]))
  const mockCues = rawMockCues.map((c) => ({
    ...c,
    model_provider: providerByJob[c.generation_job_id] ?? null,
  }))
  const comments = await getComments(sceneId) as (Comment & { author?: { name: string | null; email: string } | null })[]

  const videoUrl = scene.video_file_key ? getFileUrl(scene.video_file_key) : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link href={`/projects/${projectId}`} className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3 w-3" />
          {project?.title}
        </Link>
        {viewerCanDirect && (
          <div className="ml-auto">
            <DeleteSceneButton sceneId={sceneId} projectId={projectId} />
          </div>
        )}
      </div>

      {/* Hero title with gradient motif */}
      <div className="scene-glow rounded-xl -mx-2 px-2 pb-5 mb-6">
        <div className="flex items-baseline gap-3 mb-2">
          <h1 className="text-xl font-semibold tracking-tight">{scene.label}</h1>
        </div>
        <SceneMetaEditor
          sceneId={sceneId}
          cueNumber={scene.cue_number}
          tcIn={scene.tc_in_smpte}
          tcOut={scene.tc_out_smpte}
          readOnly={!viewerCanDirect}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left column — inset panel */}
        <div className="space-y-5">
          <SceneVideoUpload
            sceneId={sceneId}
            videoUrl={videoUrl}
            durationSec={scene.video_duration_sec}
            readOnly={!viewerCanDirect}
          />

          <div className="rounded-xl bg-card/50 border border-border p-5">
            <SceneTabs
              commentCount={comments.length}
              intentContent={
                <SceneIntentEditor
                  sceneId={sceneId}
                  initialIntent={latestIntent ?? null}
                  durationSec={scene.video_duration_sec ?? 60}
                  genSettings={genSettings ?? null}
                  toneBrief={project?.tone_brief ?? null}
                  sceneLabel={scene.label}
                  readOnly={!viewerCanDirect}
                />
              }
              commentsContent={
                <CommentThread
                  sceneId={sceneId}
                  initialComments={comments.map((c) => ({
                    id: c.id,
                    body: c.body,
                    created_at: c.created_at,
                    profiles: c.author ?? null,
                  }))}
                />
              }
            />
          </div>
        </div>

        {/* Right column — elevated, sticky */}
        <div className="lg:sticky lg:top-16">
          <GenerationWorkspace
            sceneId={sceneId}
            mockCues={mockCues}
            latestJobStatus={(latestJob?.status ?? null) as 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | null}
            hasIntent={!!(latestIntent?.emotional_atmospheres?.length)}
            latestIntentId={latestIntent?.id ?? null}
            canGenerate={viewerCanDirect}
            canApproveCue={viewerCanApprove}
            defaultModelProvider={genSettings?.model_provider ?? 'stable_audio'}
          />
        </div>
      </div>
    </div>
  )
}
