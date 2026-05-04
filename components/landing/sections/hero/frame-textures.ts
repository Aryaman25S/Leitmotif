import * as THREE from 'three'
import type { FrameDef } from './frames'

// Per-frame Canvas2D textures applied to cylinder arc segments.
// Each frame has its own renderer that paints the typography directly onto
// the canvas. Fonts are resolved from CSS custom properties at first use
// (next/font hashes the family names, so we can't hardcode "Cormorant
// Garamond" — we read whatever `var(--font-cormorant)` resolves to in the
// document).

const TEXTURE_W = 2048
const TEXTURE_H = 560
const PAD = 90

// Constants from the design's amber palette + frame-ink scale.
const C_FRAME_INK = '#1a0e06'
const C_FRAME_INK_2 = '#4a2e18'
const C_EMBER_DEEP = '#6a2410'
const C_FRAME_RULE = '#2a1808'
const C_PENCIL = '#5a1808'
const C_RULE_SOFT = 'rgba(26, 14, 6, 0.28)'
const C_RULE_HAIR = 'rgba(26, 19, 16, 0.18)'
const C_FADED_INK_2 = 'rgba(74, 46, 24, 0.55)'
const C_STAMP_WASH = 'rgba(194, 90, 58, 0.06)' // soft ember wash inside the stamp
const C_STAMP_FAINT = 'rgba(106, 36, 16, 0.35)'
const C_FILM_BASE = '#1a1108' // dark celluloid — matches the cylinder rails

// Width of the dark band drawn at each side edge of every frame texture.
// On the cylinder, two adjacent arcs meet at a seam; their combined edges
// stack into a single visible interframe gap, like real film stock.
const FRAME_SEAM_W = 18

// Resolve a font-family stack from a CSS custom property. next/font hashes
// the family name, so we apply the variable to a probe element and read
// its computed font-family back. Cached per-variable.
const fontStackCache = new Map<string, string>()
function resolveFontStack(cssVar: string, fallback: string): string {
  const cached = fontStackCache.get(cssVar)
  if (cached) return cached
  if (typeof document === 'undefined') return fallback
  const probe = document.createElement('span')
  probe.style.fontFamily = `var(${cssVar}), ${fallback}`
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).fontFamily || fallback
  document.body.removeChild(probe)
  fontStackCache.set(cssVar, resolved)
  return resolved
}

const fonts = () => ({
  serif: resolveFontStack('--font-cormorant', 'Georgia, serif'),
  sans: resolveFontStack('--font-inter', 'Helvetica, Arial, sans-serif'),
  mono: resolveFontStack('--font-jetbrains-mono', 'Menlo, monospace'),
})

// ── shared painters ─────────────────────────────────────────────────────────

function fillAmberBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createRadialGradient(
    w / 2,
    h / 2,
    0,
    w / 2,
    h / 2,
    Math.max(w, h) / 1.6,
  )
  grad.addColorStop(0, '#f4d098')
  grad.addColorStop(0.45, '#e8b878')
  grad.addColorStop(1, '#c89058')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

// Dark celluloid bands at the left + right edges. Combined with the adjacent
// frame's bands at the seam, these read as the interframe gap between film
// frames on real stock. Drawn last in buildFrameTexture so they sit above
// any per-frame content that might extend toward the edges.
function drawFrameSeamMargins(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  ctx.fillStyle = C_FILM_BASE
  ctx.fillRect(0, 0, FRAME_SEAM_W, h)
  ctx.fillRect(w - FRAME_SEAM_W, 0, FRAME_SEAM_W, h)
}

