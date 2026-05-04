import type { ReactNode } from 'react'

// The 6 cognitive frames that make up the hero's translation arc:
//   0 Dialogue → 1 Underscore → 2 Gloss → 3 Stamp → 4 Shorthand → 5 Spec
//
// Each frame's body is the typography that sits ON the amber image area
// (the celluloid + amber backing comes from the cylinder texture, not from
// the overlay). Wrapping classes (.frame, .f{n}) are added by the caller —
// these bodies are pure JSX so they can be reused by the static fallback,
// the 3D HTML overlays, and any future surface (PDF export, etc.).

export interface FrameDef {
  id: 'f0' | 'f1' | 'f2' | 'f3' | 'f4' | 'f5'
  body: ReactNode
}

const f0Body: ReactNode = (
  <>
    <div className="frame-meta">
      <span>
        Frame 01 / 06 · <span className="ember">Dialogue</span>
      </span>
      <span>Reel 3 · Sc. 47</span>
    </div>
    <div className="attrib-strip">Director · spotting session</div>
    <p className="quote">
      <span className="openq">&ldquo;</span>
      It should feel like loss. But not sad.{' '}
      <em>More like the absence of something.</em>
      <span className="closeq">&rdquo;</span>
    </p>
    <div className="frame-meta-bottom">
      <span>00:42:18</span>
      <span>Cue 0014.3</span>
    </div>
  </>
)

const f1Body: ReactNode = (
  <>
    <div className="frame-meta">
      <span>
        Frame 02 / 06 · <span className="ember">Read for music</span>
      </span>
      <span>Reel 3 · Sc. 47</span>
    </div>
    <p className="quote">
      &ldquo;It should <span className="uline">feel like loss</span>. But{' '}
      <span className="uline">not sad</span>. More like the{' '}
      <span className="uline">absence of something</span>.&rdquo;
    </p>
    <div className="marginalia">
      <span>i. <em>loss</em></span>
      <span>ii. <em>not sad</em></span>
      <span>iii. <em>absence</em></span>
    </div>
    <div className="frame-meta-bottom">
      <span>Underscore · 3 marks</span>
      <span>Pencil red</span>
    </div>
  </>
)

const f2Body: ReactNode = (
  <>
    <div className="frame-meta">
      <span>
        Frame 03 / 06 · <span className="ember">Gloss</span>
      </span>
      <span>Reel 3 · Sc. 47</span>
    </div>
    <p className="quote">
      &ldquo;feel like loss · not sad · absence of something.&rdquo;
    </p>
    <div className="glosses">
      <div className="gloss">
        <div className="from"><em>loss</em></div>
        <div className="arrow">⟶</div>
        <div className="to">low register · sub-bass · slow</div>
      </div>
      <div className="gloss">
        <div className="from"><em>not sad</em></div>
        <div className="arrow">⟶</div>
        <div className="to">no minor 3rd · no sentimental string</div>
      </div>
      <div className="gloss">
        <div className="from"><em>absence</em></div>
        <div className="arrow">⟶</div>
        <div className="to">silence is the cue · ppp · rubato</div>
      </div>
    </div>
    <div className="frame-meta-bottom">
      <span>Gloss · 3 readings</span>
      <span>Marginalia</span>
    </div>
  </>
)

const f3Body: ReactNode = (
  <>
    <div className="frame-meta">
      <span>
        Frame 04 / 06 · <span className="ember">Name</span>
      </span>
      <span>Reel 3 · Sc. 47</span>
    </div>
    <div className="stamp-row">
      <div className="approved">— atmosphere named —</div>
      <div className="stamp">
        <span className="head">Atmosphere</span>
        Grief
        <span className="sub">sorrow, loss</span>
      </div>
      <div className="file">Vocabulary entry № 02 · of 14</div>
    </div>
    <div className="frame-meta-bottom">
      <span>Stamp · LM-0014</span>
      <span>Approved</span>
    </div>
  </>
)

const f4Body: ReactNode = (
  <>
    <div className="frame-meta">
      <span>
        Frame 05 / 06 · <span className="ember">Shorthand</span>
      </span>
      <span>Reel 3 · Sc. 47</span>
    </div>
    <div className="shorthand">
      <span className="row"><span className="glyph">♩=</span>44 — 48, rubato</span>
      <span className="row"><span className="glyph">⊘</span>meter — free, unmetered</span>
      <span className="row"><span className="glyph">∅</span>3rd — open 5ths, sus 4ths</span>
      <span className="row"><span className="glyph">𝄐</span>ppp — mp, never crescendo</span>
      <span className="row"><span className="glyph">∿</span>bowed metal · felt piano</span>
    </div>
    <p className="pencil">
      <span className="strike">no melody</span> ·{' '}
      <span className="strike">no perc.</span> ·{' '}
      <span className="strike">no vibrato</span>
    </p>
    <div className="frame-meta-bottom">
      <span>Sketch · pencil</span>
      <span>Pre-spec</span>
    </div>
  </>
)

const f5Body: ReactNode = (
  <>
    <div className="spec-head">
      <span>Atmosphere · <span className="name">Grief</span></span>
      <span>Cue 0014.3 · 02′ 14″</span>
    </div>
    <dl>
      <dt>Tempo</dt><dd>ƒ. 42–48 bpm, rubato</dd>
      <dt>Meter</dt><dd>free / unmetered</dd>
      <dt>Harmony</dt><dd>open fifths, suspended fourths, no resolution</dd>
      <dt>Register</dt><dd>low strings, sub-bass, occasional high harmonic</dd>
      <dt>Dynamics</dt><dd>ppp — mp; never crescendo</dd>
      <dt>Timbre</dt><dd>bowed metal, exhaled brass, felt piano</dd>
      <dt>Exclude</dt>
      <dd className="exclude">
        <span>percussion</span> · <span>melodic motif</span> · <span>vibrato</span>
      </dd>
    </dl>
    <p className="signoff">— what the composer can play.</p>
    <div className="frame-meta-bottom">
      <span>
        Frame 06 / 06 · <span className="spec-tag">Spec</span>
      </span>
      <span>00:42:18 · Cue 0014.3</span>
    </div>
  </>
)

export const FRAMES: FrameDef[] = [
  { id: 'f0', body: f0Body },
  { id: 'f1', body: f1Body },
  { id: 'f2', body: f2Body },
  { id: 'f3', body: f3Body },
  { id: 'f4', body: f4Body },
  { id: 'f5', body: f5Body },
]
