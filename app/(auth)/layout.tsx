// Auth route group is a pass-through — each page brings its own chrome
// (the ticket route fills the viewport itself; recover renders a centered
// card directly).

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