interface MetaTopOpts {
  num: string
  total: string
  label: string // ember-deep
  rightText: string
}
function drawTopMeta(
  ctx: CanvasRenderingContext2D,
  w: number,
  y: number,
  opts: MetaTopOpts,
) {
  const f = fonts()
  ctx.font = `500 30px ${f.mono}`
  ctx.textBaseline = 'top'

  const left1 = `FRAME ${opts.num} / ${opts.total} · `
  ctx.fillStyle = C_FRAME_INK_2
  ctx.textAlign = 'left'
  ctx.fillText(left1, PAD, y)
  const left1W = ctx.measureText(left1).width

  ctx.font = `600 30px ${f.mono}`
  ctx.fillStyle = C_EMBER_DEEP
  ctx.fillText(opts.label.toUpperCase(), PAD + left1W, y)

  ctx.font = `500 30px ${f.mono}`
  ctx.fillStyle = C_FRAME_INK_2
  ctx.textAlign = 'right'
  ctx.fillText(opts.rightText, w - PAD, y)
}

function drawBottomMeta(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  leftText: string,
  rightText: string,
) {
  const f = fonts()
  ctx.fillStyle = C_RULE_SOFT
  ctx.fillRect(PAD, h - 70, w - PAD * 2, 1)

  ctx.font = `500 28px ${f.mono}`
  ctx.fillStyle = C_FRAME_INK_2
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText(leftText.toUpperCase(), PAD, h - 50)
  ctx.textAlign = 'right'
  ctx.fillText(rightText.toUpperCase(), w - PAD, h - 50)
}

// Word-wraps a single style of text to a given max width. Returns lines.
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

// Rich-text token used by F1's underlined quote.
type RichTok = { text: string; underline: boolean }

// Wrap rich tokens, preserving underline metadata across line breaks.
function wrapRichTokens(
  ctx: CanvasRenderingContext2D,
  tokens: RichTok[],
  maxWidth: number,
): RichTok[][] {
  const lines: RichTok[][] = []
  let current: RichTok[] = []
  let cumWidth = 0
  const spaceW = ctx.measureText(' ').width
  for (const tok of tokens) {
    const tokW = ctx.measureText(tok.text).width
    const needed = (current.length > 0 ? spaceW : 0) + tokW
    if (cumWidth + needed > maxWidth && current.length > 0) {
      lines.push(current)
      current = [tok]
      cumWidth = tokW
    } else {
      current.push(tok)
      cumWidth += needed
    }
  }
  if (current.length > 0) lines.push(current)
  return lines
}

// ── F0 — DIALOGUE ──────────────────────────────────────────────────────────
function renderDialogue(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const f = fonts()

  drawTopMeta(ctx, w, 60, {
    num: '01',
    total: '06',
    label: 'Dialogue',
    rightText: 'REEL 3 · SC. 47',
  })

  ctx.font = `500 26px ${f.mono}`
  ctx.fillStyle = C_FRAME_INK_2
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText('DIRECTOR · SPOTTING SESSION', PAD, 130)

  const quoteFontPx = 84
  ctx.font = `italic 400 ${quoteFontPx}px ${f.serif}`
  const lineHeight = quoteFontPx * 1.18
  const quoteText =
    'It should feel like loss. But not sad. More like the absence of something.'
  const lines = wrapText(ctx, quoteText, w - PAD * 2)

  const blockHeight = lines.length * lineHeight
  const quoteTop = (h - blockHeight) / 2 + 10
  ctx.fillStyle = C_FRAME_INK
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let x = PAD
    if (i === 0) {
      ctx.fillStyle = C_EMBER_DEEP
      ctx.fillText('“', x, quoteTop)
      x += ctx.measureText('“ ').width
      ctx.fillStyle = C_FRAME_INK
    }
    if (i === lines.length - 1) {
      ctx.fillText(line, x, quoteTop + i * lineHeight)
      const lineW = ctx.measureText(line).width
      ctx.fillStyle = C_EMBER_DEEP
      ctx.fillText('”', x + lineW + 8, quoteTop + i * lineHeight)
      ctx.fillStyle = C_FRAME_INK
    } else {
      ctx.fillText(line, x, quoteTop + i * lineHeight)
    }
  }

  drawBottomMeta(ctx, w, h, '00:42:18', 'Cue 0014.3')
}

