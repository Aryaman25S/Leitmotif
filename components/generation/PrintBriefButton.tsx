'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export default function PrintBriefButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="h-3.5 w-3.5" />
      Print / save as PDF
    </Button>
  )
}
