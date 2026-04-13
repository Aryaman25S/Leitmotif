import { betterAuth } from 'better-auth'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from './prisma'

const baseURL =
  process.env.BETTER_AUTH_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
  'http://localhost:3000'

/** Prefer `BETTER_AUTH_SECRET` (32+ chars). A dev placeholder is used when unset so `next build` succeeds — set a real secret in production. */
const DEV_AUTH_SECRET_PLACEHOLDER = 'dev-only-better-auth-secret-min-32-chars!'
const secret = process.env.BETTER_AUTH_SECRET?.trim() || DEV_AUTH_SECRET_PLACEHOLDER
if (process.env.NODE_ENV === 'production' && secret === DEV_AUTH_SECRET_PLACEHOLDER) {
  console.warn(
    '[leitmotif] BETTER_AUTH_SECRET is not set; auth uses an insecure placeholder. Set BETTER_AUTH_SECRET in production.'
  )
}

export const auth = betterAuth({
  baseURL,
  secret,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  trustedOrigins: [baseURL],
  plugins: [nextCookies()],
})