// ── F1 — UNDERSCORE (script supervisor's red underlines) ────────────────────
function renderUnderscore(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const f = fonts()

  drawTopMeta(ctx, w, 60, {
    num: '02',
    total: '06',
    label: 'Read for music',
    rightText: 'REEL 3 · SC. 47',
  })

  // Quote tokens — underline marks indicate which words get the ember rule.
  const tokens: RichTok[] = [
    { text: 'It', underline: false },
    { text: 'should', underline: false },
    { text: 'feel', underline: true },
    { text: 'like', underline: true },
    { text: 'loss.', underline: true },
    { text: 'But', underline: false },
    { text: 'not', underline: true },
    { text: 'sad.', underline: true },
    { text: 'More', underline: false },
    { text: 'like', underline: false },
    { text: 'the', underline: false },
    { text: 'absence', underline: true },
    { text: 'of', underline: true },
    { text: 'something.', underline: true },
  ]

  const quoteFontPx = 84
  ctx.font = `italic 400 ${quoteFontPx}px ${f.serif}`
  const lineHeight = quoteFontPx * 1.18
  const spaceW = ctx.measureText(' ').width
  const lines = wrapRichTokens(ctx, tokens, w - PAD * 2 - 60) // 60 reserves space for trailing close-quote

  const marginaliaH = 50
  const blockH = lines.length * lineHeight + marginaliaH + 50
  const top = (h - blockH) / 2

  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  // Open quote
  ctx.font = `italic 400 ${quoteFontPx}px ${f.serif}`
  ctx.fillStyle = C_EMBER_DEEP
  ctx.fillText('“', PAD, top)
  const openW = ctx.measureText('“').width + spaceW * 0.4

  for (let li = 0; li < lines.length; li++) {
    const lineToks = lines[li]
    const yL = top + li * lineHeight
    let cursor = li === 0 ? PAD + openW : PAD

    // Track underline runs so consecutive underlined tokens get one continuous rule.
    const runs: { from: number; to: number }[] = []
    let runStart = -1
    let lastTokEnd = -1

    for (let i = 0; i < lineToks.length; i++) {
      const tok = lineToks[i]
      if (i > 0) cursor += spaceW
      const tokStart = cursor
      const tokWidth = ctx.measureText(tok.text).width

      ctx.fillStyle = C_FRAME_INK
      ctx.fillText(tok.text, cursor, yL)

      if (tok.underline) {
        if (runStart < 0) runStart = tokStart
        lastTokEnd = tokStart + tokWidth
      } else if (runStart >= 0) {
        runs.push({ from: runStart, to: lastTokEnd })
        runStart = -1
      }
      cursor = tokStart + tokWidth
    }
    if (runStart >= 0) runs.push({ from: runStart, to: lastTokEnd })

    // Close quote on the last line
    if (li === lines.length - 1) {
      ctx.fillStyle = C_EMBER_DEEP
      ctx.fillText('”', cursor + 8, yL)
    }

    // Ember underlines under each run
    ctx.fillStyle = C_EMBER_DEEP
    const underlineY = yL + quoteFontPx + 4
    for (const run of runs) {
      ctx.fillRect(run.from, underlineY, run.to - run.from, 3)
    }
  }

  // Marginalia row — i. loss · ii. not sad · iii. absence
  const marginalY = top + lines.length * lineHeight + 40
  const marg = [
    { num: 'i.', word: 'loss' },
    { num: 'ii.', word: 'not sad' },
    { num: 'iii.', word: 'absence' },
  ]
  let mx = PAD
  for (let i = 0; i < marg.length; i++) {
    if (i > 0) {
      ctx.font = `500 28px ${f.mono}`
      ctx.fillStyle = C_EMBER_DEEP
      ctx.fillText('·', mx, marginalY)
      mx += ctx.measureText('· ').width + 8
    }
    ctx.font = `500 28px ${f.mono}`
    ctx.fillStyle = C_EMBER_DEEP
    ctx.fillText(marg[i].num, mx, marginalY)
    mx += ctx.measureText(marg[i].num).width + 14

    ctx.font = `italic 500 30px ${f.serif}`
    ctx.fillStyle = C_FRAME_INK
    ctx.fillText(marg[i].word, mx, marginalY - 2)
    mx += ctx.measureText(marg[i].word).width + 28
  }

  drawBottomMeta(ctx, w, h, 'Underscore · 3 marks', 'Pencil red')
}

