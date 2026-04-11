import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const { prisma } = await import('../lib/prisma')

async function main() {
  const orphans = await prisma.$queryRaw<
    { owner_id: string }[]
  >`SELECT DISTINCT p.owner_id FROM "Project" p
    LEFT JOIN "Profile" u ON u.id = p.owner_id
    WHERE u.id IS NULL`
  console.log('Projects with missing Profile for owner_id:', orphans)

  const profiles = await prisma.user.findMany({ select: { id: true, email: true } })
  console.log('Profile count:', profiles.length, profiles.slice(0, 5))
}

await main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
