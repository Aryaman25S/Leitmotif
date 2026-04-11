export default function ProjectsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted/60 rounded animate-pulse mt-2" />
        </div>
        <div className="h-8 w-28 bg-muted rounded-lg animate-pulse" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-5 w-16 bg-muted/60 rounded-full animate-pulse" />
            </div>
            <div className="h-3.5 w-full bg-muted/40 rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted/30 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
