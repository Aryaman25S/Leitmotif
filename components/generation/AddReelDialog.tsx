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
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch(`/api/projects/${projectId}/reels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() || undefined }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to add reel')
      setLoading(false)
      return
    }

    toast.success(`Reel ${nextPositionHint} added`)
    setName('')
    onOpenChange(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Begin Reel {nextPositionHint}</DialogTitle>
          <DialogDescription>
            Name it for the act it covers, or leave blank to use &ldquo;Reel {nextPositionHint}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="reel-name">Reel name <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="reel-name"
              placeholder={`Reel ${nextPositionHint}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Adding…' : 'Add reel'}
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
