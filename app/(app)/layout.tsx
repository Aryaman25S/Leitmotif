import AppNav from '@/components/layout/AppNav'
import { getMockUser } from '@/lib/mock-auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = getMockUser()

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav user={{ email: user.email, name: user.name ?? '' }} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
