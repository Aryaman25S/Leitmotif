'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Music2, ChevronDown, ChevronRight } from 'lucide-react'

interface AppNavProps {
  user: { email: string; name: string }
  projectTitle?: string
}

export default function AppNav({ user, projectTitle }: AppNavProps) {
  const pathname = usePathname()

  async function handleSignOut() {
    try {
      await authClient.signOut()
    } catch {
      // Still hard-navigate so cookie/session client state cannot strand the user on /projects.
    }
    window.location.assign('/')
  }

  // Derive project context from the URL when no explicit title is passed
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/)
  const isInProject = !!projectMatch

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          <Link href="/projects" className="flex items-center gap-2 font-semibold shrink-0">
            <Music2 className="h-4 w-4 text-primary" />
            Leitmotif
          </Link>
          {isInProject && projectTitle && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <Link
                href={`/projects/${projectMatch![1]}`}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {projectTitle}
              </Link>
            </>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1 text-muted-foreground')}
          >
            {user.name || user.email}
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
              {user.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleSignOut()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
