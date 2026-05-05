'use client'

import { useWorld, USER_FACING_WORLDS, type UserFacingWorld } from './WorldProvider'

const LABELS: Record<UserFacingWorld, string> = {
  theater: 'Theater',
  print: 'Print',
}

// Compact two-state toggle styled to read as part of the masthead's smallcaps
// nav row. Active world picks up --ink, inactive sits at --ink-3, hover lifts
// to --ember to match other masthead links.
export function WorldToggle() {
  const { world, setWorld } = useWorld()

  return (
    <div role="radiogroup" aria-label="Display world" className="world-toggle">
      {USER_FACING_WORLDS.map((w, i) => {
        const active = world === w
        return (
          <span key={w} className="world-toggle-item">
            {i > 0 && <span aria-hidden className="world-toggle-sep">·</span>}
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setWorld(w)}
              className={active ? 'world-toggle-opt is-active' : 'world-toggle-opt'}
            >
              {LABELS[w]}
            </button>
          </span>
        )
      })}
    </div>
  )
}
