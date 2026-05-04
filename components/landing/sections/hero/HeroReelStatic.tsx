import { FRAMES } from './frames'

// SSR fallback / reduced-motion view: the centered Dialogue frame as plain
// HTML. Mounted by Hero.tsx before the WebGL bundle loads; remains the only
// render for users with prefers-reduced-motion, for environments without
// WebGL, and for the brief loading window before the dynamic chunk arrives.
//
// Frame body is pulled from the shared FRAMES array so this stays in sync
// with whatever the 3D scene paints into F0 — single source of truth.
export function HeroReelStatic() {
  const f0 = FRAMES[0]
  return (
    <div className="hero-reel-static" aria-hidden="false">
      <div className="frame f0">
        <div className="rail" aria-hidden="true" />
        <div className="image">
          <div className="frame-content">{f0.body}</div>
        </div>
        <div className="rail" aria-hidden="true" />
      </div>
    </div>
  )
}
