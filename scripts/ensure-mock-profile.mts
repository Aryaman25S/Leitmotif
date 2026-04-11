/**
 * Inserts the legacy dev Profile row if missing so Project.owner_id FK can be applied.
 * Run before `prisma db push` when projects reference mock-user-01.
 */
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const { prisma } = await import('../lib/prisma')

const MOCK_ID = 'mock-user-01'
const MOCK_EMAIL = 'director@local.dev'
const MOCK_NAME = 'Local Director'
const MOCK_ROLE = 'director'

await prisma
  .$executeRaw`
  INSERT INTO "Profile" ("id", "email", "name", "role_default", "created_at")
  VALUES (${MOCK_ID}, ${MOCK_EMAIL}, ${MOCK_NAME}, ${MOCK_ROLE}, NOW())
  ON CONFLICT ("id") DO NOTHING
`
  .then(() => console.log('ensure-mock-profile: upserted', MOCK_ID))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
