import AppNav from '@/components/layout/AppNav'

export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1">{children}</main>
    </div>
  )
}
