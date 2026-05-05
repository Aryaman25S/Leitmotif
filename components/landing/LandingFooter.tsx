// Quiet editorial colophon. Most links are placeholder destinations from the
// design — the only live mailto and intra-page anchors are kept; the rest land
// on '#' until we have real targets.

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="wrap">
        <div className="colophon">
          <div>
            <div className="word">
              <span className="word-perf" aria-hidden />
              Leitmotif
            </div>
            <p>A vocabulary bridge between film directors and composers.</p>
          </div>

          <div>
            <h6>The work</h6>
            <ul>
              <li><a href="#vocabulary">Vocabulary</a></li>
              <li><a href="#brief">The brief</a></li>
              <li><a href="#method">Method</a></li>
              <li><a href="#">Press</a></li>
            </ul>
          </div>

          <div>
            <h6>Reading</h6>
            <ul>
              <li><a href="#">A note on temp tracks</a></li>
              <li><a href="#">On disclosure</a></li>
              <li><a href="#">Index of cues</a></li>
            </ul>
          </div>

          <div>
            <h6>Contact</h6>
            <ul>
              <li><a href="mailto:hello@leitmotif.studio">hello@leitmotif.studio</a></li>
              <li><a href="#">Studio enquiries</a></li>
              <li><a href="#">For composers</a></li>
            </ul>
          </div>
        </div>

        <div className="fineprint">
          <span>© MMXXVI · Leitmotif Editions · Set in Cormorant &amp; JetBrains Mono</span>
          <span className="closing">
            Music is what the film already knows about itself. We are only here to listen for it.
          </span>
        </div>
      </div>
    </footer>
  )
}
