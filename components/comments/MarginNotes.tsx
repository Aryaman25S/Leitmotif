'use client'

/*
 * Margin notes — per-cue thread mounted on the cue editor (right column,
 * below the result panel) and the public brief (above the receipt).
 *
 * Newest-first ordering. Initial page is server-rendered; the "Show earlier
 * notes" affordance fetches older pages via GET /api/comments using a
 * created_at cursor so concurrent adds don't shift the offset. Adds are
 * optimistic with rollback on failure — they prepend to the list and bump
 * the total counter.
 *
 * Posting and pagination both require a project-member session (enforced by
 * /api/comments). On the public brief, an anonymous viewer sees the
 * server-rendered first page only and is prompted to sign in for everything
 * else.
 */

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Comment } from '@/lib/store'
import s from './marginNotes.module.css'

// A comment body longer than this gets a "Show more" toggle. Calibrated for
// the cue-editor's narrower right column — ~6 italic-serif lines at default
// sizing. Below the threshold, comments render in full.
const LONG_BODY_THRESHOLD = 280

interface MarginNotesProps {
  sceneId: string
  initialComments: Comment[]
  initialCommentsHasMore: boolean
  initialCommentTotal: number
  canReply: boolean
  // Optional sign-in target for anonymous viewers on the public brief.
  // Defaults to /sign-in; pass `?next=` if you want callback survival.
  signInHref?: string
  // When true, the section flex-grows to fill its parent's height and the
  // comments list expands to use whatever vertical space remains (with
  // internal scroll past that). Use on the cue editor's right column where
  // the parent column stretches to match the left side. Leave off on the
  // brief, which is a single editorial sheet with no column to fill.
  fillHeight?: boolean
}

export default function MarginNotes({
  sceneId,
  initialComments,
  initialCommentsHasMore,
  initialCommentTotal,
  canReply,
  signInHref = '/sign-in',
  fillHeight = false,
}: MarginNotesProps) {
  const listRef = useRef<HTMLOListElement>(null)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [hasMore, setHasMore] = useState(initialCommentsHasMore)
  const [total, setTotal] = useState(initialCommentTotal)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  // Per-comment expansion state for long bodies. A comment id is in the set
  // iff the user has clicked "Show more" on it.
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text || submitting) return

    setSubmitting(true)
    // Optimistic insert at the top (newest first); replace with the
    // server-returned row on success, or roll back on failure.
    const tempId = `__optimistic-${Date.now()}`
    const optimistic: Comment = {
      id: tempId,
      scene_card_id: sceneId,
      author_id: null,
      body: text,
      created_at: new Date().toISOString(),
      author: { name: 'You', email: '' },
    }
    setComments((prev) => [optimistic, ...prev])
    setTotal((n) => n + 1)
    setBody('')
    // The list is bounded with internal scroll — bring the new note into
    // view in case the user had scrolled down to read older entries.
    queueMicrotask(() => {
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    })

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId, body: text }),
      })
      const data = (await res.json().catch(() => ({}))) as
        | { comment: Comment }
        | { error?: string }
      if (!res.ok || !('comment' in data)) {
        const err = ('error' in data && data.error) || 'Could not post.'
        toast.error(err)
        setComments((prev) => prev.filter((c) => c.id !== tempId))
        setTotal((n) => Math.max(0, n - 1))
        setBody(text)
        return
      }
      setComments((prev) => prev.map((c) => (c.id === tempId ? data.comment : c)))
    } catch {
      toast.error('Could not post.')
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      setTotal((n) => Math.max(0, n - 1))
      setBody(text)
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // ⌘/Ctrl + Enter submits — matches conventions in the rest of the app.
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      void handleSubmit(e)
    }
  }

  async function handleLoadMore() {
    if (loadingMore || !hasMore) return
    const oldest = comments[comments.length - 1]
    if (!oldest) return
    setLoadingMore(true)
    try {
      const params = new URLSearchParams({
        sceneId,
        before: oldest.created_at,
        limit: '10',
      })
      const res = await fetch(`/api/comments?${params}`)
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Sign in to read earlier notes.')
        } else {
          toast.error('Could not load earlier notes.')
        }
        return
      }
      const data = (await res.json()) as { comments: Comment[]; hasMore: boolean }
      setComments((prev) => [...prev, ...data.comments])
      setHasMore(data.hasMore)
    } catch {
      toast.error('Could not load earlier notes.')
    } finally {
      setLoadingMore(false)
    }
  }

  const counterLabel =
    total === 0
      ? 'none yet'
      : String(total).padStart(2, '0')

  return (
    <section className={`${s.notes} ${fillHeight ? s.notesFill : ''}`} aria-label="Margin notes">
      <header className={s.head}>
        <span className={s.headLabel}>Margin notes</span>
        <span className={s.headRule} />
        <span className={s.headCount}>{counterLabel}</span>
      </header>

      {canReply ? (
        <form onSubmit={handleSubmit} className={s.compose}>
          <textarea
            className={`${s.input} ${s.input}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pencil a margin note…"
            rows={2}
            disabled={submitting}
          />
          <div className={s.composeFoot}>
            <span className={s.composeHint}>⌘ + ⏎ to send</span>
            <button
              type="submit"
              className={`${s.send} ${s.send}`}
              disabled={!body.trim() || submitting}
            >
              {submitting ? 'sending…' : 'Pencil it in'}
            </button>
          </div>
        </form>
      ) : (
        <p className={s.signin}>
          <a href={signInHref} className={s.signinLink}>Sign in</a>{' '}
          <em>to leave a margin note.</em>
        </p>
      )}

      {comments.length === 0 ? (
        <p className={s.empty}><em>No notes yet. Pencil one in.</em></p>
      ) : (
        <ol className={`${s.list} ${fillHeight ? s.listFill : ''}`} ref={listRef}>
          {comments.map((c) => {
            const isLong = c.body.length > LONG_BODY_THRESHOLD
            const isOpen = expanded.has(c.id)
            return (
              <li key={c.id} className={s.item}>
                <div className={s.meta}>
                  <span className={s.metaName}>{displayName(c)}</span>
                  <span className={s.metaSep}>·</span>
                  <span className={s.metaWhen}>{formatWhen(c.created_at)}</span>
                </div>
                <p className={`${s.body} ${isLong && !isOpen ? s.bodyClamped : ''}`}>
                  {c.body}
                </p>
                {isLong && (
                  <button
                    type="button"
                    className={`${s.showMore} ${s.showMore}`}
                    onClick={() => toggleExpanded(c.id)}
                  >
                    {isOpen ? 'Show less' : 'Show more'}
                  </button>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {hasMore && (
        canReply ? (
          <div className={s.loadMore}>
            <button
              type="button"
              className={`${s.loadMoreBtn} ${s.loadMoreBtn}`}
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'loading…' : 'Show earlier notes'}
            </button>
          </div>
        ) : (
          <p className={s.loadMoreSignin}>
            <a href={signInHref} className={s.signinLink}>Sign in</a>{' '}
            <em>to read earlier notes.</em>
          </p>
        )
      )}
    </section>
  )
}

function displayName(c: Comment): string {
  if (c.author?.name?.trim()) return c.author.name.trim()
  if (c.author?.email) return c.author.email.split('@')[0]
  return 'Someone'
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toLowerCase()
}
