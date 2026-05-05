import Link from 'next/link'

// TODO: replace with real password-recovery flow. The "Lost cipher?" affordance
// on the sign-in ticket links here so the missing flow stays visible during
// design review rather than being silently disabled.

export default function RecoverPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Password recovery — coming soon</h1>
        <p>
          The recovery flow isn&apos;t built yet. If you&apos;re locked out, ask the
          person who invited you to reset your access from inside the project.
        </p>
        <p>
          <Link href="/sign-in" className="text-foreground underline underline-offset-2">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
