'use client'

import { useEffect, useState } from 'react'

// "ADMIT ONE 2026" stamp — renders unrotated server-side, settles to -3deg
// after mount. Reduced-motion users see the rotated state immediately (CSS
// media query in ticketStyles.ts handles that path with `transition: none`).

export function AdmitStamp() {
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), 120)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className={`stamp${settled ? ' settled' : ''}`} aria-hidden="true">
      <span className="big">Admit</span>
      <span>One · 2026</span>
    </div>
  )
}
