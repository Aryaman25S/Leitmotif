import type { BetterAuthOptions } from 'better-auth'

import type { OAuthProviderId } from './oauth-types'

export type { OAuthProviderId } from './oauth-types'

function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  )
}

function githubConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_CLIENT_ID?.trim() && process.env.GITHUB_CLIENT_SECRET?.trim()
  )
}

/** Provider ids that have both client id and secret set (for UI + server config). */
export function getEnabledOAuthProviderIds(): OAuthProviderId[] {
  const ids: OAuthProviderId[] = []
  if (googleConfigured()) ids.push('google')
  if (githubConfigured()) ids.push('github')
  return ids
}

/** Better Auth `socialProviders` map; empty object if nothing is configured. */
export function getSocialProvidersConfig(): NonNullable<BetterAuthOptions['socialProviders']> {
  const out: NonNullable<BetterAuthOptions['socialProviders']> = {}
  if (googleConfigured()) {
    out.google = {
      clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
    }
  }
  if (githubConfigured()) {
    out.github = {
      clientId: process.env.GITHUB_CLIENT_ID!.trim(),
      clientSecret: process.env.GITHUB_CLIENT_SECRET!.trim(),
    }
  }
  return out
}
