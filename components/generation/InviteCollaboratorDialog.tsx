'use client'

/*
 * Invite a collaborator — editorial modal triggered from the binder rail's
 * "+ Invite a collaborator" affordance. Mirrors the SettingsForm.tsx invite
 * block's vocabulary (italic serif fields on dotted rules, mono-cap labels,
 * ember-tinted role chips, mono-cap submit) inside a custom dark-scrim panel
 * — no shadcn primitives.
 *
 * POSTs to /api/projects/[projectId]/invite — same endpoint, same Resend
 * behavior, same accepted-vs-pending semantics as the settings page.
 *
 * Note: a freshly-invited member is `pending` (accepted_at null). The binder
 * rail's "In the room" panel filters to accepted-only, so the invitee won't
 * appear in the rail until they accept. Settings is the canonical place to
 * verify pending invites.
 */

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { ProjectRole } from '@/lib/roles'
import sd from './dialogShell.module.css'
import s from './inviteCollaboratorDialog.module.css'

interface InviteCollaboratorDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ROLE_OPTIONS: { value: ProjectRole; label: string }[] = [
  { value: 'composer',         label: 'Composer' },
  { value: 'director',         label: 'Director' },
  { value: 'music_supervisor', label: 'Supervisor' },
  { value: 'sound_designer',   label: 'Sound design' },
  { value: 'viewer',           label: 'Viewer' },
]

const NOTE_MAX = 800

export default function InviteCollaboratorDialog({
  projectId,
  open,
  onOpenChange,
}: InviteCollaboratorDialogProps) {
  const router = useRouter()
  const titleId = useId()
  const emailRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProjectRole>('composer')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  function reset() {
    setEmail('')
    setRole('composer')
    setNote('')
  }

  function close() {
    reset()
    onOpenChange(false)
  }

  // Esc to close + lock body scroll while open + initial focus on the email
  // input. Restoring focus to the trigger is left to the consumer; the rail's
  // "+ Invite" button stays visible underneath, so a stray focus return is
  // acceptable here.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    queueMicrotask(() => emailRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          role,
          note: note.trim() || null,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        emailSent?: boolean
        emailWarning?: string
        inviteUrl?: string
      }
      if (!res.ok) {
        toast.error(data.error || 'Could not send invite.')
        return
      }
      if (data.emailSent) {
        toast.success(`Invite sent to ${email.trim()}.`)
      } else if (data.emailWarning) {
        toast.success('Invite saved.', { description: data.emailWarning })
      } else if (data.inviteUrl) {
        toast.success('Invite saved.', { description: `Share: ${data.inviteUrl}` })
      } else {
        toast.success(`Invited ${email.trim()}.`)
      }
      reset()
      onOpenChange(false)
      router.refresh()
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  const noteRemaining = NOTE_MAX - note.length

  return (
    <div
      className={sd.scrim}
      onMouseDown={(e) => {
        // Only close on backdrop click — not when the user is text-selecting
        // and releases outside the panel.
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        ref={panelRef}
        className={sd.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={sd.head}>
          <span className={sd.eyebrow}>+ A new name</span>
          <h2 id={titleId} className={sd.title}>
            Invite a collaborator
          </h2>
          <p className={sd.sub}>
            <em>An email goes out the moment delivery is configured. Until they accept, they sit pending in the production office.</em>
          </p>
        </header>

        <form onSubmit={handleSend} className={sd.form}>
          <div className={sd.field}>
            <label htmlFor="invite-email" className={sd.label}>Email</label>
            <input
              id="invite-email"
              ref={emailRef}
              className={`${sd.input} ${sd.input} ${sd.inputMono}`}
              type="email"
              placeholder="composer@studio.com"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
            />
          </div>

          <div className={sd.field}>
            <span className={sd.label}>Role</span>
            <div className={s.chips} role="radiogroup" aria-label="Role">
              {ROLE_OPTIONS.map((r) => {
                const active = role === r.value
                return (
                  <button
                    key={r.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setRole(r.value)}
                    className={`${s.chip} ${s.chip} ${active ? s.chipOn : ''}`}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={sd.field}>
            <label htmlFor="invite-note" className={sd.label}>
              A line<br /><em className={sd.labelOptional}>(optional)</em>
            </label>
            <textarea
              id="invite-note"
              className={`${sd.textarea} ${sd.textarea}`}
              rows={3}
              placeholder="Sent above the accept link in their email."
              value={note}
              onChange={(ev) => setNote(ev.target.value.slice(0, NOTE_MAX))}
            />
          </div>

          {note.length > 0 && (
            <p className={s.charsLeft}>
              <em>{noteRemaining} character{noteRemaining === 1 ? '' : 's'} left.</em>
            </p>
          )}

          <footer className={sd.foot}>
            <button
              type="button"
              className={`${sd.cancel} ${sd.cancel}`}
              onClick={close}
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${sd.send} ${sd.send}`}
              disabled={sending || !email.trim()}
            >
              {sending ? 'Sending…' : 'Send invite →'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
