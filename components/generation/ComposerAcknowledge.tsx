'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Loader2, MessageSquare } from 'lucide-react'

interface ComposerAcknowledgeProps {
  cueId: string
  alreadyAcknowledged: boolean
  existingNotes: string | null
  acknowledgedAt: string | null
}

export default function ComposerAcknowledge({
  cueId,
  alreadyAcknowledged,
  existingNotes,
  acknowledgedAt,
}: ComposerAcknowledgeProps) {
  const [acknowledged, setAcknowledged] = useState(alreadyAcknowledged)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  async function handleAcknowledge() {
    setSaving(true)
    const res = await fetch(`/api/mock-cues/${cueId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setSaving(false)
    if (res.ok) {
      setAcknowledged(true)
    }
  }

  if (acknowledged) {
    return (
      <div className="rounded-lg border border-green-800/40 bg-green-950/20 p-4 print:hidden">
        <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-1">
          <CheckCircle2 className="h-4 w-4" />
          Brief acknowledged
        </div>
        {(existingNotes || notes) && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Your notes: {existingNotes ?? notes}
          </p>
        )}
        {acknowledgedAt && (
          <p className="text-xs text-muted-foreground/60 mt-1">
            {new Date(acknowledgedAt).toLocaleDateString(undefined, {
              dateStyle: 'medium',
            })}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-3 print:hidden">
      <p className="text-sm font-medium">Composer acknowledgement</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Confirm you have received and reviewed this brief. You can optionally leave a note for the director.
      </p>

      {showNotes ? (
        <Textarea
          placeholder="Optional note to the director — questions, concerns, or confirmation…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="resize-none text-sm"
        />
      ) : (
        <button
          onClick={() => setShowNotes(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Add a note (optional)
        </button>
      )}

      <Button onClick={handleAcknowledge} disabled={saving} size="sm" className="gap-2">
        {saving ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
        ) : (
          <><CheckCircle2 className="h-3.5 w-3.5" />I&apos;ve read this brief</>
        )}
      </Button>
    </div>
  )
}
