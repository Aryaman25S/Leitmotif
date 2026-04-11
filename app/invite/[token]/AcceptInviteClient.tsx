'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
      setError(data.error ?? 'Could not accept invite')
      return
    }
    if (data.projectId) {
      router.push(`/projects/${data.projectId}`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleAccept} disabled={loading} className="w-full sm:w-auto gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Join &ldquo;{projectTitle}&rdquo;
      </Button>
      <p className="text-xs text-muted-foreground">
        In production, each person would sign in with their own account. For now this attaches the
        invite to the dev mock user.
      </p>
    </div>
  )
}
