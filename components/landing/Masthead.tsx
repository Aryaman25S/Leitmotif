import Link from 'next/link'
import { WorldToggle } from './WorldToggle'

export function Masthead() {
  return (
    <header className="masthead">
      <div className="left">
        <span className="smallcaps">Issue 01 — Vol. I</span>
        <span className="issue">May ’26</span>
      </div>
      <div className="center">
        <span className="wordmark">
          <span className="perf" aria-hidden />
          Leitmotif
        </span>
      </div>
      <div className="right">
        <a className="smallcaps" href="#vocabulary">Vocabulary</a>
        <a className="smallcaps" href="#brief">The Brief</a>
        {/* The page-wide "go into the app" CTA — equivalent to the previous
            "Get started" button. Hero CTAs stay as in-page anchors. */}
        <Link className="smallcaps" href="/sign-in">Enter</Link>
        <span className="masthead-divider" aria-hidden />
        <WorldToggle />
      </div>
    </header>
  )
}
