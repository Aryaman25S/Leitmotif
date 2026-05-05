import { WorldProvider } from './WorldProvider'

// Editorial type primitives (--font-cormorant / --font-inter /
// --font-jetbrains-mono) live on <body> via app/layout.tsx, so they're
// available to every route without scoping. This wrapper just opts a subtree
// into the world system: applies the .leitmotif-world surface styles
// (which alias --serif/--sans/--mono and bind background/color to the active
// world tokens) and provides the world context for the toggle.

export function LeitmotifWorld({ children }: { children: React.ReactNode }) {
  return (
    <div className="leitmotif-world" data-density="airy">
      <WorldProvider>{children}</WorldProvider>
    </div>
  )
}
