'use client'

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react'

export type World = 'theater' | 'faded' | 'archive' | 'print'

export const ALL_WORLDS = ['theater', 'faded', 'archive', 'print'] as const satisfies readonly World[]

// Worlds exposed in the user-facing toggle. Faded/Archive remain reachable
// programmatically (via setWorld or ?world=) for design review.
export const USER_FACING_WORLDS = ['theater', 'print'] as const satisfies readonly World[]
export type UserFacingWorld = (typeof USER_FACING_WORLDS)[number]

const STORAGE_KEY = 'leitmotif:world'
const DEFAULT_WORLD: World = 'theater'

function isWorld(v: unknown): v is World {
  return v === 'theater' || v === 'faded' || v === 'archive' || v === 'print'
}

// data-world on <html> is the source of truth — set pre-hydration by the
// inline script in app/layout.tsx and updated by setWorld below. React
// subscribes via MutationObserver so any code path that flips the attribute
// (e.g. a future devtools shortcut) keeps the UI in sync.
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-world'],
  })
  return () => observer.disconnect()
}

function getSnapshot(): World {
  const v = document.documentElement.getAttribute('data-world')
  return isWorld(v) ? v : DEFAULT_WORLD
}

function getServerSnapshot(): World {
  return DEFAULT_WORLD
}

interface WorldContextValue {
  world: World
  setWorld: (w: World) => void
}

const WorldContext = createContext<WorldContextValue | null>(null)

export function useWorld(): WorldContextValue {
  const ctx = useContext(WorldContext)
  if (!ctx) throw new Error('useWorld must be used inside <WorldProvider>')
  return ctx
}

export function WorldProvider({ children }: { children: React.ReactNode }) {
  const world = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setWorld = useCallback((w: World) => {
    document.documentElement.setAttribute('data-world', w)
    try {
      localStorage.setItem(STORAGE_KEY, w)
    } catch {
      // localStorage may be unavailable (private mode, quota); the in-memory
      // attribute on <html> still drives the session.
    }
  }, [])

  return <WorldContext.Provider value={{ world, setWorld }}>{children}</WorldContext.Provider>
}
