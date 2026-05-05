// Pass-through layout. The page renders its own LeitmotifWorld + masthead
// to match the production binder pattern (see app/(app)/projects/[projectId]).
export default function NewProjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
