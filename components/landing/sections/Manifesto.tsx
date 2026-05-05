import { FolioHead } from '../FolioHead'

// "Stet" is the editor's mark meaning "let it stand" — used here against
// strikethroughs to set up "what this is not", with each item's editor's
// note explaining what Leitmotif actually is.

interface Item {
  marker: string
  strike: string
  ed: string
}

const ITEMS: readonly Item[] = [
  {
    marker: 'Stet — not',
    strike: 'a digital audio workstation.',
    ed: 'Leitmotif does not produce final cues. The composer does.',
  },
  {
    marker: 'Stet — not',
    strike: 'an AI music generator.',
    ed: 'The reference cue is a sketch, disclosed as a sketch. It exists to be replaced.',
  },
  {
    marker: 'Stet — not',
    strike: 'a creative ceiling for composers.',
    ed: 'The brief is the floor. What you build above it is yours.',
  },
]

export function Manifesto() {
  return (
    <section className="manifesto" id="stet">
      <div className="wrap">
        <FolioHead
          num="VI"
          label="Stet"
          title="What this is not."
          meta="Editor’s marks"
        />
      </div>
      <div className="wrap manifesto-body">
        <div aria-hidden />
        <ol className="list">
          {ITEMS.map((it, i) => (
            <li key={i}>
              <span className="marker">{it.marker}</span>
              <span>
                <span className="strike">{it.strike}</span>
                <span className="ed">{it.ed}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
