'use client'

/*
 * Accept-invite action — editorial register, no shadcn primitives. Mirrors
 * the messagePage chrome's button vocabulary (ember CTA, dotted-underline
 * quiet link). Posts to /api/invite/accept; redirects to /projects/[id] on
 * success; surfaces a sign-in prompt when the API returns 401.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import s from './invite.module.css'

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
        setError('Sign in first to take your seat.')
        return
      }
      setError(data.error ?? 'Could not accept invite.')
      return
    }
    if (data.projectId) {
      router.push(`/projects/${data.projectId}`)
      router.refresh()
    }
  }

  const signInHref = `/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`
  const needsSignIn = error?.toLowerCase().includes('sign in')

  return (
    <div className={s.acceptBlock}>
      {error && (
        <p className={s.error}>
          <em>{error}</em>
        </p>
      )}
      <div className={s.actions}>
        {needsSignIn ? (
          <Link href={signInHref} className={`${s.btnPrimary} ${s.btnPrimary}`}>
            Sign in to accept
          </Link>
        ) : (
          <button
            type="button"
            className={`${s.btnPrimary} ${s.btnPrimary}`}
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? 'Joining…' : `Take your seat in "${projectTitle}"`}
          </button>
        )}
      </div>
    </div>
  )
}
