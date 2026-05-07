// The project-detail page owns its own programme masthead (same pattern as
// the projects bill at app/(app)/projects/page.tsx), so this layout is just a
// pass-through.
export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
