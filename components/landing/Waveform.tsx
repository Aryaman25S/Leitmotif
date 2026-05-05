// Static SVG waveform — quiet, sparse, with one swell around 35-50% of the
// length. Strokes use CSS classes so the colors follow the brief's palette
// (which itself swaps in Print mode for a darker kraft tone).

const N = 140

interface Bar {
  i: number
  height: number
}

const BARS: readonly Bar[] = (() => {
  const out: Bar[] = []
  for (let i = 0; i < N; i++) {
    const t = i / N
    const swell = Math.exp(-Math.pow((t - 0.42) * 6, 2)) * 0.7
    const noise = (Math.sin(i * 1.3) * 0.5 + Math.cos(i * 2.7 + 1) * 0.4) * 0.18
    const height = Math.max(0.04, swell + Math.abs(noise) * 0.5)
    out.push({ i, height })
  }
  return out
})()

export function Waveform() {
  return (
    <svg viewBox={`0 0 ${N} 64`} preserveAspectRatio="none" aria-hidden>
      <line x1="0" y1="32" x2={N} y2="32" className="wave-baseline" strokeWidth="0.4" />
      {BARS.map(({ i, height }) => {
        const ht = height * 56
        return (
          <line
            key={i}
            x1={i + 0.5}
            x2={i + 0.5}
            y1={32 - ht / 2}
            y2={32 + ht / 2}
            className="wave-bar"
            strokeWidth="0.7"
          />
        )
      })}
      {/* in / out cue marks */}
      <line x1="2" y1="6" x2="2" y2="58" className="wave-mark" strokeWidth="0.8" />
      <line x1={N - 2} y1="6" x2={N - 2} y2="58" className="wave-mark" strokeWidth="0.8" />
    </svg>
  )
}
