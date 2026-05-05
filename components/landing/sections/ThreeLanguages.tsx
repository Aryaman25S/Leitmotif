import { Fragment } from 'react'
import { FolioHead } from '../FolioHead'

// Three columns refracting the same scene through Director / System / Composer
// voices. The vocabulary bridge made visible.

const STRUCT_EXCLUDES = ['perc.', 'melody', 'vibrato']

export function ThreeLanguages() {
  return (
    <section className="three-lang" id="translation">
      <div className="wrap">
        <FolioHead
          num="III"
          label="Translation"
          title="One scene, said three ways."
          meta="Reel 3 · Cue 0014.3"
        />
      </div>

      <div className="wrap">
        <div className="three-cols">
          {/* i. Director */}
          <div className="three-col">
            <div className="col-num">
              <span>i.</span> &nbsp; The Director
            </div>
            <h4>Emotional intent</h4>
            <p className="body-emot">
              <span className="openq">“</span>
              The room after she leaves. The light is the same. The chair is the same.{' '}
              <em>Something has been removed and the room hasn’t noticed yet.</em>
              <span className="closeq">”</span>
            </p>
            <div className="joint" aria-hidden />
          </div>

          {/* ii. System */}
          <div className="three-col">
            <div className="col-num">
              <span>ii.</span> &nbsp; The System
            </div>
            <h4>Structured intent</h4>
            <ul className="tag-list">
              <li className="tag ember">Atmosphere · Absence</li>
              <li className="tag">Function · interior reflection</li>
              <li className="tag">Density · sparse</li>
              <li className="tag">Arc · static</li>
              <li className="tag">Diegesis · non-diegetic</li>
              <li className="tag">Duration · 02′ 14″</li>
            </ul>
            <dl className="struct-rows">
              <dt>Cue №</dt><dd>0014.3</dd>
              <dt>Reel</dt><dd>3 of 7</dd>
              <dt>In</dt><dd>00:42:18:00</dd>
              <dt>Out</dt><dd>00:44:32:00</dd>
            </dl>
            <div className="joint" aria-hidden />
          </div>

          {/* iii. Composer */}
          <div className="three-col">
            <div className="col-num">
              <span>iii.</span> &nbsp; The Composer
            </div>
            <h4>Musical specification</h4>
            <dl className="struct-rows">
              <dt>Tempo</dt><dd>ƒ. 42–48 bpm, rubato</dd>
              <dt>Meter</dt><dd>free</dd>
              <dt>Key</dt><dd>D, modal — no third</dd>
              <dt>Harmony</dt><dd>open 5ths, suspended 4ths</dd>
              <dt>Register</dt><dd>low strings, sub-bass</dd>
              <dt>Dynamics</dt><dd>ppp — mp</dd>
              <dt>Timbre</dt><dd>bowed metal, felt piano</dd>
              <dt>Exclude</dt>
              <dd className="exclude">
                {STRUCT_EXCLUDES.map((x, i) => (
                  <Fragment key={x}>
                    <span>{x}</span>
                    {i < STRUCT_EXCLUDES.length - 1 ? ' · ' : ''}
                  </Fragment>
                ))}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
