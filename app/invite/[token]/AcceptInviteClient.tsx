'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export default function AcceptInviteClient({
  token,
  projectTitle,
}: {
  token: string
  projectTitle: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      if (res.status === 401) {
        setError('Please sign in to accept this invite.')
        return
      }
      setError(data.error ?? 'Could not accept invite')
      return
    }
    if (data.projectId) {
      router.push(`/projects/${data.projectId}`)
      router.refresh()
    }
  }

  const signInHref = `/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`

  return (
    <div className="space-y-4">
      {error && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          {error.includes('sign in') ? (
            <Link href={signInHref} className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
              Sign in
            </Link>
          ) : null}
        </div>
      )}
      <Button onClick={handleAccept} disabled={loading} className="w-full sm:w-auto gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Join &ldquo;{projectTitle}&rdquo;
      </Button>
      <p className="text-xs text-muted-foreground">
        You must be signed in with your Leitmotif account to join this project.
      </p>
    </div>
  )
}
