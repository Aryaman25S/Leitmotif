import { HeroReelClient } from './hero/HeroReelClient'

export function Hero() {
  return (
    <section className="hero hero-reel" id="hero" aria-label="Reel">
      <div className="hero-credit">
        <span className="smallcaps">A vocabulary bridge between directors &amp; composers</span>
        <span className="smallcaps">Cue Sheet № 0014 — Reel 3</span>
      </div>

      <div className="stage">
        <HeroReelClient />
      </div>

      <div className="timecode-wrap">
        <div className="timecode">
          <span className="led" aria-hidden="true" />
          <span id="timecode-display">00:42:18</span>
        </div>
      </div>

      <div className="actions" id="enter">
        <a className="btn-primary" href="#vocabulary">
          Enter the Vocabulary
        </a>
        <a className="btn-quiet" href="#brief">
          Read a sample brief →
        </a>
      </div>
    </section>
  )
}
