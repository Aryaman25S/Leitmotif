'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from '@/lib/utils'
import { MessageSquare, SendHorizonal } from 'lucide-react'
import { toast } from 'sonner'

interface Comment {
  id: string
  body: string
  created_at: string
  profiles: { name: string | null; email: string } | null
}

interface CommentThreadProps {
  sceneId: string
  initialComments: Comment[]
}

export default function CommentThread({ sceneId, initialComments }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)

    const res = await fetch(`/api/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneId, body: body.trim() }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to post comment')
    } else {
      // Normalise API response shape: server returns { author } but component uses { profiles }
      const normalised: Comment = {
        ...data.comment,
        profiles: data.comment.author ?? null,
      }
      setComments((prev) => [...prev, normalised])
      setBody('')
      startTransition(() => router.refresh())
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      {!comments.length ? (
        <div className="border border-dashed border-border rounded-lg p-10 text-center">
          <MessageSquare className="h-7 w-7 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">No comments yet</p>
          <p className="text-xs text-muted-foreground mt-1">Start a thread with your team</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-medium text-xs">
                  {c.profiles?.name ?? c.profiles?.email ?? 'Unknown'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at))} ago
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder="Leave a note or direction…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          className="resize-none text-sm flex-1"
        />
        <Button
          type="submit"
          size="icon"
          variant="outline"
          disabled={submitting || !body.trim()}
          className="self-end h-9 w-9 shrink-0"
        >
          <SendHorizonal className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  )
}
