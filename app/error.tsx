'use client'

/*
 * Global error boundary — editorial chrome, matches the cinema-house
 * vocabulary used by /projects empty-state and the brief receipt.
 *
 * Wraps in <LeitmotifWorld> so grain + vignette + world tokens (--ink,
 * --ember, etc.) are present even if the error fires before the
 * surrounding app shell has mounted.
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { LeitmotifWorld } from '@/components/landing/LeitmotifWorld'
import s from './messagePage.module.css'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const message =
    error.message?.trim() ||
    'A misprint somewhere in the workings. Try again, or head back to the marquee.'

  return (
    <LeitmotifWorld>
      <div className={s.stage}>
        <div className={s.card}>
          <div className={s.ruleTop} />

          <div className={s.folio}>
            <span className={s.folioOrn} aria-hidden />
            <span className={s.smallcaps}>Misprint</span>
            <span className={s.folioOrn} aria-hidden />
          </div>

          <h1 className={s.title}>
            <span className={s.q}>&ldquo;</span>
            Something went wrong.
            <span className={s.q}>&rdquo;</span>
          </h1>

          <p className={s.body}>{message}</p>

          <div className={s.actions}>
            <button
              type="button"
              className={`${s.btnPrimary} ${s.btnPrimary}`}
              onClick={() => reset()}
            >
              Try again
            </button>
            <span className={s.or}>or</span>
            <Link href="/" className={`${s.btnQuiet} ${s.btnQuiet}`}>
              Back to the marquee
            </Link>
          </div>

          <div className={s.ruleBot} />

          {error.digest && (
            <div className={s.footnote}>
              <span className={s.footnoteLabel}>Footnote</span>
              <span className={s.footnoteDigest}>ref · {error.digest}</span>
            </div>
          )}
        </div>
      </div>
    </LeitmotifWorld>
  )
}
