'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Pencil, Check, X } from 'lucide-react'

interface SceneMetaEditorProps {
  sceneId: string
  cueNumber: string | null
  tcIn: string | null
  tcOut: string | null
  readOnly?: boolean
}

export default function SceneMetaEditor({
  sceneId,
  cueNumber,
  tcIn,
  tcOut,
  readOnly = false,
}: SceneMetaEditorProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    cue_number: cueNumber ?? '',
    tc_in:  tcIn  ?? '',
    tc_out: tcOut ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/scenes/${sceneId}/meta`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cue_number:   draft.cue_number.trim() || null,
        tc_in_smpte:  draft.tc_in.trim()      || null,
        tc_out_smpte: draft.tc_out.trim()     || null,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      toast.error('Failed to save')
      return
    }
    toast.success('Scene info updated')
    setEditing(false)
    router.refresh()
  }

  function handleCancel() {
    setDraft({
      cue_number: cueNumber ?? '',
      tc_in:  tcIn  ?? '',
      tc_out: tcOut ?? '',
    })
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="group flex items-center gap-3 text-xs text-muted-foreground">
        {cueNumber && (
          <span className="text-lg font-mono font-bold tracking-tight text-primary">
            {cueNumber}
          </span>
        )}
        {(tcIn || tcOut) && (
          <span className="font-mono text-xs tabular-nums tracking-wide">
            {tcIn ?? '—'} → {tcOut ?? '—'}
          </span>
        )}
        {!readOnly && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 hover:text-foreground transition-opacity opacity-0 group-hover:opacity-100 ml-auto"
          >
            <Pencil className="h-3 w-3" />
            {cueNumber || tcIn || tcOut ? 'Edit' : 'Add cue info'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2 flex-wrap">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Cue number</label>
        <Input
          value={draft.cue_number}
          onChange={(e) => setDraft((d) => ({ ...d, cue_number: e.target.value }))}
          placeholder="e.g. 3A"
          className="h-7 text-xs w-24 font-mono"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">TC in (SMPTE)</label>
        <Input
          value={draft.tc_in}
          onChange={(e) => setDraft((d) => ({ ...d, tc_in: e.target.value }))}
          placeholder="00:01:23:12"
          className="h-7 text-xs w-36 font-mono"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">TC out (SMPTE)</label>
        <Input
          value={draft.tc_out}
          onChange={(e) => setDraft((d) => ({ ...d, tc_out: e.target.value }))}
          placeholder="00:01:45:00"
          className="h-7 text-xs w-36 font-mono"
        />
      </div>
      <div className="flex gap-1.5 pb-0.5">
        <Button size="sm" className="h-7 px-2.5 text-xs gap-1" onClick={handleSave} disabled={saving}>
          <Check className="h-3 w-3" />
          Save
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handleCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
