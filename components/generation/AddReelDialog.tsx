'use client'

/*
 * Begin a reel — editorial modal triggered from the binder rail's
 * "+ Add a reel" affordance and the binder footer's "Begin a new reel" CTA.
 * Custom scrim + paper panel; no shadcn primitives.
 *
 * Posts to POST /api/projects/[projectId]/reels — director-only on the API.
 * On success, refreshes the binder so the new reel appears in the rail.
 */

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import sd from './dialogShell.module.css'

interface AddReelDialogProps {
  projectId: string
  nextPositionHint: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddReelDialog({
  projectId,
  nextPositionHint,
  open,
  onOpenChange,
}: AddReelDialogProps) {
  const router = useRouter()
  const titleId = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  function close() {
    setName('')
    onOpenChange(false)
  }

  // Esc to close + body scroll lock + initial focus.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    queueMicrotask(() => nameRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/reels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || undefined }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(data.error || 'Could not begin reel.')
        return
      }
      toast.success(`Reel ${nextPositionHint} added.`)
      setName('')
      onOpenChange(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className={sd.scrim}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        className={`${sd.panel} ${sd.panelNarrow}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={sd.head}>
          <span className={sd.eyebrow}>+ A new reel</span>
          <h2 id={titleId} className={sd.title}>
            Begin Reel {nextPositionHint}
          </h2>
          <p className={sd.sub}>
            <em>Name it for the act it covers, or leave blank to use &ldquo;Reel {nextPositionHint}&rdquo;.</em>
          </p>
        </header>

        <form onSubmit={handleCreate} className={sd.form}>
          <div className={sd.field}>
            <label htmlFor="reel-name" className={sd.label}>
              Name<em className={sd.labelOptional}>(optional)</em>
            </label>
            <input
              id="reel-name"
              ref={nameRef}
              className={`${sd.input} ${sd.input}`}
              type="text"
              placeholder={`Reel ${nextPositionHint}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </div>

          <footer className={sd.foot}>
            <button
              type="button"
              className={`${sd.cancel} ${sd.cancel}`}
              onClick={close}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${sd.send} ${sd.send}`}
              disabled={loading}
            >
              {loading ? 'Beginning…' : 'Begin reel →'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
