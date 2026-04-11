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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface AddSceneDialogProps {
  projectId: string
  sceneCount: number
}

export default function AddSceneDialog({ projectId, sceneCount }: AddSceneDialogProps) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [cueNumber, setCueNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    setLoading(true)

    const res = await fetch(`/api/scenes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        label: label.trim(),
        cue_number: cueNumber.trim() || null,
        sort_order: sceneCount,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to create scene')
      setLoading(false)
      return
    }

    toast.success('Scene card created')
    setOpen(false)
    setLabel('')
    setCueNumber('')
    router.push(`/projects/${projectId}/scenes/${data.scene.id}`)
    router.refresh()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center gap-1 h-7 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] border border-border bg-background hover:bg-muted hover:text-foreground transition-all font-medium outline-none"
      >
        <Plus className="h-3.5 w-3.5" />
        Add scene
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add scene card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="scene-label">Scene / cue label *</Label>
            <Input
              id="scene-label"
              placeholder="e.g. Maria discovers the letter"
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
              {loading ? 'Creating…' : 'Create scene'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
