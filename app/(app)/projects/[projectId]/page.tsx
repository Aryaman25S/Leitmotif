export const dynamic = 'force-dynamic'

import { getProject, getSceneCards, getProjectRoleForProfile } from '@/lib/store'
import { notFound, redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/session'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Settings, Film } from 'lucide-react'
import AddSceneDialog from '@/components/generation/AddSceneDialog'
import { canDirect, type EffectiveRole } from '@/lib/roles'

const STATUS_CONFIG: Record<string, { label: string; dotClass: string }> = {
  untagged:          { label: 'No intent',       dotClass: 'bg-status-untagged'   },
  tagged:            { label: 'Tagged',           dotClass: 'bg-status-tagged'     },
  generating:        { label: 'Generating…',      dotClass: 'bg-status-generating animate-pulse' },
  awaiting_approval: { label: 'Ready to review',  dotClass: 'bg-status-review'     },
  brief_sent:        { label: 'Brief sent',        dotClass: 'bg-status-brief-sent' },
  complete:          { label: 'Complete',          dotClass: 'bg-status-complete'   },
}

const FORMAT_LABELS: Record<string, string> = {
  feature: 'Feature', episodic: 'Episodic', short: 'Short', commercial: 'Commercial',
}

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

  const project = await getProject(projectId)
  if (!project) notFound()

  const scenes = await getSceneCards(projectId)
  const viewerCanDirect = canDirect(viewerRole)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold">{project.title}</h1>
            <Badge variant="secondary" className="text-xs">
              {FORMAT_LABELS[project.format] ?? project.format}
            </Badge>
          </div>
          {project.tone_brief && (
            <p className="text-sm text-muted-foreground max-w-lg">{project.tone_brief}</p>
          )}
        </div>
        {viewerCanDirect && (
          <Link
            href={`/projects/${projectId}/settings`}
            className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
            title="Project settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        )}
      </div>

      <Separator className="my-6" />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Scene cards ({scenes.length})
        </h2>
        {viewerCanDirect && <AddSceneDialog projectId={projectId} sceneCount={scenes.length} />}
      </div>

      {!scenes.length ? (
        <div className="border border-dashed border-border rounded-lg p-14 text-center">
          <Film className="h-7 w-7 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">No scene cards yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {viewerCanDirect
              ? 'Add a scene card for each cue. Upload a clip, tag intent, and generate a mock cue.'
              : 'No scene cards have been added to this project yet.'}
          </p>
          {viewerCanDirect && <AddSceneDialog projectId={projectId} sceneCount={0} />}
        </div>
      ) : (
        <div className="space-y-2">
          {scenes.map((scene, i) => {
            const config = STATUS_CONFIG[scene.status] ?? STATUS_CONFIG.untagged
            return (
              <Link
                key={scene.id}
                href={`/projects/${projectId}/scenes/${scene.id}`}
                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-foreground/30 hover:bg-accent/30 transition-all group"
              >
                <span className="text-xs font-mono text-muted-foreground w-8 shrink-0">
                  {scene.cue_number ?? String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{scene.label}</p>
                  {(scene.tc_in_smpte || scene.tc_out_smpte) && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {scene.tc_in_smpte ?? '—'} → {scene.tc_out_smpte ?? '—'}
                    </p>
                  )}
                </div>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <span className={cn('h-2 w-2 rounded-full', config.dotClass)} />
                  {config.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
