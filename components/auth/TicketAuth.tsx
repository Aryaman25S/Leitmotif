'use client'

import { useId, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import type { OAuthProviderId } from '@/lib/oauth-types'
import { AdmitStamp } from './AdmitStamp'
import { TicketHouseChrome } from './TicketHouseChrome'
import { TicketOAuthLane } from './TicketOAuthLane'
import { TicketPerforation } from './TicketPerforation'
import { TicketStub } from './TicketStub'
import { ticketStyles } from './ticketStyles'

export type TicketAuthMode = 'signin' | 'signup'
type SubmitState = 'idle' | 'loading' | 'error'
type FocusKey = 'email' | 'password' | null

type Props = {
  initialMode: TicketAuthMode
  oauthProviders?: OAuthProviderId[]
}

export function TicketAuth({ initialMode, oauthProviders = [] }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/projects'

  const [mode, setMode] = useState<TicketAuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focus, setFocus] = useState<FocusKey>(null)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isSignup = mode === 'signup'
  const callbackURL = isSignup ? '/projects' : next

  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()

  function switchMode(target: TicketAuthMode) {
    if (target === mode) return
    setMode(target)
    setErrorMessage(null)
    setSubmitState('idle')
    setShowPassword(false)
    setFocus(null)
    if (typeof window !== 'undefined') {
      const path = target === 'signup' ? '/sign-up' : '/sign-in'
      const search = window.location.search
      window.history.replaceState(null, '', `${path}${search}`)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    setSubmitState('loading')

    if (isSignup) {
      // Display name is derived from the email local-part; users can update
      // it from the app once signed in. This keeps the auth ticket compact
      // (two fields, same height in both modes).
      const derivedName = email.trim().split('@')[0] || 'User'
      const { error } = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: derivedName,
        callbackURL,
      })
      if (error) {
        setErrorMessage(error.message ?? 'Sign up failed')
        setSubmitState('error')
        return
      }
    } else {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL,
      })
      if (error) {
        setErrorMessage(error.message ?? 'Sign in failed')
        setSubmitState('error')
        return
      }
    }

    setSubmitState('idle')
    router.push(callbackURL)
    router.refresh()
  }

  const isLoading = submitState === 'loading'
  const isError = submitState === 'error'
  const ticketSerial = isSignup ? '00448' : '00447'
  const headlineCopy = isSignup ? 'New ticket · admit one' : 'Re-admittance · welcome back'
  const ctaCopy = isLoading
    ? 'Tearing your stub…'
    : isSignup
      ? 'Reserve a seat'
      : 'Take your seat'

  return (
    <div className="lm-auth">
      <style dangerouslySetInnerHTML={{ __html: ticketStyles }} />

      <TicketHouseChrome isSignup={isSignup} />

      <div className="ticket">
        <TicketStub />
        <TicketPerforation />

        <form
          className="main"
          onSubmit={onSubmit}
          noValidate={false}
          aria-describedby={isError ? errorId : undefined}
        >
          <div className="main-head">
            <div className="L" aria-hidden="true">Box · office</div>
            <h1 className="C">{headlineCopy}</h1>
            <div className="R" aria-hidden="true">No · {ticketSerial}</div>
          </div>

          <div className="main-meta" aria-hidden="true">
            <div>House<strong>The Booth</strong></div>
            <div>Programme<strong>Vol. <em>iv</em></strong></div>
            <div>Print<strong>23.976 fps</strong></div>
            <div>Cipher<strong>· · · ·</strong></div>
          </div>

          <div className="tabs" role="tablist" aria-label="Sign in or sign up">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              className={`tab${!isSignup ? ' active' : ''}`}
              onClick={() => switchMode('signin')}
            >
              <span className="lbl">Stub · 01</span>
              <span className="ttl">Re-admit me</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              className={`tab${isSignup ? ' active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              <span className="lbl">Stub · 02</span>
              <span className="ttl">New patron</span>
            </button>
          </div>

          <div className="field">
            <div className={`row${focus === 'email' ? ' focus' : ''}`}>
              <label htmlFor={emailId} className="k">Address</label>
              <input
                id={emailId}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocus('email')}
                onBlur={() => setFocus(null)}
                placeholder="you@studio.film"
                autoComplete="email"
                required
              />
              <span className="meta" aria-hidden="true">By post</span>
            </div>
            <div className={`row${focus === 'password' ? ' focus' : ''}`}>
              <label htmlFor={passwordId} className="k">Cipher</label>
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocus('password')}
                onBlur={() => setFocus(null)}
                placeholder={isSignup ? 'eight characters or longer' : '··········'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                minLength={isSignup ? 8 : undefined}
              />
              {isSignup ? (
                <button
                  type="button"
                  className="meta link"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              ) : (
                // TODO: wire to real password recovery flow — placeholder lives at /recover.
                <Link href="/recover" className="meta link">
                  Lost cipher?
                </Link>
              )}
            </div>
          </div>

          <div className="chit-slot" id={errorId} role="alert" aria-live="polite">
            {isError && errorMessage && (
              <div className="chit">
                <span className="label">Misprint</span>
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="admit">
            <button
              type="submit"
              className={`btn${isLoading ? ' loading' : ''}`}
              disabled={isLoading}
            >
              <span>{ctaCopy}</span>
              <span className="reel" aria-hidden="true" />
              <span className="arrow" aria-hidden="true">→</span>
            </button>
            <AdmitStamp />
          </div>

          <TicketOAuthLane providers={oauthProviders} callbackURL={callbackURL} />

          <div className="fine">
            <span>
              By admittance you accept the <em>house cues</em> &amp; <em>privacy</em>
            </span>
            <span aria-hidden="true">Box office · open · 24h</span>
          </div>
        </form>
      </div>

      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </div>
  )
}
