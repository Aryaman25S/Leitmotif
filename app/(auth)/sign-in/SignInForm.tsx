'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import type { OAuthProviderId } from '@/lib/oauth-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  oauthProviders?: OAuthProviderId[]
}

export default function SignInForm({ oauthProviders = [] }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/projects'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: signError } = await authClient.signIn.email({
      email: email.trim(),
      password,
      callbackURL: next,
    })
    setLoading(false)
    if (signError) {
      setError(signError.message ?? 'Sign in failed')
      return
    }
    router.push(next)
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground mt-1">Leitmotif — film scoring intent</p>
      </div>
      {oauthProviders.length > 0 ? (
        <>
          <OAuthButtons providers={oauthProviders} callbackURL={next} />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or with email</span>
            </div>
          </div>
        </>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        No account?{' '}
        <Link href="/sign-up" className="text-foreground underline underline-offset-2">
          Create one
        </Link>
      </p>
    </div>
  )
}
