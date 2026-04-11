'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewProjectPage() {
  const [title, setTitle] = useState('')
  const [format, setFormat] = useState('feature')
  const [toneBrief, setToneBrief] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), format, tone_brief: toneBrief.trim() || null }),
    })

    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to create project')
      setLoading(false)
      return
    }

    toast.success('Project created')
    router.push(`/projects/${data.project.id}`)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <Link href="/projects" className={cn('inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 gap-1')}>
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to projects
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New project</CardTitle>
          <CardDescription>Start with the basics. You can add scene cards after.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Project title *</Label>
              <Input
                id="title"
                placeholder="e.g. The Long Way Home"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
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
              <Label htmlFor="tone">Tone brief <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="tone"
                placeholder="The emotional world of this project in one sentence."
                value={toneBrief}
                onChange={(e) => setToneBrief(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading || !title.trim()} className="flex-1">
                {loading ? 'Creating…' : 'Create project'}
              </Button>
              <Link href="/projects" className={cn(buttonVariants({ variant: 'outline' }))}>Cancel</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
