import { Resend } from 'resend'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getApiKey(): string | null {
  const k = process.env.RESEND_API_KEY?.trim()
  return k || null
}

function getFrom(): string | null {
  const f = process.env.RESEND_FROM?.trim() || process.env.RESEND_FROM_EMAIL?.trim()
  return f || null
}

export function isResendConfigured(): boolean {
  return Boolean(getApiKey() && getFrom())
}

export function shouldSendBriefEmails(): boolean {
  const v = process.env.RESEND_BRIEF_EMAILS?.trim().toLowerCase()
  if (v === '0' || v === 'false' || v === 'no') return false
  return true
}

function replyTo(): string | undefined {
  const r = process.env.RESEND_REPLY_TO?.trim()
  return r || undefined
}

export type SendMailResult =
  | { ok: true; id: string }
  | { ok: false; message: string }

async function sendHtmlEmail(params: {
  to: string | string[]
  subject: string
  html: string
  text: string
}): Promise<SendMailResult> {
  const key = getApiKey()
  const from = getFrom()
  if (!key || !from) {
    return { ok: false, message: 'Resend is not configured (RESEND_API_KEY and RESEND_FROM)' }
  }

  const resend = new Resend(key)
  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    ...(replyTo() ? { replyTo: replyTo() } : {}),
  })

  if (error) {
    return { ok: false, message: error.message ?? 'Resend send failed' }
  }
  if (!data?.id) {
    return { ok: false, message: 'Resend returned no message id' }
  }
  return { ok: true, id: data.id }
}

export async function sendProjectInviteEmail(params: {
  to: string
  projectTitle: string
  inviterDisplay: string
  inviterEmail: string
  inviteUrl: string
  roleLabel: string
}): Promise<SendMailResult> {
  const title = escapeHtml(params.projectTitle)
  const inviter = escapeHtml(params.inviterDisplay)
  const role = escapeHtml(params.roleLabel)
  const url = escapeHtml(params.inviteUrl)
  const html = `
<p>You have been invited to collaborate on <strong>${title}</strong> on Leitmotif as <strong>${role}</strong>.</p>
<p><strong>${inviter}</strong> (${escapeHtml(params.inviterEmail)}) added you.</p>
<p><a href="${url}">Accept invite</a></p>
<p style="color:#666;font-size:12px">If the button does not work, copy this link:<br/>${url}</p>
`.trim()

  const text = [
    `You were invited to "${params.projectTitle}" on Leitmotif as ${params.roleLabel}.`,
    `${params.inviterDisplay} (${params.inviterEmail}) invited you.`,
    `Accept: ${params.inviteUrl}`,
  ].join('\n\n')

  return sendHtmlEmail({
    to: params.to,
    subject: `Invitation: ${params.projectTitle} (Leitmotif)`,
    html,
    text,
  })
}

export async function sendBriefReadyEmail(params: {
  to: string[]
  projectTitle: string
  sceneLabel: string
  briefUrl: string
}): Promise<SendMailResult> {
  if (params.to.length === 0) {
    return { ok: false, message: 'No recipients' }
  }
  const title = escapeHtml(params.projectTitle)
  const scene = escapeHtml(params.sceneLabel)
  const url = escapeHtml(params.briefUrl)
  const html = `
<p>A composer brief is ready for <strong>${scene}</strong> in <strong>${title}</strong>.</p>
<p><a href="${url}">Open brief</a></p>
<p style="color:#666;font-size:12px">If the link does not work, copy:<br/>${url}</p>
`.trim()

  const text = [
    `Composer brief ready for "${params.sceneLabel}" in "${params.projectTitle}".`,
    `Open: ${params.briefUrl}`,
  ].join('\n\n')

  return sendHtmlEmail({
    to: params.to,
    subject: `Brief ready: ${params.sceneLabel} — ${params.projectTitle}`,
    html,
    text,
  })
}
