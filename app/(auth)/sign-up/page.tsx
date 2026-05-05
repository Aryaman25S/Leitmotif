import { Suspense } from 'react'
import { TicketAuth } from '@/components/auth/TicketAuth'
import { getEnabledOAuthProviderIds } from '@/lib/oauth-providers'

export default function SignUpPage() {
  const oauthProviders = getEnabledOAuthProviderIds()
  return (
    <Suspense fallback={null}>
      <TicketAuth initialMode="signup" oauthProviders={oauthProviders} />
    </Suspense>
  )
}
