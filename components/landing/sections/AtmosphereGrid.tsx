'use client'

import { Fragment, useState } from 'react'
import { ATMOSPHERES, type Atmosphere } from '../atmospheres'
import { FolioHead } from '../FolioHead'

interface CellProps {
  a: Atmosphere
  active: boolean
  onPick: (n: string, hoverOnly: boolean) => void
}

function AtmosphereCell({ a, active, onPick }: CellProps) {
  return (
    <button
      type="button"
      className={`atm-cell ${active ? 'is-active' : ''}`}
      style={{ background: a.swatch.bg, color: a.swatch.ink }}
      onClick={() => onPick(a.n, false)}
      onMouseEnter={() => onPick(a.n, true)}
      onFocus={() => onPick(a.n, true)}
    >
      <div
        className="figure"
        aria-hidden
        style={{ background: a.swatch.ground, backgroundImage: a.swatch.figure }}
      />
      <div className="top">
        <span className="num">№ {a.n}</span>
        <span className="dot" aria-hidden />
      </div>
      <div className="bottom">
        <h3 className="name" style={{ color: a.swatch.ink }}>
          {a.name}
        </h3>
        <div className="reg" style={{ color: a.swatch.ink, opacity: 0.78 }}>
          {a.register}
        </div>
      </div>
    </button>
  )
}

export function AtmosphereGrid() {
  // `active` follows hover for the detail panel; `pinned` only changes on click,
  // so the grid keeps a visible selected outline even while another cell is hovered.
  const [activeN, setActiveN] = useState('01')
  const [pinnedN, setPinnedN] = useState('01')
  const active = ATMOSPHERES.find((a) => a.n === activeN) ?? ATMOSPHERES[0]

  const pick = (n: string, hoverOnly: boolean) => {
    setActiveN(n)
    if (!hoverOnly) setPinnedN(n)
  }

  return (
    <section className="atm-section" id="vocabulary">
      <div className="wrap">
        <FolioHead
          num="II"
          label="Vocabulary"
          title="Fourteen atmospheres, each its own film stock."
          meta="Hover to read · click to pin"
        />
      </div>

      <div className="wrap">
        <div className="atm-grid" role="list">
          {ATMOSPHERES.map((a) => (
            <AtmosphereCell key={a.n} a={a} active={a.n === pinnedN} onPick={pick} />
          ))}
        </div>
      </div>

      <div className="atm-detail" key={active.n}>
        <div className="wrap">
          <div className="atm-detail-inner flow-fade">
            <div>
              <div className="num-big">№ {active.n} — Atmosphere</div>
              <h3>{active.name}</h3>
              <div className="reg">{active.register}</div>
              <div className="refs">
                <span className="smallcaps refs-eyebrow">In the lineage of</span>
                <em>{active.refs}</em>
              </div>
            </div>
            <div>
              <article className="spec-card spec-card-detail">
                <div className="head">
                  <span>
                    Musical translation · <span className="ember">{active.name}</span>
                  </span>
                  <span>Spec v.1</span>
                </div>
                <dl className="spec-rows">
                  <dt>Tempo</dt><dd>{active.spec.tempo}</dd>
                  <dt>Meter</dt><dd>{active.spec.meter}</dd>
                  <dt>Harmony</dt><dd>{active.spec.harmony}</dd>
                  <dt>Register</dt><dd>{active.spec.register}</dd>
                  <dt>Dynamics</dt><dd>{active.spec.dynamics}</dd>
                  <dt>Texture</dt><dd>{active.spec.texture}</dd>
                  <dt>Timbre</dt><dd>{active.spec.timbre}</dd>
                  <dt>Exclude</dt>
                  <dd className="exclude">
                    {active.spec.exclude.split(',').map((x, i, arr) => (
                      <Fragment key={i}>
                        <span>{x.trim()}</span>
                        {i < arr.length - 1 ? ' · ' : ''}
                      </Fragment>
                    ))}
                  </dd>
                </dl>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
