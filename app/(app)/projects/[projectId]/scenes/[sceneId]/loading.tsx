export default function SceneLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
        <div className="h-4 w-2 bg-muted/30 rounded animate-pulse" />
        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
      </div>

      {/* Meta strip */}
      <div className="mb-5 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-5 w-12 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-36 bg-muted/40 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Video placeholder */}
          <div className="aspect-video rounded-xl border-2 border-dashed border-border bg-muted/10 animate-pulse" />

          {/* Tabs skeleton */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1 bg-muted rounded-lg p-[3px] h-8">
              <div className="bg-background rounded-md animate-pulse" />
              <div className="bg-transparent rounded-md" />
            </div>

            {/* Intent form skeleton */}
            <div className="space-y-5 mt-4">
              <div>
                <div className="h-4 w-36 bg-muted/50 rounded animate-pulse mb-3" />
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-7 rounded-full bg-muted/30 animate-pulse"
                      style={{ width: `${60 + Math.random() * 80}px` }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-48 bg-muted/50 rounded animate-pulse" />
                <div className="h-8 w-full bg-muted/20 rounded-lg border border-border animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                <div className="h-8 w-full bg-muted/20 rounded-lg border border-border animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
          <div className="h-8 w-full bg-muted/40 rounded-lg animate-pulse" />
          <div className="h-3 w-56 bg-muted/30 rounded animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  )
}
