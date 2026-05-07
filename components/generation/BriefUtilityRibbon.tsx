'use client'

import { useWorld } from '@/components/landing/WorldProvider'

interface BriefUtilityRibbonProps {
  fileTag: string
}

export default function BriefUtilityRibbon({ fileTag }: BriefUtilityRibbonProps) {
  const { world, setWorld } = useWorld()
  const isPaper = world === 'print' || world === 'faded'

  return (
    <div className="brief-doc-utility" role="toolbar" aria-label="Brief utilities">
      <div className="file-tag">
        <span className="dot" aria-hidden />
        <span>{fileTag}</span>
      </div>
      <div className="actions">
        <div className="toggle" role="group" aria-label="Display mode">
          <button
            type="button"
            aria-pressed={isPaper}
            onClick={() => setWorld('print')}
          >
            Paper
          </button>
          <button
            type="button"
            aria-pressed={!isPaper}
            onClick={() => setWorld('theater')}
          >
            Theater
          </button>
        </div>
        <span className="sep" aria-hidden />
        <button
          type="button"
          className="bd-btn"
          title="Print this brief"
          onClick={() => window.print()}
        >
          Print
        </button>
        <button
          type="button"
          className="bd-btn"
          title="Jump to receipt"
          onClick={() => {
            const el = document.getElementById('bd-receipt')
            if (!el) return
            // Honor prefers-reduced-motion — for users who've opted out,
            // smooth scroll is exactly the kind of motion they don't want.
            const reduce = typeof window !== 'undefined'
              && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
            el.scrollIntoView({
              behavior: reduce ? 'auto' : 'smooth',
              block: 'start',
            })
          }}
        >
          Acknowledge ↓
        </button>
      </div>
    </div>
  )
}
