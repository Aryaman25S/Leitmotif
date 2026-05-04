// Scrub controller primitives. Pure functions + constants — no React, no
// THREE — so the easing curve and timecode mapping are testable in isolation
// and shared between the 3D scene and any future surface (e.g. an analytics
// hook that wants to know which frame is on screen).

// Forward sweep whips through the middle four frames so the eye registers
// them as a blur of passing translation states; decelerates into the spec.
// Reverse rewinds with a sharper start, settling at frame 0.
export const FWD_BEZIER = [0.86, 0.02, 0.18, 0.98] as const
export const REV_BEZIER = [0.4, 0.0, 0.25, 1.0] as const
export type BezierPts = readonly [number, number, number, number]

export const FWD_DUR = 1500 // ms — full sweep frame 0 → 5
export const REV_DUR = 1000 // ms — rewind 5 → 0
export const DEMO_DELAY = 2000 // ms — auto-demo starts after this
export const DEMO_HOLD = 1400 // ms — hold the spec frame before rewinding

// Real 24fps timecode endpoints. The cue's actual position in the cut.
const FPS = 24
export const TC_START_FRAMES = 42 * 60 * FPS + 18 * FPS // 00:42:18
export const TC_END_FRAMES = 42 * 60 * FPS + 24 * FPS // 00:42:24

// Newton-Raphson cubic-bezier solver. Given t∈[0,1] (linear progress),
// returns the eased y-value of the curve defined by control points
// (0,0) (p1x,p1y) (p2x,p2y) (1,1). Six iterations is plenty for a frame
// readout — the residual error is well under one pixel of rotation.
export function bezier(
  t: number,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
): number {
  const sampleX = (x: number) =>
    3 * (1 - x) * (1 - x) * x * p1x + 3 * (1 - x) * x * x * p2x + x * x * x
  const sampleY = (x: number) =>
    3 * (1 - x) * (1 - x) * x * p1y + 3 * (1 - x) * x * x * p2y + x * x * x
  const derivX = (x: number) =>
    3 * (1 - x) * (1 - x) * p1x +
    6 * (1 - x) * x * (p2x - p1x) +
    3 * x * x * (1 - p2x)
  let x = t
  for (let i = 0; i < 6; i++) {
    const cx = sampleX(x) - t
    const dx = derivX(x)
    if (Math.abs(dx) < 1e-6) break
    x -= cx / dx
  }
  return sampleY(x)
}

export function formatTimecode(frameCount: number): string {
  const totalSec = Math.floor(frameCount / FPS)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

// Maps a position in frame-space (0..5) to a real timecode for display.
export function timecodeForPos(pos: number): string {
  const tcFrame =
    TC_START_FRAMES + (pos / 5) * (TC_END_FRAMES - TC_START_FRAMES)
  return formatTimecode(tcFrame)
}
