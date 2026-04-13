import AppNav from '@/components/layout/AppNav'
import { getSessionProfile } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile()
  if (!profile) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav user={{ email: profile.email, name: profile.name ?? '' }} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
