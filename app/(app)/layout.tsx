import AppNav from '@/components/layout/AppNav'
import { requireSessionUser } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser()

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav user={{ email: user.email, name: user.name ?? '' }} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