// ── F2 — GLOSS (3-column grid pulling phrases out of the line) ─────────────
function renderGloss(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const f = fonts()

  drawTopMeta(ctx, w, 60, {
    num: '03',
    total: '06',
    label: 'Gloss',
    rightText: 'REEL 3 · SC. 47',
  })

  // Faded source quote — italic serif, frame-ink-2 at 55%.
  ctx.font = `italic 400 50px ${f.serif}`
  ctx.fillStyle = C_FADED_INK_2
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText(
    '“feel like loss · not sad · absence of something.”',
    PAD,
    140,
  )

  // 3-column glosses grid
  const gridY = 240
  const colGap = 40
  const colW = (w - PAD * 2 - colGap * 2) / 3
  const colXs = [PAD, PAD + colW + colGap, PAD + (colW + colGap) * 2]

  const glosses = [
    { from: 'loss', to: 'low register · sub-bass · slow' },
    { from: 'not sad', to: 'no minor 3rd · no sentimental string' },
    { from: 'absence', to: 'silence is the cue · ppp · rubato' },
  ]

  for (let i = 0; i < glosses.length; i++) {
    const g = glosses[i]
    const x = colXs[i]

    // Top hairline rule
    ctx.fillStyle = C_FRAME_RULE
    ctx.fillRect(x, gridY, colW, 1)

    // From — italic serif, frame-ink-2
    ctx.font = `italic 400 38px ${f.serif}`
    ctx.fillStyle = C_FRAME_INK_2
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    ctx.fillText(g.from, x, gridY + 22)

    // Arrow — mono ember-deep
    ctx.font = `500 28px ${f.mono}`
    ctx.fillStyle = C_EMBER_DEEP
    ctx.fillText('⟶', x, gridY + 86)

    // To — mono uppercase, frame-ink
    ctx.font = `400 26px ${f.mono}`
    ctx.fillStyle = C_FRAME_INK
    const toLines = wrapText(ctx, g.to.toUpperCase(), colW)
    for (let li = 0; li < toLines.length; li++) {
      ctx.fillText(toLines[li], x, gridY + 134 + li * 38)
    }
  }

  drawBottomMeta(ctx, w, h, 'Gloss · 3 readings', 'Marginalia')
}

// ── F3 — STAMP (the moment of naming the atmosphere) ───────────────────────
function renderStamp(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const f = fonts()

  drawTopMeta(ctx, w, 60, {
    num: '04',
    total: '06',
    label: 'Name',
    rightText: 'REEL 3 · SC. 47',
  })

  const cx = w / 2
  const stampCenterY = 290

  // Pre-stamp caption
  ctx.font = `500 26px ${f.mono}`
  ctx.fillStyle = C_FRAME_INK_2
  ctx.textBaseline = 'top'
  ctx.textAlign = 'center'
  ctx.fillText('— ATMOSPHERE NAMED —', cx, 150)

  // The stamp box — rotated rectangle with double border (faded outer ring).
  ctx.save()
  ctx.translate(cx, stampCenterY)
  ctx.rotate(-1.6 * (Math.PI / 180))

  const sw = 540
  const sh = 200
  const sx = -sw / 2
  const sy = -sh / 2

  // Faint ember wash inside the stamp box — the ink soaking into the amber.
  // Replaces the cream interior fill that was reading as a separate paste-on
  // panel against the surrounding amber.
  ctx.fillStyle = C_STAMP_WASH
  ctx.fillRect(sx, sy, sw, sh)

  // Faded outer ring (second ink hit) — slightly off-rotation for the
  // distressed-stamp feel.
  ctx.save()
  ctx.rotate(0.6 * (Math.PI / 180))
  ctx.strokeStyle = C_STAMP_FAINT
  ctx.lineWidth = 3
  ctx.strokeRect(sx - 6, sy - 6, sw + 12, sh + 12)
  ctx.restore()

  // Outer ember border
  ctx.strokeStyle = C_EMBER_DEEP
  ctx.lineWidth = 4
  ctx.strokeRect(sx, sy, sw, sh)

  // Inner content
  ctx.fillStyle = C_EMBER_DEEP
  ctx.textBaseline = 'top'
  ctx.textAlign = 'center'

  ctx.font = `600 18px ${f.sans}`
  ctx.fillText('A T M O S P H E R E', 0, sy + 24)

  ctx.font = `600 60px ${f.sans}`
  ctx.fillText('GRIEF', 0, sy + 56)

  ctx.font = `italic 500 22px ${f.serif}`
  ctx.fillText('sorrow, loss', 0, sy + 138)

  ctx.restore()

  // File entry
  ctx.font = `500 22px ${f.mono}`
  ctx.fillStyle = C_FRAME_INK_2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('VOCABULARY ENTRY № 02 · OF 14', cx, stampCenterY + 130)

  drawBottomMeta(ctx, w, h, 'Stamp · LM-0014', 'Approved')
}

