'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUpForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: signError } = await authClient.signUp.email({
      email: email.trim(),
      password,
      name: name.trim() || email.trim().split('@')[0] || 'User',
      callbackURL: '/projects',
    })
    setLoading(false)
    if (signError) {
      setError(signError.message ?? 'Sign up failed')
      return
    }
    router.push('/projects')
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Create account</h1>
        <p className="text-sm text-muted-foreground mt-1">Start translating intent into direction</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Director name"
          />
        </div>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-foreground underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  )
}
