import type { NextRequest } from 'next/server'

/** Public origin for links in emails and API responses (no trailing slash). */
export function resolvePublicAppOrigin(req?: Pick<NextRequest, 'headers'>): string | null {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    process.env.BETTER_AUTH_URL?.replace(/\/$/, '')
  if (explicit) return explicit

  const vercel = process.env.VERCEL_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (vercel) return `https://${vercel}`

  if (req) {
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
    const proto = req.headers.get('x-forwarded-proto') ?? 'http'
    if (host) return `${proto}://${host}`
  }
  return null
}

export function buildAppUrl(path: string, req?: Pick<NextRequest, 'headers'>): string | null {
  const origin = resolvePublicAppOrigin(req)
  if (!origin) return null
  const p = path.startsWith('/') ? path : `/${path}`
  return `${origin}${p}`
}
