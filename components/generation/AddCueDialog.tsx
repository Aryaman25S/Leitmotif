'use client'

/*
 * Add a cue — editorial modal triggered from the binder's "+ Add a cue to
 * Reel N" rows and the empty-state primary CTA. Custom scrim + paper panel;
 * no shadcn primitives.
 *
 * Posts to POST /api/scenes — director-only on the API. On success, navigates
 * the director straight into the new cue's editor and refreshes the binder
 * so the new row appears under the right reel.
 */

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import sd from './dialogShell.module.css'

interface AddCueDialogProps {
  projectId: string
  reelId: string
  reelDisplayName: string
  sceneCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddCueDialog({
  projectId,
  reelId,
  reelDisplayName,
  sceneCount,
  open,
  onOpenChange,
}: AddCueDialogProps) {
  const router = useRouter()
  const titleId = useId()
  const labelRef = useRef<HTMLInputElement>(null)
  const [label, setLabel] = useState('')
  const [cueNumber, setCueNumber] = useState('')
  const [loading, setLoading] = useState(false)

  function close() {
    setLabel('')
    setCueNumber('')
    onOpenChange(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    queueMicrotask(() => labelRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          reel_id: reelId,
          label: label.trim(),
          cue_number: cueNumber.trim() || null,
          sort_order: sceneCount,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Could not add cue.')
        return
      }
      toast.success('Cue added.')
      setLabel('')
      setCueNumber('')
      onOpenChange(false)
      router.push(`/projects/${projectId}/scenes/${data.scene.id}`)
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
        className={sd.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={sd.head}>
          <span className={sd.eyebrow}>+ A new cue</span>
          <h2 id={titleId} className={sd.title}>
            Add a cue to {reelDisplayName}
          </h2>
          <p className={sd.sub}>
            <em>Title is what the binder reads. Cue number is the slate (e.g.&nbsp;1M4) — leave blank if you don&rsquo;t use them.</em>
          </p>
        </header>

        <form onSubmit={handleCreate} className={sd.form}>
          <div className={sd.field}>
            <label htmlFor="cue-label" className={sd.label}>Title</label>
            <input
              id="cue-label"
              ref={labelRef}
              className={`${sd.input} ${sd.input}`}
              type="text"
              placeholder="e.g. Maps spread on the kitchen table"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              maxLength={120}
            />
          </div>

          <div className={sd.field}>
            <label htmlFor="cue-number" className={sd.label}>
              Cue №<em className={sd.labelOptional}>(optional)</em>
            </label>
            <input
              id="cue-number"
              className={`${sd.input} ${sd.input} ${sd.inputMono}`}
              type="text"
              placeholder="1M4"
              value={cueNumber}
              onChange={(e) => setCueNumber(e.target.value)}
              maxLength={16}
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
              disabled={loading || !label.trim()}
            >
              {loading ? 'Adding…' : 'Add cue →'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
