/**
 * Prisma client singleton for Next.js (Prisma 7 + pg driver adapter).
 *
 * In Prisma 7, the connection URL is passed directly to the `pg` library.
 * The `?pgbouncer=true` flag is NOT understood by `pg` — it gets stripped.
 * Prepared statements are disabled by default in @prisma/adapter-pg (no
 * preparedStatementNameGenerator provided), which is required for Supabase's
 * pgbouncer transaction-mode pooler.
 *
 * DATABASE_URL  = Transaction Pooler (port 6543) — used at runtime
 * DIRECT_URL    = Session Pooler (port 5432)     — used for migrations only
 */

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL ?? ''
  // Strip the Prisma-engine-only flag — pg's URL parser doesn't understand it
  const connectionString = rawUrl.replace(/[?&]pgbouncer=true/i, '').replace(/\?$/, '')

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = global.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma
}
