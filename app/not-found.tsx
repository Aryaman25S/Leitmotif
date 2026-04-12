import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-4 py-16">
      <div className="max-w-md text-center space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">404</p>
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          That link may be wrong, or the resource was removed.
        </p>
      </div>
      <Link href="/" className={cn(buttonVariants())}>
        Back to home
      </Link>
    </div>
  )
}
