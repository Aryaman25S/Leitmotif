'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, UserPlus, Trash2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import DeleteConfirmButton from '@/components/ui/delete-confirm-button'

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

interface Member {
  id: string
  invite_email: string | null
  role_on_project: string
  accepted_at: string | null
  profile?: { name: string | null; email: string } | null
}

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
  const [modelProvider, setModelProvider] = useState('lyria')
  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('composer')
  const [inviting, setInviting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [viewerIsOwner, setViewerIsOwner] = useState(false)
  const [viewerCanDirect, setViewerCanDirect] = useState(false)

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
          setModelProvider(data.settings.model_provider ?? 'lyria')
        }
        if (data.members) setMembers(data.members)
        if (typeof data.viewerIsOwner === 'boolean') setViewerIsOwner(data.viewerIsOwner)
        const role = data.viewerRole as string | null
        setViewerCanDirect(role === 'owner' || role === 'director')
        setLoaded(true)
      })
  }, [projectId])

  async function removeMember(memberId: string) {
    const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(typeof data.error === 'string' ? data.error : 'Failed to remove collaborator')
      return
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
    toast.success('Collaborator removed')
  }

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
          model_provider: modelProvider,
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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    const res = await fetch(`/api/projects/${projectId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to send invite')
    } else {
      const emailSent = Boolean(data.emailSent)
      const emailWarning = typeof data.emailWarning === 'string' ? data.emailWarning : undefined
      if (emailSent) {
        toast.success(`Invite email sent to ${inviteEmail.trim()}`)
      } else if (emailWarning) {
        toast.success('Invite saved', { description: emailWarning })
      } else {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        const path = data.invitePath as string | undefined
        const absolute =
          (data.inviteUrl as string | undefined) ||
          (path && origin ? `${origin}${path}` : path)
        if (absolute) {
          toast.success(`Invite created for ${inviteEmail}. Share this link: ${absolute}`)
        } else {
          toast.success(`Invited ${inviteEmail}`)
        }
      }
      setInviteEmail('')
      // Refresh member list
      fetch(`/api/projects/${projectId}`).then((r) => r.json()).then((d) => {
        if (d.members) setMembers(d.members)
      })
    }
    setInviting(false)
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
            <fieldset disabled={!viewerCanDirect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={format} onValueChange={(v) => v && setFormat(v)} disabled={!viewerCanDirect}>
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
            </fieldset>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generation settings</CardTitle>
            <CardDescription>Applied to all mock cue generation in this project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <fieldset disabled={!viewerCanDirect} className="space-y-5">
              <div>
                <Label className="text-sm mb-3 block">Instrumentation palette</Label>
                <div className="flex flex-wrap gap-2">
                  {INSTRUMENTATION_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleInstrumentation(key)}
                      disabled={!viewerCanDirect}
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
                <Select value={budgetReality} onValueChange={(v) => v && setBudgetReality(v)} disabled={!viewerCanDirect}>
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
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="model-provider">Generation provider</Label>
                <Select value={modelProvider} onValueChange={(v) => v && setModelProvider(v)} disabled={!viewerCanDirect}>
                  <SelectTrigger id="model-provider"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stable_audio">Stable Audio 2.5</SelectItem>
                    <SelectItem value="lyria">Lyria 3 (Google)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {modelProvider === 'lyria'
                    ? 'Lyria 3 via Gemini API. Requires GEMINI_API_KEY. Cheaper per generation; no dedicated negative prompt.'
                    : 'Stable Audio 2.5 via Stability AI. Requires STABILITY_API_KEY. Exact duration control and native negative prompt.'}
                </p>
              </div>
            </fieldset>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team</CardTitle>
            <CardDescription>
              {viewerIsOwner
                ? 'Invite collaborators by email. When transactional email (Resend) is configured, an invite is sent automatically; otherwise copy the invite link from the confirmation and share it so they can sign in and accept. You can remove collaborators below.'
                : 'Collaborators on this project. Only the project owner can invite or remove people.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {members.length > 0 && (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 text-sm py-1">
                    <span className="text-muted-foreground min-w-0 truncate">
                      {m.profile?.name ?? m.profile?.email ?? m.invite_email ?? '—'}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {m.role_on_project.replace(/_/g, ' ')}
                      </Badge>
                      {!m.accepted_at && (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                      {viewerIsOwner && (
                        <DeleteConfirmButton
                          size="sm"
                          label="Remove"
                          confirmLabel="Remove?"
                          className="h-7 px-2"
                          onDelete={() => removeMember(m.id)}
                        />
                      )}
                    </div>
                  </div>
                ))}
                <Separator />
              </div>
            )}
            {viewerIsOwner ? (
              <form onSubmit={handleInvite} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Invite by email</Label>
                  <Input id="invite-email" type="email" placeholder="collaborator@studio.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Their role</Label>
                  <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v)}>
                    <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="composer">Composer</SelectItem>
                      <SelectItem value="music_supervisor">Music Supervisor</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="sound_designer">Sound Designer</SelectItem>
                      <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={inviting || !inviteEmail.trim()} size="sm" className="gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  {inviting ? 'Adding…' : 'Add collaborator'}
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>

        {viewerCanDirect && (
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        )}

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
