// New project — "Order of Production." The title page of a binder. Server
// shell wraps the form in <LeitmotifWorld> + <Masthead> so the world tokens
// (theater/print) and grain/vignette are painted globally; the form itself
// is a client island so the title input, format radio, and roster invites
// are interactive.

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/session'
import { getProjectCountForOwner } from '@/lib/store'
import { LeitmotifWorld } from '@/components/landing/LeitmotifWorld'
import { Masthead } from '../[projectId]/parts'
import NewProjectForm from './NewProjectForm'

export default async function NewProjectPage() {
  const profile = await getSessionProfile()
  if (!profile) redirect('/sign-in')

  const now = new Date()
  const user = { name: profile.name, email: profile.email }
  const ownedCount = await getProjectCountForOwner(profile.id)
  const nextProductionNumber = ownedCount + 1

  return (
    <LeitmotifWorld>
      <Masthead user={user} caption="Opening a production" now={now} />
      <NewProjectForm
        ownerName={profile.name?.trim() || profile.email}
        ownerEmail={profile.email}
        nextProductionNumber={nextProductionNumber}
      />
    </LeitmotifWorld>
  )
}
