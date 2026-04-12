'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const INSTRUMENTATION_OPTIONS = [
  { key: 'solo_intimate',  label: 'Solo / intimate' },
  { key: 'chamber',        label: 'Chamber ensemble' },
  { key: 'orchestral',     label: 'Full orchestra' },
  { key: 'electronic',     label: 'Electronic / synthetic' },
  { key: 'hybrid',         label: 'Hybrid acoustic-electronic' },
  { key: 'ethnic',         label: 'Specific cultural palette' },
  { key: 'band',           label: 'Contemporary band' },
  { key: 'jazz',           label: 'Jazz ensemble' },
]

export default function ProjectSettingsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [toneBrief, setToneBrief] = useState('')
  const [format, setFormat] = useState('feature')
  const [instrumentation, setInstrumentation] = useState<string[]>([])
  const [eraReference, setEraReference] = useState('')
  const [budgetReality, setBudgetReality] = useState('hybrid')
  const [doNotGenerate, setDoNotGenerate] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.project) {
          setTitle(data.project.title)
          setToneBrief(data.project.tone_brief ?? '')
          setFormat(data.project.format)
        }
        if (data.settings) {
          setInstrumentation(data.settings.instrumentation_families ?? [])
          setEraReference(data.settings.era_reference ?? '')
          setBudgetReality(data.settings.budget_reality ?? 'hybrid')
          setDoNotGenerate(data.settings.do_not_generate ?? '')
        }
        setLoaded(true)
      })
  }, [projectId])

  function toggleInstrumentation(key: string) {
    setInstrumentation((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        tone_brief: toneBrief.trim() || null,
        format,
        settings: {
          instrumentation_families: instrumentation,
          era_reference: eraReference.trim() || null,
          budget_reality: budgetReality,
          do_not_generate: doNotGenerate.trim() || null,
        },
      }),
    })
    if (!res.ok) {
      toast.error('Failed to save settings')
    } else {
      toast.success('Settings saved')
      router.refresh()
    }
    setSaving(false)
  }

  if (!loaded) return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div className="h-4 w-28 bg-muted/50 rounded animate-pulse" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-5 space-y-4">
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-56 bg-muted/40 rounded animate-pulse" />
          <div className="space-y-3">
            <div className="h-8 w-full bg-muted/20 rounded-lg border border-border animate-pulse" />
            <div className="h-8 w-full bg-muted/20 rounded-lg border border-border animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href={`/projects/${projectId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 gap-1">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to project
      </Link>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project details</CardTitle>
            <CardDescription>Basic information about the production.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select value={format} onValueChange={(v) => v && setFormat(v)}>
                <SelectTrigger id="format"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Feature film</SelectItem>
                  <SelectItem value="episodic">Episodic / TV</SelectItem>
                  <SelectItem value="short">Short film</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Tone brief</Label>
              <Textarea id="tone" value={toneBrief} onChange={(e) => setToneBrief(e.target.value)} rows={3} className="resize-none" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generation settings</CardTitle>
            <CardDescription>Applied to all mock cue generation in this project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="text-sm mb-3 block">Instrumentation palette</Label>
              <div className="flex flex-wrap gap-2">
                {INSTRUMENTATION_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleInstrumentation(key)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border transition-colors',
                      instrumentation.includes(key)
                        ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_-2px] shadow-primary/40'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="era">Era / style reference</Label>
              <Input id="era" placeholder="e.g. 1970s neo-noir, post-minimalist" value={eraReference} onChange={(e) => setEraReference(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget reality</Label>
              <Select value={budgetReality} onValueChange={(v) => v && setBudgetReality(v)}>
                <SelectTrigger id="budget"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_orchestra">Full orchestra</SelectItem>
                  <SelectItem value="small_ensemble">Small ensemble</SelectItem>
                  <SelectItem value="solo_duo">Solo / duo</SelectItem>
                  <SelectItem value="electronic_only">Electronic only</SelectItem>
                  <SelectItem value="hybrid">Hybrid (default)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="do-not">Do not generate (project-wide)</Label>
              <Textarea id="do-not" placeholder="e.g. No ethnic clichés. No sad violins." value={doNotGenerate} onChange={(e) => setDoNotGenerate(e.target.value)} rows={2} className="resize-none text-sm" />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving…' : 'Save settings'}
        </Button>

        {/* Danger zone */}
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive text-base">Danger zone</CardTitle>
            <CardDescription>This action cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteProjectButton projectId={projectId as string} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/projects/${projectId}/delete`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) {
      toast.error('Failed to delete project')
      return
    }
    toast.success('Project deleted')
    router.push('/projects')
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Delete this project and all its scenes, cues, and comments.
      </p>
      {confirming ? (
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-2"
          >
            {deleting ? (
              <><span className="h-3.5 w-3.5 animate-spin border-2 border-current border-t-transparent rounded-full inline-block" />Deleting…</>
            ) : (
              <><AlertTriangle className="h-3.5 w-3.5" />Yes, delete project</>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(true)}
          className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete project
        </Button>
      )}
    </div>
  )
}
