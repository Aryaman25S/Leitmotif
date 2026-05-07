/*
 * Global 404 — same editorial chrome as the error boundary, different copy.
 * Server component (no error to receive, no reset to call). Wrapped in
 * <LeitmotifWorld> so grain + vignette + world tokens apply even when the
 * 404 fires outside the surrounding app shell (e.g. an unknown top-level
 * route).
 */

import Link from 'next/link'
import { LeitmotifWorld } from '@/components/landing/LeitmotifWorld'
import s from './messagePage.module.css'

export default function NotFound() {
  return (
    <LeitmotifWorld>
      <div className={s.stage}>
        <div className={s.card}>
          <div className={s.ruleTop} />

          <div className={s.folio}>
            <span className={s.folioOrn} aria-hidden />
            <span className={s.smallcaps}>House dark</span>
            <span className={s.folioOrn} aria-hidden />
          </div>

          <h1 className={s.title}>
            <span className={s.q}>&ldquo;</span>
            Nothing on the marquee.
            <span className={s.q}>&rdquo;</span>
          </h1>

          <p className={s.body}>
            That link may be wrong, or the production has been struck from the bill.
          </p>

          <div className={s.actions}>
            <Link href="/" className={`${s.btnPrimary} ${s.btnPrimary}`}>
              Back to the marquee
            </Link>
            <span className={s.or}>or</span>
            <Link href="/projects" className={`${s.btnQuiet} ${s.btnQuiet}`}>
              Tonight&rsquo;s bill
            </Link>
          </div>

          <div className={s.ruleBot} />

          <div className={s.footnote}>
            <span className={s.footnoteLabel}>Footnote</span>
            <span className={s.footnoteDigest}>404 · the page wasn&rsquo;t found</span>
          </div>
        </div>
      </div>
    </LeitmotifWorld>
  )
}
