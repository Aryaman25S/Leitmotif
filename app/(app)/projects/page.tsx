export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { LeitmotifWorld } from '@/components/landing/LeitmotifWorld'
import { getSessionProfile } from '@/lib/session'
import { getProjectsListForProfile } from '@/lib/store'
import s from './projects.module.css'
import { ProjectsBill } from './ProjectsBill'
import { Greeting, Masthead, PageFooter } from './parts'
import { totalAttention } from './lib'

export default async function ProjectsPage() {
  const profile = await getSessionProfile()
  if (!profile) redirect('/sign-in')

  const rows = await getProjectsListForProfile(profile.id)
  const now = new Date()
  const attentionCount = totalAttention(rows)
  const activeCount = rows.length

  const user = { name: profile.name, email: profile.email }

  return (
    <LeitmotifWorld>
      <div className={s['ll-page']}>
        <Masthead user={user} now={now} />
        <ProjectsBill
          rows={rows}
          greeting={
            <Greeting
              user={user}
              now={now}
              attentionCount={attentionCount}
              activeCount={activeCount}
            />
          }
        />
        <PageFooter />
      </div>
    </LeitmotifWorld>
  )
}
