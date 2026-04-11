export const dynamic = 'force-dynamic'

import { getSceneCard, getProject, getLatestIntent, getGenerationSettings, getMockCues, getLatestJob, getComments } from '@/lib/store'
import { notFound } from 'next/navigation'
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

export default async function ScenePage({
  params,
}: {
  params: Promise<{ projectId: string; sceneId: string }>
}) {
  const { projectId, sceneId } = await params

  const scene = await getSceneCard(sceneId)
  if (!scene || scene.project_id !== projectId) notFound()

  const project = await getProject(projectId)
  const latestIntent = await getLatestIntent(sceneId)
  const genSettings = await getGenerationSettings(projectId)
  const mockCues = await getMockCues(sceneId)
  const latestJob = await getLatestJob(sceneId)
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
        <div className="ml-auto">
          <DeleteSceneButton sceneId={sceneId} projectId={projectId} />
        </div>
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
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left column — inset panel */}
        <div className="space-y-5">
          <SceneVideoUpload
            sceneId={sceneId}
            projectId={projectId}
            videoUrl={videoUrl}
            durationSec={scene.video_duration_sec}
          />

          <div className="rounded-xl bg-card/50 border border-border p-5">
            <SceneTabs
              commentCount={comments.length}
              intentContent={
                <SceneIntentEditor
                  sceneId={sceneId}
                  projectId={projectId}
                  initialIntent={latestIntent ?? null}
                  durationSec={scene.video_duration_sec ?? 60}
                  genSettings={genSettings ?? null}
                  toneBrief={project?.tone_brief ?? null}
                  sceneLabel={scene.label}
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
            projectId={projectId}
            sceneLabel={scene.label}
            videoUrl={videoUrl}
            mockCues={mockCues}
            latestJobStatus={(latestJob?.status ?? null) as 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | null}
            hasIntent={!!(latestIntent?.emotional_atmospheres?.length)}
            latestIntentId={latestIntent?.id ?? null}
          />
        </div>
      </div>
    </div>
  )
}
