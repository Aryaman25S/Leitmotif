import { cache } from 'react'
import { headers } from 'next/headers'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Profile } from '@/lib/store'

function mapProfile(row: {
  id: string
  name: string | null
  email: string
  created_at: Date
}): Profile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    created_at: row.created_at.toISOString(),
  }
}

/** Upsert app Profile from Better Auth user (linked by email). */
export async function syncProfileFromBetterAuthUser(user: {
  email: string
  name?: string | null
}): Promise<Profile> {
  const email = user.email.trim().toLowerCase()
  const row = await prisma.profile.upsert({
    where: { email },
    create: {
      email,
      name: user.name?.trim() || null,
    },
    update: {
      ...(user.name != null && user.name.trim() !== ''
        ? { name: user.name.trim() }
        : {}),
    },
  })
  return mapProfile(row)
}

export const getSessionProfile = cache(async function getSessionProfile(): Promise<Profile | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.email) return null
  return syncProfileFromBetterAuthUser(session.user)
})

export async function getSessionProfileFromRequest(
  request: NextRequest
): Promise<Profile | null> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.email) return null
  return syncProfileFromBetterAuthUser(session.user)
}
