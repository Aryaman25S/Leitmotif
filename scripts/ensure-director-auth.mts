/**
 * Legacy mock data uses Profile id `mock-user-01` and email `director@local.dev`.
 * That row never had Better Auth credentials. This script:
 *
 * 1. Upserts the Profile row (`mock-user-01` / `director@local.dev`) so project FKs still resolve.
 * 2. Deletes any existing Better Auth `user` row with that email (accounts/sessions cascade).
 * 3. Calls Better Auth `signUpEmail` with a known password.
 *
 * Usage (from `leitmotif/`):
 *   npm run ensure:director-auth
 *
 * Optional env:
 *   DIRECTOR_DEV_EMAIL     (default: director@local.dev)
 *   DIRECTOR_DEV_PASSWORD  (default: DirectorDev-local!)
 *   DIRECTOR_DEV_NAME      (default: Local Director)
 *
 * Then sign in at /sign-in. Session maps to the same Profile by email (`lib/session.ts`),
 * so projects with `owner_id = mock-user-01` stay visible.
 */

import { resolve } from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const MOCK_PROFILE_ID = 'mock-user-01'
const email = (process.env.DIRECTOR_DEV_EMAIL ?? 'director@local.dev').toLowerCase().trim()
const password = process.env.DIRECTOR_DEV_PASSWORD ?? 'DirectorDev-local!'
const name = (process.env.DIRECTOR_DEV_NAME ?? 'Local Director').trim() || 'Local Director'

const { prisma } = await import('../lib/prisma')
const { auth } = await import('../lib/auth')

async function main() {
  await prisma.profile.upsert({
    where: { id: MOCK_PROFILE_ID },
    create: {
      id: MOCK_PROFILE_ID,
      email,
      name,
      role_default: 'director',
    },
    update: {
      email,
      name,
    },
  })
  console.log(`Profile OK: id=${MOCK_PROFILE_ID} email=${email}`)

  const deleted = await prisma.user.deleteMany({ where: { email } })
  if (deleted.count > 0) {
    console.log(
      `Removed ${deleted.count} existing Better Auth user(s) for ${email} (sessions/accounts cascade).`
    )
  }

  const result = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
    },
  })

  if (result && typeof result === 'object' && 'error' in result && result.error) {
    console.error('signUpEmail failed:', result.error)
    process.exit(1)
  }

  console.log('')
  console.log('Better Auth user created. Sign in at /sign-in with:')
  console.log(`  Email:    ${email}`)
  console.log(`  Password: ${password}`)
  console.log('')
  console.log(
    'Maps to the same Profile as the old mock user (by email); existing projects with that owner stay yours.'
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
