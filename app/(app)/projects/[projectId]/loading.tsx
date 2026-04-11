export default function ProjectLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-52 bg-muted rounded animate-pulse" />
            <div className="h-5 w-16 bg-muted/60 rounded-full animate-pulse" />
          </div>
          <div className="h-4 w-72 bg-muted/40 rounded animate-pulse mt-1.5" />
        </div>
        <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
      </div>

      <div className="h-px bg-border my-6" />

      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-28 bg-muted/50 rounded animate-pulse" />
        <div className="h-7 w-24 bg-muted rounded-lg animate-pulse" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-lg border border-border"
          >
            <div className="h-4 w-8 bg-muted/50 rounded animate-pulse" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted/40 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 bg-muted/40 rounded-full animate-pulse" />
              <div className="h-3 w-16 bg-muted/40 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
