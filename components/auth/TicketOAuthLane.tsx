'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import type { OAuthProviderId } from '@/lib/oauth-types'

// Bottom SSO row — bespoke styling for the ticket main panel. Uses the real
// Google "G" mark (4-color official) and the official GitHub Octocat for
// recognizability/trust; the editorial register lives in the typography and
// "Continue · Google · Lane · 02" labels.

const LANE: Record<OAuthProviderId, string> = {
  google: 'Lane · 02',
  github: 'Lane · 03',
}

const LABEL: Record<OAuthProviderId, string> = {
  google: 'Google',
  github: 'GitHub',
}

type Props = {
  providers: OAuthProviderId[]
  callbackURL: string
}

export function TicketOAuthLane({ providers, callbackURL }: Props) {
  const [pending, setPending] = useState<OAuthProviderId | null>(null)

  if (providers.length === 0) return null

  async function onOAuth(provider: OAuthProviderId) {
    setPending(provider)
    const { error } = await authClient.signIn.social({ provider, callbackURL })
    if (error) {
      setPending(null)
    }
  }

  return (
    <div className="sso2">
      {providers.map((id) => (
        <button
          key={id}
          type="button"
          className="b"
          disabled={pending !== null}
          onClick={() => onOAuth(id)}
          aria-label={`Continue with ${LABEL[id]}`}
        >
          <span className="l">
            {id === 'google' ? <GoogleMark /> : <GitHubMark />}
            <span>
              {pending === id ? 'Redirecting…' : `Continue · ${LABEL[id]}`}
            </span>
          </span>
          <span className="lane">{LANE[id]}</span>
        </button>
      ))}
    </div>
  )
}

function GoogleMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.581-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  )
}

function GitHubMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      className="glyph-mono"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}
