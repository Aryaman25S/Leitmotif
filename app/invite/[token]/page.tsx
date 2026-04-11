import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPendingInvitePreview } from '@/lib/store'
import AcceptInviteClient from './AcceptInviteClient'

export const dynamic = 'force-dynamic'

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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-lg font-semibold">Invite not available</h1>
          <p className="text-sm text-muted-foreground">
            This link is invalid, expired, or was already used. Ask the project owner for a new
            invite.
          </p>
          <Link href="/projects" className="text-sm underline text-muted-foreground hover:text-foreground">
            Back to projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6 rounded-xl border border-border bg-card p-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">
            Project invite
          </p>
          <h1 className="text-xl font-semibold">{preview.project_title}</h1>
          {preview.invite_email && (
            <p className="text-sm text-muted-foreground mt-1">
              Invited as <span className="text-foreground">{preview.invite_email}</span>
              {preview.role_on_project ? (
                <>
                  {' '}
                  · <span className="capitalize">{preview.role_on_project.replace(/_/g, ' ')}</span>
                </>
              ) : null}
            </p>
          )}
        </div>
        <AcceptInviteClient token={token} projectTitle={preview.project_title} />
        <Link href="/projects" className="block text-center text-xs text-muted-foreground hover:text-foreground underline">
          Cancel
        </Link>
      </div>
    </div>
  )
}
