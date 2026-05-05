'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface AddCueDialogProps {
  projectId: string
  reelId: string
  reelDisplayName: string
  sceneCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The director's add-cue affordance, scoped to a specific reel. Triggered by
 * the binder's "+ Add a cue to Reel N" row and the empty-state primary CTA.
 */
export default function AddCueDialog({
  projectId,
  reelId,
  reelDisplayName,
  sceneCount,
  open,
  onOpenChange,
}: AddCueDialogProps) {
  const [label, setLabel] = useState('')
  const [cueNumber, setCueNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    setLoading(true)

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
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to create cue')
      setLoading(false)
      return
    }

    toast.success('Cue added')
    setLabel('')
    setCueNumber('')
    onOpenChange(false)
    router.push(`/projects/${projectId}/scenes/${data.scene.id}`)
    router.refresh()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a cue to {reelDisplayName}</DialogTitle>
          <DialogDescription>Title · timecode in/out · cue number</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="cue-label">Scene / cue title *</Label>
            <Input
              id="cue-label"
              placeholder="e.g. Maps spread on the kitchen table"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cue-number">Cue number <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="cue-number"
              placeholder="e.g. 1M4"
              value={cueNumber}
              onChange={(e) => setCueNumber(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading || !label.trim()} className="flex-1">
              {loading ? 'Adding…' : 'Add cue'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
