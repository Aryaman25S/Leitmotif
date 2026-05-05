import { FolioHead } from '../FolioHead'
import { Waveform } from '../Waveform'

// The centerfold artifact. Rendered on its own paper-stock palette (a fixed
// cream in Theater/Faded/Archive; a darker kraft in Print so it stands clear
// of the cream page) — see globals.css `.brief` and the
// `[data-world="print"]` override.

export function ComposerBrief() {
  return (
    <section className="brief-section" id="brief">
      <div className="wrap">
        <FolioHead
          num="IV"
          label="The Brief"
          title="The artifact a composer can work from."
          meta="Centerfold · printable"
        />
        <p className="sec-sub">Not a screen. A document.</p>
      </div>

      <div className="wrap">
        <article className="brief" aria-label="Composer brief">
          <header className="brief-head">
            <div className="L">Cue Sheet · LM-0014</div>
            <div className="C">Quiet Cartography</div>
            <div className="R">Reel 3 of 7 · Sc. 47</div>
          </header>

          <div className="brief-meta">
            <div>
              Cue № <strong>0014.3</strong>
            </div>
            <div>
              In <strong>00:42:18:00</strong>
            </div>
            <div>
              Out <strong>00:44:32:00</strong>
            </div>
            <div>
              Length <strong>02′ 14″</strong>
            </div>
          </div>

          <div className="brief-body">
            <div className="brief-col left">
              <h5>
                <span className="num">i.</span> Scene
              </h5>
              <p className="brief-scene">
                Interior. Apartment, late afternoon. She has gone. He stands in the doorway and
                does not enter. The room continues without him.
              </p>

              <h5>
                <span className="num">ii.</span> Direction
              </h5>
              <p className="brief-direction">
                It should feel like loss. But not sad. More like the absence of something. Hold
                the room. Let the music notice what he can’t.
              </p>

              <h5>
                <span className="num">iii.</span> Atmosphere &amp; function
              </h5>
              <ul className="brief-tags">
                <li className="ember">Absence</li>
                <li>Interior reflection</li>
                <li>Sparse</li>
                <li>Static</li>
                <li>Non-diegetic</li>
              </ul>

              <p className="brief-anno">
                Margin note — the cue should end before he turns to leave, not after. Music
                withdraws first.
              </p>
            </div>

            <div className="brief-col right">
              <h5>
                <span className="num">iv.</span> Musical specification
              </h5>
              <dl className="brief-spec">
                <dt>Tempo</dt><dd>ƒ. 42–48 bpm, rubato</dd>
                <dt>Meter</dt><dd>free / unmetered</dd>
                <dt>Key</dt><dd>D, modal — no third</dd>
                <dt>Harmony</dt><dd>open 5ths, sus. 4ths, no resolution</dd>
                <dt>Register</dt><dd>low strings · sub-bass · occasional high harmonic</dd>
                <dt>Dynamics</dt><dd>ppp — mp; never crescendo</dd>
                <dt>Timbre</dt><dd>bowed metal, exhaled brass, felt piano</dd>
                <dt>Exclude</dt>
                <dd className="exclude">
                  <span>percussion</span> · <span>melodic motif</span> · <span>vibrato</span>
                </dd>
              </dl>

              <div className="brief-wave">
                <div className="label">
                  <span>Reference cue · LM-0014.3.wav</span>
                  <span>02′ 14″ · −18 LUFS</span>
                </div>
                <Waveform />
                <div className="scale">
                  <span>00:42:18</span>
                  <span>00:43:00</span>
                  <span>00:43:30</span>
                  <span>00:44:00</span>
                  <span>00:44:32</span>
                </div>
              </div>

              <div className="brief-prompt">
                <div className="label">Prompt — disclosed in full</div>
                <p>
                  ATMOSPHERE = Absence; FUNCTION = interior reflection; DENSITY = sparse;
                  TEMPO = 44 rubato; METER = free; HARM = open5/sus4, no resolution;
                  REG = low strings + sub-bass + 1 high harmonic; DYN = ppp→mp;
                  TIMBRE = bowed metal, exhaled brass, felt piano;
                  EXCLUDE = perc, melody, vibrato; END BEFORE motion.
                </p>
              </div>
            </div>
          </div>

          <footer className="brief-sign">
            <div>
              Director <span>K. Halland</span>
            </div>
            <div>
              Composer <span>— pending</span>
            </div>
            <div>
              Filed <span>14.v.2026 · 16:42</span>
            </div>
          </footer>
        </article>
      </div>
    </section>
  )
}
