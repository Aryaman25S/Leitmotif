'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { HeroReelStatic } from './HeroReelStatic'

// Lazy-load the WebGL bundle. ssr: false keeps three / R3F out of the
// server-rendered HTML and the initial client chunk; it loads only when this
// component decides to mount the scene. While the chunk is loading,
// `loading:` keeps the static fallback visible — no flash of empty stage.
const HeroReelScene = dynamic(
  () => import('./HeroReel.scene').then((m) => m.HeroReelScene),
  { ssr: false, loading: () => <HeroReelStatic /> },
)

// One-shot WebGL probe. Headless captures, very old browsers, and some
// accessibility tools that disable hardware acceleration return null here;
// when that happens we never load the scene bundle.
function detectWebGL(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (!window.WebGLRenderingContext) return false
    const probe = document.createElement('canvas')
    const ctx =
      probe.getContext('webgl2') ?? probe.getContext('webgl')
    return !!ctx
  } catch {
    return false
  }
}

export function HeroReelClient() {
  // Tri-state: 'pending' (initial server + first client render before the
  // media-query check), 'allow' (load scene), 'reduce' (suppress scene;
  // static fallback is the final view).
  const [motionState, setMotionState] = useState<
    'pending' | 'allow' | 'reduce'
  >('pending')
  // Wait for the editorial fonts before mounting the scene; otherwise Canvas2D
  // bakes system fallback fonts into the per-frame textures.
  const [fontsReady, setFontsReady] = useState(false)
  // IntersectionObserver gate: only kick off the dynamic import when the hero
  // is within a viewport of the screen. Visitors who immediately scroll past
  // or bounce don't pay the bundle cost.
  const [inView, setInView] = useState(false)
  // null = still detecting, true/false = result.
  const [webglOk, setWebglOk] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setMotionState(mq.matches ? 'reduce' : 'allow')
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let active = true
    document.fonts.ready.then(() => {
      if (active) setFontsReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const detect = () => setWebglOk(detectWebGL())
    detect()
  }, [])

  useEffect(() => {
    const stage = document.querySelector(
      '.leitmotif-world .hero .stage',
    ) as HTMLElement | null
    const allow = () => setInView(true)
    if (!stage) {
      allow()
      return
    }
    if (typeof IntersectionObserver === 'undefined') {
      // Older browsers — assume in view rather than block forever.
      allow()
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            allow()
            obs.disconnect()
            break
          }
        }
      },
      // Trigger when the stage is within one viewport of the visible area —
      // gives the bundle a head-start before the strip is actually on screen.
      { rootMargin: '100% 0px 100% 0px' },
    )
    obs.observe(stage)
    return () => obs.disconnect()
  }, [])

  const sceneCanLoad =
    motionState === 'allow' &&
    fontsReady &&
    webglOk === true &&
    inView
  if (!sceneCanLoad) return <HeroReelStatic />
  return <HeroReelScene />
}
