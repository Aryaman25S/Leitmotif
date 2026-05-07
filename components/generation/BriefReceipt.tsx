'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface BriefReceiptProps {
  cueId: string
  cueRef: string
  fileTag: string
  alreadyAcknowledged: boolean
  existingNotes: string | null
  existingSignedName: string | null
  existingSignedInitials: string | null
  acknowledgedAt: string | null
  existingScoredAt: string | null
  // Resolved name of whoever scored the cue (server-side from scored_by).
  // Display-only; used in the receipt's "Scored {date} · by {name}" line.
  existingScoredByName: string | null
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
  existingSignedName,
  existingSignedInitials,
  acknowledgedAt,
  existingScoredAt,
  existingScoredByName,
}: BriefReceiptProps) {
  const [acknowledged, setAcknowledged] = useState(alreadyAcknowledged)
  // Initials and name persist across reloads now. If a prior acknowledge
  // captured a signature, those values seed the inputs and the stamp.
  const [name, setName] = useState(existingSignedName ?? '')
  const [initials, setInitials] = useState(existingSignedInitials ?? '')
  const [whenText, setWhenText] = useState(fmtWhen(acknowledgedAt))
  const [note, setNote] = useState('')
  const [noteSent, setNoteSent] = useState(Boolean(existingNotes?.trim()))
  const [sentAt, setSentAt] = useState(existingNotes?.trim() ? fmtWhen(acknowledgedAt) : '')
  const [savingAck, setSavingAck] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  // Scored — third receipt beat. The composer (or director) flips this when
  // the actual music has been written and the brief is fulfilled.
  const [scored, setScored] = useState(Boolean(existingScoredAt))
  const [scoredAtText, setScoredAtText] = useState(fmtWhen(existingScoredAt))
  const [scoredByName, setScoredByName] = useState<string | null>(existingScoredByName)
  const [savingScore, setSavingScore] = useState(false)

  async function postAck(noteBody: string | null) {
    const res = await fetch(`/api/mock-cues/${cueId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: noteBody,
        signed_name: name.trim() || null,
        signed_initials: initials.trim() || null,
      }),
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

  async function handleMarkScored() {
    if (scored || savingScore) return
    setSavingScore(true)
    try {
      const res = await fetch(`/api/mock-cues/${cueId}/score`, { method: 'POST' })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error || 'Could not mark scored.')
      }
      setScored(true)
      setScoredAtText(
        new Date().toLocaleString(undefined, {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      )
      // Best-effort author name — the server records `scored_by`, but we
      // don't know the viewer's display name from the public brief context.
      // Show generic "you" until next reload pulls the resolved name.
      if (!scoredByName) setScoredByName('you')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not mark scored.')
    } finally {
      setSavingScore(false)
    }
  }

  async function handleUnscore() {
    if (!scored || savingScore) return
    setSavingScore(true)
    try {
      const res = await fetch(`/api/mock-cues/${cueId}/score`, { method: 'DELETE' })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error || 'Could not un-score.')
      }
      setScored(false)
      setScoredAtText('')
      setScoredByName(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not un-score.')
    } finally {
      setSavingScore(false)
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

      <div className={`bd-score${scored ? ' done' : ''}`}>
        <div className="pre"><span className="glyph">♪</span>iii. Scored</div>
        {scored ? (
          <div className="scored-row">
            <span className="lab">
              <em>Score written.</em>
              <small>
                Marked as scored{scoredAtText ? ` ${scoredAtText}` : ''}
                {scoredByName ? ` · by ${scoredByName}` : ''}.
              </small>
            </span>
            <button
              type="button"
              className="unscore"
              onClick={handleUnscore}
              disabled={savingScore}
            >
              {savingScore ? '…' : 'Re-open'}
            </button>
          </div>
        ) : (
          <>
            <p className="helper">
              When the music for this cue is written and the brief is fulfilled, mark it scored. The director&rsquo;s binder shows it as done.
            </p>
            <div className="send-row">
              <span>Records who, when</span>
              <button
                type="button"
                className="send"
                disabled={savingScore}
                onClick={handleMarkScored}
              >
                {savingScore ? 'Marking…' : 'Mark as scored'}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
