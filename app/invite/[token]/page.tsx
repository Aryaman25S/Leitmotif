/*
 * Invite landing — public route reached via the magic-token URL in an
 * invitation email. Two states:
 *   - valid token  → editorial card showing project title, role, accept CTA
 *   - bad/expired  → "House dark" fallback (same chrome as not-found)
 *
 * Uses the shared messagePage chrome to keep visual identity consistent
 * with /error and /not-found. Wrapped in <LeitmotifWorld> so grain +
 * vignette + world tokens apply outside the app shell.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPendingInvitePreview } from '@/lib/store'
import { LeitmotifWorld } from '@/components/landing/LeitmotifWorld'
import AcceptInviteClient from './AcceptInviteClient'
import shared from '@/app/messagePage.module.css'
import s from './invite.module.css'

export const dynamic = 'force-dynamic'

function formatRole(role: string | null): string {
  if (!role) return ''
  return role.replace(/_/g, ' ')
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  if (!token) notFound()

  const preview = await getPendingInvitePreview(token)

  if (!preview) {
    return (
      <LeitmotifWorld>
        <div className={shared.stage}>
          <div className={shared.card}>
            <div className={shared.ruleTop} />

            <div className={shared.folio}>
              <span className={shared.folioOrn} aria-hidden />
              <span className={shared.smallcaps}>House dark</span>
              <span className={shared.folioOrn} aria-hidden />
            </div>

            <h1 className={shared.title}>
              <span className={shared.q}>&ldquo;</span>
              The invitation has lapsed.
              <span className={shared.q}>&rdquo;</span>
            </h1>

            <p className={shared.body}>
              This link is invalid, expired, or already used. Ask the project owner for a new one.
            </p>

            <div className={shared.actions}>
              <Link href="/projects" className={`${shared.btnPrimary} ${shared.btnPrimary}`}>
                Back to the marquee
              </Link>
            </div>

            <div className={shared.ruleBot} />
          </div>
        </div>
      </LeitmotifWorld>
    )
  }

  const role = formatRole(preview.role_on_project)

  return (
    <LeitmotifWorld>
      <div className={shared.stage}>
        <div className={shared.card}>
          <div className={shared.ruleTop} />

          <div className={shared.folio}>
            <span className={shared.folioOrn} aria-hidden />
            <span className={shared.smallcaps}>An invitation</span>
            <span className={shared.folioOrn} aria-hidden />
          </div>

          <h1 className={shared.title}>
            <span className={shared.q}>&ldquo;</span>
            {preview.project_title}
            <span className={shared.q}>&rdquo;</span>
          </h1>

          {(preview.invite_email || role) && (
            <p className={s.eyebrowMeta}>
              {preview.invite_email && (
                <>
                  <span className={s.metaLabel}>Sent to</span>
                  <span className={s.metaValue}>{preview.invite_email}</span>
                </>
              )}
              {preview.invite_email && role && <span className={s.metaSep}>·</span>}
              {role && (
                <>
                  <span className={s.metaLabel}>Role</span>
                  <span className={s.metaValue}>{role}</span>
                </>
              )}
            </p>
          )}

          <p className={shared.body}>
            The director&rsquo;s wired you in. Take your seat to enter the binder.
          </p>

          <AcceptInviteClient token={token} projectTitle={preview.project_title} />

          <div className={shared.ruleBot} />

          <div className={shared.footnote}>
            <span className={shared.footnoteLabel}>Footnote</span>
            <span className={shared.footnoteDigest}>
              You&rsquo;ll need a Leitmotif account on this email to accept.
            </span>
          </div>
        </div>
      </div>
    </LeitmotifWorld>
  )
}
