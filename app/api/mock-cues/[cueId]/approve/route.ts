/**
 * POST /api/mock-cues/[cueId]/approve
 *
 * Marks the cue as approved and exposes /brief/[cueId]. Optionally emails composer /
 * music-supervisor members when Resend is configured.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getMockCue,
  getMockCues,
  updateMockCue,
  updateSceneCard,
  now,
  getSceneCard,
  getProject,
  getMemberEmailsByRoles,
} from '@/lib/store'
import { requireApiSession, assertCanApproveCue } from '@/lib/api-auth'
import { buildAppUrl } from '@/lib/public-url'
import { isResendConfigured, shouldSendBriefEmails, sendBriefReadyEmail } from '@/lib/mail/resend'

const BRIEF_NOTIFY_ROLES = ['composer', 'music_supervisor'] as const

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cueId: string }> }
) {
  const { cueId } = await params
  const user = await requireApiSession(req)
  if (user instanceof NextResponse) return user

  const denied = await assertCanApproveCue(user, cueId)
  if (denied) return denied

  const cue = await getMockCue(cueId)
  if (!cue) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const siblings = await getMockCues(cue.scene_card_id)
  await Promise.all(
    siblings
      .filter((c) => c.is_approved && c.id !== cueId)
      .map((c) => updateMockCue(c.id, { is_approved: false, approved_by: null, approved_at: null }))
  )

  await updateMockCue(cueId, {
    is_approved: true,
    approved_by: user.id,
    approved_at: now(),
  })

  await updateSceneCard(cue.scene_card_id, { status: 'brief_sent' })

  const scene = await getSceneCard(cue.scene_card_id)
  const project = scene ? await getProject(scene.project_id) : undefined

  let briefEmailSent = false
  let briefEmailWarning: string | undefined

  if (isResendConfigured() && shouldSendBriefEmails() && scene && project) {
    const briefPath = `/brief/${cueId}`
    const briefUrl = buildAppUrl(briefPath, req)
    const recipients = await getMemberEmailsByRoles(scene.project_id, BRIEF_NOTIFY_ROLES)
    const others = recipients.filter((e) => e !== user.email.trim().toLowerCase())

    if (!briefUrl) {
      briefEmailWarning =
        'Brief approved but email not sent: set NEXT_PUBLIC_APP_URL or BETTER_AUTH_URL so the brief link can be included.'
    } else if (others.length === 0) {
      briefEmailWarning =
        'Brief approved; no composer or music-supervisor recipients with an email (other than you) were found.'
    } else {
      const send = await sendBriefReadyEmail({
        to: others,
        projectTitle: project.title,
        sceneLabel: scene.label,
        briefUrl,
      })
      if (send.ok) {
        briefEmailSent = true
      } else {
        briefEmailWarning = `Brief approved but email failed: ${send.message}`
        console.warn('[approve] Resend:', send.message)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    briefEmailSent,
    ...(briefEmailWarning ? { briefEmailWarning } : {}),
  })
}