// ── F4 — SHORTHAND (handwritten music shorthand on the frame) ──────────────
function renderShorthand(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const f = fonts()

  drawTopMeta(ctx, w, 60, {
    num: '05',
    total: '06',
    label: 'Shorthand',
    rightText: 'REEL 3 · SC. 47',
  })

  const startY = 140
  const rowH = 56
  const fontPx = 42

  const rows = [
    { glyph: '♩=', text: '44 — 48, rubato' },
    { glyph: '⊘', text: 'meter — free, unmetered' },
    { glyph: '∅', text: '3rd — open 5ths, sus 4ths' },
    { glyph: '𝄐', text: 'ppp — mp, never crescendo' },
    { glyph: '∿', text: 'bowed metal · felt piano' },
  ]

  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const y = startY + i * rowH

    ctx.font = `500 ${Math.round(fontPx * 0.78)}px ${f.mono}`
    ctx.fillStyle = C_EMBER_DEEP
    ctx.fillText(r.glyph, PAD, y + 10)
    const glyphW = ctx.measureText(r.glyph).width + 24

    ctx.font = `italic 400 ${fontPx}px ${f.serif}`
    ctx.fillStyle = C_FRAME_INK
    ctx.fillText(r.text, PAD + glyphW, y)

    if (i < rows.length - 1) {
      ctx.fillStyle = C_RULE_HAIR
      ctx.fillRect(PAD, y + rowH - 6, w - PAD * 2, 1)
    }
  }

  // Strikethrough pencil row
  const pencilY = startY + rows.length * rowH + 24
  const items = ['no melody', 'no perc.', 'no vibrato']
  ctx.font = `italic 400 32px ${f.serif}`
  ctx.fillStyle = C_FRAME_INK_2
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  let px = PAD
  for (let i = 0; i < items.length; i++) {
    if (i > 0) {
      ctx.fillStyle = C_FRAME_INK_2
      ctx.fillText(' · ', px, pencilY)
      px += ctx.measureText(' · ').width
    }
    const item = items[i]
    ctx.fillStyle = C_FRAME_INK_2
    ctx.fillText(item, px, pencilY)
    const itemW = ctx.measureText(item).width

    // Pencil-red strike through the middle of the x-height
    ctx.fillStyle = C_PENCIL
    ctx.fillRect(px, pencilY + 18, itemW, 1)

    px += itemW
  }

  drawBottomMeta(ctx, w, h, 'Sketch · pencil', 'Pre-spec')
}

