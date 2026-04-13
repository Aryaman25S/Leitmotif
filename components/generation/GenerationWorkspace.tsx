'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn, formatDistanceToNow } from '@/lib/utils'
import MockCuePlayer from './MockCuePlayer'
import type { MockCue } from '@/lib/store'
import { toast } from 'sonner'
import { Loader2, RefreshCw, CheckCircle2, Wand2, ChevronDown, ChevronUp } from 'lucide-react'

interface GenerationWorkspaceProps {
  sceneId: string
  mockCues: MockCue[]
  latestJobStatus: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | null
  hasIntent: boolean
  latestIntentId: string | null
}

const STATUS_LABELS = {
  queued:     { label: 'Queued…',     color: 'text-status-generating' },
  processing: { label: 'Generating…', color: 'text-status-brief-sent' },
  completed:  { label: 'Done',        color: 'text-status-complete'   },
  failed:     { label: 'Failed',      color: 'text-destructive'       },
  cancelled:  { label: 'Cancelled',   color: 'text-muted-foreground'  },
}

export default function GenerationWorkspace({
  sceneId,
  mockCues: initialCues,
  latestJobStatus: initialJobStatus,
  hasIntent,
  latestIntentId,
}: GenerationWorkspaceProps) {
  const router = useRouter()
  const [mockCues, setMockCues] = useState<MockCue[]>(initialCues)
  const [jobStatus, setJobStatus] = useState(initialJobStatus)
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)

  const isActive = jobStatus === 'queued' || jobStatus === 'processing'

  const pollStatus = useCallback(async () => {
    const res = await fetch(`/api/scenes/${sceneId}/status`)
    if (!res.ok) return
    const data = await res.json()
    setJobStatus(data.jobStatus)
    setMockCues(data.mockCues ?? [])

    if (data.jobStatus === 'completed' || data.jobStatus === 'failed') {
      setGenerating(false)
      if (data.jobStatus === 'completed') {
        toast.success('Mock cue generated — ready to review')
      } else {
        toast.error('Generation failed')
      }
      router.refresh()
    }
  }, [sceneId, router])

  useEffect(() => {
    if (!isActive && !generating) return
    const interval = setInterval(pollStatus, 2500)
    return () => clearInterval(interval)
  }, [isActive, generating, pollStatus])

  async function handleGenerate() {
    if (!latestIntentId) {
      toast.error('Save your intent first before generating.')
      return
    }
    setGenerating(true)
    setJobStatus('queued')

    const res = await fetch(`/api/scenes/${sceneId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intentVersionId: latestIntentId }),
    })

    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to start generation')
      setGenerating(false)
      setJobStatus(null)
    }
  }

  async function handleApprove(cueId: string) {
    setApproving(cueId)
    const res = await fetch(`/api/mock-cues/${cueId}/approve`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error('Failed to approve cue')
    } else {
      const briefEmailSent = Boolean(data.briefEmailSent)
      const briefEmailWarning =
        typeof data.briefEmailWarning === 'string' ? data.briefEmailWarning : undefined
      if (briefEmailSent) {
        toast.success('Cue approved — brief link emailed to collaborators')
      } else if (briefEmailWarning) {
        toast.success('Cue approved', { description: briefEmailWarning })
      } else {
        toast.success('Cue approved — open the brief link to share with your composer')
      }
      setMockCues((prev) =>
        prev.map((c) => c.id === cueId
          // approve this cue; un-approve any previously approved one so there's
          // only ever one active brief at a time
          ? { ...c, is_approved: true }
          : { ...c, is_approved: false }
        )
      )
      router.refresh()
    }
    setApproving(null)
  }

  // Sorted newest-first (store returns newest-first already, but be explicit)
  const sorted = [...mockCues].sort((a, b) => b.version_number - a.version_number)
  const latest = sorted[0] ?? null
  const older  = sorted.slice(1)

  const approvedCue     = mockCues.find((c) => c.is_approved)
  const latestUnapproved = latest && !latest.is_approved ? latest : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'rounded-xl border bg-card p-5 space-y-5 panel-elevated transition-[border-color,box-shadow] duration-500',
        (isActive || generating)
          ? 'border-primary/30 shadow-[0_0_15px_-5px] shadow-primary/20'
          : 'border-border'
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Mock cue</h3>
        {jobStatus && (
          <span className={cn('text-xs', STATUS_LABELS[jobStatus]?.color ?? 'text-muted-foreground')}>
            {STATUS_LABELS[jobStatus]?.label ?? jobStatus}
          </span>
        )}
      </div>

      {/* Generate / regenerate */}
      <div>
        <Button
          onClick={handleGenerate}
          disabled={!hasIntent || isActive || generating}
          className={cn(
            'w-full gap-2',
            !mockCues.length && !isActive && !generating && 'bg-gradient-to-r from-primary to-primary/80 shadow-[0_0_12px_-3px] shadow-primary/25'
          )}
          size={mockCues.length ? 'default' : 'lg'}
          variant={mockCues.length ? 'outline' : 'default'}
        >
          {isActive || generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {jobStatus === 'queued' ? 'Queued…' : 'Generating…'}
            </>
          ) : mockCues.length ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5" />
              Generate mock cue
            </>
          )}
        </Button>
        {!hasIntent && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Save your intent (left panel) to unlock generation.
          </p>
        )}
      </div>

      {/* Active progress indicator */}
      {(isActive || generating) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          {process.env.NEXT_PUBLIC_HAS_STABILITY_KEY
            ? 'Calling Stable Audio 2.5 API…'
            : 'Generating mock cue (demo mode)…'}
        </div>
      )}

      {/* Latest unapproved — shown first for immediate action */}
      {latestUnapproved && (
        <CueRow
          cue={latestUnapproved}
          onApprove={() => handleApprove(latestUnapproved.id)}
          approving={approving === latestUnapproved.id}
          isLatest
        />
      )}

      {/* Approved cue — always visible so brief link stays accessible */}
      {approvedCue && approvedCue.id !== latestUnapproved?.id && (
        <div className="space-y-2">
          {latestUnapproved && <Separator />}
          <div className="flex items-center gap-2 bg-status-complete/5 rounded-lg p-3 -mx-1">
            <CheckCircle2 className="h-4 w-4 text-status-complete" />
            <p className="text-xs font-medium">Approved — brief link ready to share</p>
          </div>
          <CueRow
            cue={approvedCue}
            onApprove={() => handleApprove(approvedCue.id)}
            approving={approving === approvedCue.id}
            isLatest={false}
          />
        </div>
      )}

      {/* Previous versions — fully interactive */}
      {older.length > 0 && (
        <>
          <Separator />
          <VersionHistory
            cues={older}
            approving={approving}
            onApprove={handleApprove}
          />
        </>
      )}
    </motion.div>
  )
}

// ── Shared cue row ────────────────────────────────────────────────────────────

function CueRow({
  cue,
  onApprove,
  approving,
  isLatest,
}: {
  cue: MockCue
  onApprove: () => void
  approving: boolean
  isLatest: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          v{cue.version_number} — {formatDistanceToNow(new Date(cue.created_at))} ago
        </span>
        <div className="flex items-center gap-1.5">
          {cue.is_approved && (
            <Badge variant="secondary" className="text-xs">Approved</Badge>
          )}
          {isLatest && !cue.is_approved && (
            <Badge variant="outline" className="text-xs">Reference only</Badge>
          )}
        </div>
      </div>

      <AudioCuePlayer cue={cue} />

      {cue.is_approved ? (
        <a
          href={`/brief/${cue.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs underline text-muted-foreground hover:text-foreground"
        >
          Open composer brief (share this URL) →
        </a>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground leading-snug">
            Unlocks the public brief page; email to the composer is not sent from Leitmotif yet.
          </p>
          <Button
            onClick={onApprove}
            disabled={approving}
            size="sm"
            className="w-full gap-2"
          >
            {approving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Approving…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve &amp; unlock brief link
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Version history (collapsible) ─────────────────────────────────────────────

function VersionHistory({
  cues,
  approving,
  onApprove,
}: {
  cues: MockCue[]
  approving: string | null
  onApprove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <span>Previous versions ({cues.length})</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="space-y-4 pt-1">
          {cues.map((cue) => (
            <div key={cue.id} className="border border-border/50 rounded-lg p-3 space-y-2">
              <CueRow
                cue={cue}
                onApprove={() => onApprove(cue.id)}
                approving={approving === cue.id}
                isLatest={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Audio player (fetches signed URL) ────────────────────────────────────────

function AudioCuePlayer({ cue }: { cue: MockCue }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/mock-cues/${cue.id}/audio-url`)
      .then(async (r) => {
        const d = (await r.json()) as { url?: string; error?: string }
        if (!r.ok) {
          toast.error(d.error ?? 'Could not load audio')
          return
        }
        if (!cancelled && d.url) setAudioUrl(d.url)
      })
      .catch(() => {
        toast.error('Could not load audio')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cue.id])

  if (loading) return <div className="h-10 bg-secondary/50 rounded animate-pulse" />
  if (!audioUrl) return <p className="text-xs text-muted-foreground text-center py-2">Audio file not available</p>

  return <MockCuePlayer src={audioUrl} label={cue.file_name} durationSec={cue.duration_sec} />
}
