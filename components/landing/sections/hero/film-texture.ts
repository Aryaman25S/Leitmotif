import * as THREE from 'three'

// PHASE 2 — celluloid + perforations baked onto a Canvas2D surface, then
// uploaded as a CanvasTexture and UV-mapped onto the cylinder.
//
// Layout (vertical):  [top rail w/ perf cutouts] [amber image area] [bottom rail w/ perf cutouts]
//
// The perfs are punched with destination-out so they're true alpha holes in
// the texture. With material.transparent = true on the cylinder, the page
// bg shows through the perfs — and the curve geometry takes care of
// foreshortening them naturally as they wrap around the reel.
//
// The amber band is a flat fill here; per-frame radial gradients + grain +
// scratches go on the HTML overlays in phase 3, where they belong with the
// frame's typography.

export interface FilmTextureOptions {
  width?: number
  height?: number
  /** Top + bottom rail height as a fraction of texture height. */
  railFraction?: number
  /** Total perfs around the cylinder per rail. */
  perfCount?: number
  /** Perf width as a fraction of one perf-cell width (cell = W / perfCount). */
  perfWidthFraction?: number
  /** Perf height as a fraction of rail height. */
  perfHeightFraction?: number
}

export function buildFilmTextureCanvas(opts: FilmTextureOptions = {}): HTMLCanvasElement {
  const W = opts.width ?? 2048
  const H = opts.height ?? 256
  const RAIL_FRACTION = opts.railFraction ?? 0.22
  const RAIL_H = Math.round(H * RAIL_FRACTION)
  const PERF_COUNT = opts.perfCount ?? 24
  const PERF_CELL = W / PERF_COUNT
  const PERF_W = PERF_CELL * (opts.perfWidthFraction ?? 0.45)
  const PERF_H = RAIL_H * (opts.perfHeightFraction ?? 0.55)
  const PERF_R = Math.min(PERF_W, PERF_H) * 0.12

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  // 1. Dark celluloid base — top + bottom rails
  ctx.fillStyle = '#1a1108'
  ctx.fillRect(0, 0, W, RAIL_H)
  ctx.fillRect(0, H - RAIL_H, W, RAIL_H)

  // 2. Amber image area between the rails
  ctx.fillStyle = '#e8b878'
  ctx.fillRect(0, RAIL_H, W, H - RAIL_H * 2)

  // 3. Hairline shadow where rail meets amber — sells the celluloid edge
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(0, RAIL_H, W, 1)
  ctx.fillRect(0, H - RAIL_H - 1, W, 1)

  // 4. Lighter rim around each perforation — a ring of warmer mid-celluloid
  // tone that stays visible against any page bg (dark theater, cream print).
  // Drawn slightly larger than the punch; the punch in step 5 then removes
  // only the rim's interior, leaving a thin visible outline around each hole.
  const RIM_W = 2
  ctx.fillStyle = 'rgba(80, 55, 30, 1)'
  for (let i = 0; i < PERF_COUNT; i++) {
    const cx = (i + 0.5) * PERF_CELL
    const x = cx - PERF_W / 2 - RIM_W
    const yTop = RAIL_H / 2 - PERF_H / 2 - RIM_W
    const yBot = H - RAIL_H / 2 - PERF_H / 2 - RIM_W
    drawRoundRect(
      ctx,
      x,
      yTop,
      PERF_W + RIM_W * 2,
      PERF_H + RIM_W * 2,
      PERF_R + RIM_W,
    )
    ctx.fill()
    drawRoundRect(
      ctx,
      x,
      yBot,
      PERF_W + RIM_W * 2,
      PERF_H + RIM_W * 2,
      PERF_R + RIM_W,
    )
    ctx.fill()
  }

  // 5. Punch perforations through both rails. destination-out replaces alpha
  // with the inverse, leaving real holes in the texture — but the rim from
  // step 4 survives as an outline because it sits outside the punch.
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = '#000'
  for (let i = 0; i < PERF_COUNT; i++) {
    const cx = (i + 0.5) * PERF_CELL
    const x = cx - PERF_W / 2
    const yTop = RAIL_H / 2 - PERF_H / 2
    const yBot = H - RAIL_H / 2 - PERF_H / 2
    drawRoundRect(ctx, x, yTop, PERF_W, PERF_H, PERF_R)
    ctx.fill()
    drawRoundRect(ctx, x, yBot, PERF_W, PERF_H, PERF_R)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'

  return canvas
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function buildFilmTexture(opts?: FilmTextureOptions): THREE.CanvasTexture {
  const canvas = buildFilmTextureCanvas(opts)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  // Cylinder default UVs map u: 0→1 around circumference, v: 0→1 bottom→top.
  // The texture wraps once; one perf cycle = circumference / perfCount.
  return tex
}