// ── F5 — SPEC (final, structured output) ────────────────────────────────────
function renderSpec(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const f = fonts()

  // Spec-head replaces the standard top-meta row.
  ctx.font = `500 28px ${f.mono}`
  ctx.fillStyle = C_FRAME_INK_2
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText('ATMOSPHERE · ', PAD, 60)
  const labelW = ctx.measureText('ATMOSPHERE · ').width

  ctx.font = `600 28px ${f.mono}`
  ctx.fillStyle = C_EMBER_DEEP
  ctx.fillText('GRIEF', PAD + labelW, 60)

  ctx.font = `500 28px ${f.mono}`
  ctx.fillStyle = C_FRAME_INK_2
  ctx.textAlign = 'right'
  ctx.fillText('CUE 0014.3 · 02′ 14″', w - PAD, 60)

  // dl rows
  const startY = 130
  const rowH = 44
  const labelColW = 220
  const valX = PAD + labelColW + 30

  const rows = [
    { dt: 'TEMPO', dd: 'ƒ. 42–48 bpm, rubato' },
    { dt: 'METER', dd: 'free / unmetered' },
    { dt: 'HARMONY', dd: 'open fifths, suspended fourths, no resolution' },
    { dt: 'REGISTER', dd: 'low strings, sub-bass, occasional high harmonic' },
    { dt: 'DYNAMICS', dd: 'ppp — mp; never crescendo' },
    { dt: 'TIMBRE', dd: 'bowed metal, exhaled brass, felt piano' },
  ]

  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const y = startY + i * rowH

    ctx.font = `500 22px ${f.mono}`
    ctx.fillStyle = C_FRAME_INK_2
    ctx.fillText(r.dt, PAD, y + 4)

    ctx.font = `400 26px ${f.mono}`
    ctx.fillStyle = C_FRAME_INK
    ctx.fillText(r.dd, valX, y)
  }

  // Exclude row — strikethrough values
  const excY = startY + rows.length * rowH
  ctx.font = `500 22px ${f.mono}`
  ctx.fillStyle = C_FRAME_INK_2
  ctx.fillText('EXCLUDE', PAD, excY + 4)

  ctx.font = `400 26px ${f.mono}`
  const excludes = ['percussion', 'melodic motif', 'vibrato']
  let ex = valX
  for (let i = 0; i < excludes.length; i++) {
    if (i > 0) {
      ctx.fillStyle = C_FRAME_INK_2
      ctx.fillText(' · ', ex, excY)
      ex += ctx.measureText(' · ').width
    }
    const item = excludes[i]
    ctx.fillStyle = C_FRAME_INK_2
    ctx.fillText(item, ex, excY)
    const itemW = ctx.measureText(item).width

    ctx.fillStyle = C_PENCIL
    ctx.fillRect(ex, excY + 14, itemW, 1)

    ex += itemW
  }

  // Signoff
  ctx.font = `italic 400 30px ${f.serif}`
  ctx.fillStyle = C_FRAME_INK_2
  ctx.textBaseline = 'top'
  ctx.textAlign = 'right'
  ctx.fillText('— what the composer can play.', w - PAD, excY + 60)

  drawBottomMeta(ctx, w, h, 'Frame 06 / 06 · Spec', '00:42:18 · Cue 0014.3')
}

export function buildFrameTexture(frame: FrameDef): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_W
  canvas.height = TEXTURE_H
  const ctx = canvas.getContext('2d')

  if (ctx) {
    fillAmberBackground(ctx, TEXTURE_W, TEXTURE_H)
    switch (frame.id) {
      case 'f0':
        renderDialogue(ctx, TEXTURE_W, TEXTURE_H)
        break
      case 'f1':
        renderUnderscore(ctx, TEXTURE_W, TEXTURE_H)
        break
      case 'f2':
        renderGloss(ctx, TEXTURE_W, TEXTURE_H)
        break
      case 'f3':
        renderStamp(ctx, TEXTURE_W, TEXTURE_H)
        break
      case 'f4':
        renderShorthand(ctx, TEXTURE_W, TEXTURE_H)
        break
      case 'f5':
        renderSpec(ctx, TEXTURE_W, TEXTURE_H)
        break
    }
    // Draw frame-seam bands last so they sit above any content that
    // approaches the edges.
    drawFrameSeamMargins(ctx, TEXTURE_W, TEXTURE_H)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
