import { Suspense } from 'react'
import SignInForm from './SignInForm'
import { getEnabledOAuthProviderIds } from '@/lib/oauth-providers'

export default function SignInPage() {
  const oauthProviders = getEnabledOAuthProviderIds()
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SignInForm oauthProviders={oauthProviders} />
    </Suspense>
  )
}
