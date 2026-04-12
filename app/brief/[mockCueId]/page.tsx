export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'

export default async function BriefPage({
  params,
}: {
  params: Promise<{ mockCueId: string }>
}) {
  await params
  notFound()
}
