'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface BriefReceiptProps {
  cueId: string
  cueRef: string
  fileTag: string
  alreadyAcknowledged: boolean
  existingNotes: string | null
  acknowledgedAt: string | null
}

function fmtWhen(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BriefReceipt({
  cueId,
  cueRef,
  fileTag,
  alreadyAcknowledged,
  existingNotes,
  acknowledgedAt,
}: BriefReceiptProps) {
  const [acknowledged, setAcknowledged] = useState(alreadyAcknowledged)
  const [name, setName] = useState('')
  const [initials, setInitials] = useState('')
  const [whenText, setWhenText] = useState(fmtWhen(acknowledgedAt))
  const [note, setNote] = useState('')
  const [noteSent, setNoteSent] = useState(Boolean(existingNotes?.trim()))
  const [sentAt, setSentAt] = useState(existingNotes?.trim() ? fmtWhen(acknowledgedAt) : '')
  const [savingAck, setSavingAck] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  async function postAck(noteBody: string | null) {
    const res = await fetch(`/api/mock-cues/${cueId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: noteBody }),
    })
    if (!res.ok) {
      let msg = 'Could not save acknowledgement'
      try {
        const j = (await res.json()) as { error?: string }
        if (j.error) msg = j.error
      } catch { /* ignore */ }
      throw new Error(msg)
    }
  }

  async function handleAcknowledge() {
    if (acknowledged || savingAck) return
    setSavingAck(true)
    try {
      await postAck(note.trim() || existingNotes || null)
      setAcknowledged(true)
      setWhenText(
        new Date().toLocaleString(undefined, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save acknowledgement')
    } finally {
      setSavingAck(false)
    }
  }

  async function handleSendNote() {
    const text = note.trim()
    if (!text || savingNote) return
    setSavingNote(true)
    try {
      await postAck(text)
      // Sending a note also implies the brief was received.
      setAcknowledged(true)
      const w = new Date().toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      setSentAt(w)
      setNoteSent(true)
      if (!whenText) setWhenText(w)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send note')
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <section className="bd-receipt" id="bd-receipt" aria-label="Composer receipt">
      <div className="head-row">
        <div className="title">
          <span className="num">𝄐</span>
          Composer receipt
        </div>
        <div className="ref">{`${cueRef} · ${fileTag}`}</div>
      </div>

      <div className="grid">
        <div className={`bd-ack${acknowledged ? ' checked' : ''}`}>
          <div className="pre">i. Acknowledge</div>
          <button
            type="button"
            className="checkbox-row"
            role="checkbox"
            aria-checked={acknowledged}
            disabled={savingAck}
            onClick={handleAcknowledge}
          >
            <span className="box" aria-hidden />
            <span className="lab">
              Brief received — I&apos;ll begin.
              <small>This tells the director you&apos;ve read it and started thinking. Nothing public.</small>
            </span>
          </button>

          <div className="signed-row">
            <div className="field">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                disabled={alreadyAcknowledged}
              />
              <span className="lab">Signed</span>
            </div>
            <div className="field">
              <input
                type="text"
                placeholder="Initials"
                maxLength={6}
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                disabled={alreadyAcknowledged}
              />
              <span className="lab">Initials</span>
            </div>
          </div>

          <div className="stamp" aria-live="polite">
            <span className="stamp-mark">
              <span className="ring" aria-hidden />
              Received &amp; in hand
            </span>
            {whenText && (
              <span className="when">
                {`Received ${whenText}`}
                {name ? ` · ${name}` : ''}
                {initials ? ` (${initials})` : ''}
              </span>
            )}
          </div>
        </div>

        <div className="bd-note">
          <div className="pre"><span className="glyph">¶</span>ii. A note back</div>
          <p className="helper">
            A question, a misgiving, a thank-you. The director reads this; nobody else does.
          </p>
          {noteSent ? (
            <div className="sent-mark">
              {existingNotes && !note ? (
                <>
                  Sent{sentAt ? `, ${sentAt}` : ''}: <span style={{ fontStyle: 'italic' }}>{existingNotes}</span>
                </>
              ) : (
                <>Sent to the director{sentAt ? `, ${sentAt}` : ''}. They&apos;ll see it next time they open the cue.</>
              )}
            </div>
          ) : (
            <>
              <textarea
                placeholder="Two thoughts on the cue…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="send-row">
                <span>One-shot · not a thread</span>
                <button
                  type="button"
                  className="send"
                  disabled={savingNote || !note.trim()}
                  onClick={handleSendNote}
                >
                  {savingNote ? 'Sending…' : 'Send to director'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
