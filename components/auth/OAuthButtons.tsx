'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import type { OAuthProviderId } from '@/lib/oauth-types'

const LABELS: Record<OAuthProviderId, string> = {
  google: 'Continue with Google',
  github: 'Continue with GitHub',
}

type Props = {
  providers: OAuthProviderId[]
  callbackURL: string
}

export function OAuthButtons({ providers, callbackURL }: Props) {
  const [loading, setLoading] = useState<OAuthProviderId | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (providers.length === 0) return null

  async function onOAuth(provider: OAuthProviderId) {
    setError(null)
    setLoading(provider)
    const { error: oauthError } = await authClient.signIn.social({
      provider,
      callbackURL,
    })
    setLoading(null)
    if (oauthError) {
      setError(oauthError.message ?? 'Sign-in failed')
    }
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive text-center">{error}</p> : null}
      <div className="flex flex-col gap-2">
        {providers.map((id) => (
          <Button
            key={id}
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading !== null}
            onClick={() => onOAuth(id)}
          >
            {loading === id ? 'Redirecting…' : LABELS[id]}
          </Button>
        ))}
      </div>
    </div>
  )
}
