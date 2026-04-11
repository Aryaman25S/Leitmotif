export const dynamic = 'force-dynamic'

import { getProjects } from '@/lib/store'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatDistanceToNow } from '@/lib/utils'
import { Plus, FolderOpen, Film, Tv, Clapperboard, Megaphone } from 'lucide-react'

const FORMAT_META: Record<string, { label: string; Icon: typeof Film }> = {
  feature:    { label: 'Feature',    Icon: Film },
  episodic:   { label: 'Episodic',   Icon: Tv },
  short:      { label: 'Short',      Icon: Clapperboard },
  commercial: { label: 'Commercial', Icon: Megaphone },
}

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Your active productions</p>
        </div>
        <Link href="/projects/new" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4 mr-1" />
          New project
        </Link>
      </div>

      {!projects.length ? (
        <div className="border border-dashed border-border rounded-lg p-14 text-center">
          <FolderOpen className="h-7 w-7 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">No projects yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Create a project to start building scene intent cards.
          </p>
          <Link href="/projects/new" className={cn(buttonVariants({ size: 'sm' }))}>
            <Plus className="h-4 w-4 mr-1" />
            New project
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((project) => {
            const meta = FORMAT_META[project.format]
            const FormatIcon = meta?.Icon ?? Film
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-primary/40 transition-all cursor-pointer h-full group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-medium leading-tight">
                        {project.title}
                      </CardTitle>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <FormatIcon className="h-3 w-3" />
                        {meta?.label ?? project.format}
                      </span>
                    </div>
                    {project.tone_brief && (
                      <CardDescription className="text-xs line-clamp-2 mt-1">
                        {project.tone_brief}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(project.updated_at))} ago
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
