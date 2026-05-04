'use client'

import { authClient } from '@/lib/auth-client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import s from './projects.module.css'
import { initialsOf } from './lib'

export function AccountMenu({ user }: { user: { name: string | null; email: string } }) {
  async function handleSignOut() {
    try {
      await authClient.signOut()
    } catch {
      // Hard-navigate so any stranded client state can't keep the user on /projects.
    }
    window.location.assign('/')
  }

  const display = user.name?.trim() || user.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={s['ll-mast-user']}>
        <span className={s['ll-user-mono']}>{initialsOf(user.name, user.email)}</span>
        <span className={s['ll-user-name']}>{display}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
          {user.email}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleSignOut()}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
