import { getSessionProfile } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile()
  if (!profile) {
    redirect('/sign-in')
  }

  return <>{children}</>
}
