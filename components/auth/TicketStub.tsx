'use client'

import { useEffect, useMemo, useState } from 'react'
import { AUTH_LEITMOTIFS } from './auth-leitmotifs'
import { Barcode } from './Barcode'

// Left "now showing" stub — supporting context, decorative.
// Rotates through AUTH_LEITMOTIFS every 3.2s; reduced-motion users see entry
// 0 statically (no interval scheduled at all).

export function TicketStub() {
  const [showIdx, setShowIdx] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(
      () => setShowIdx((i) => (i + 1) % AUTH_LEITMOTIFS.length),
      3200
    )
    return () => window.clearInterval(t)
  }, [])

  const showing = AUTH_LEITMOTIFS[showIdx]
  const featured = useMemo(
    () => [0, 1, 2, 3].map((k) => AUTH_LEITMOTIFS[(showIdx + k) % AUTH_LEITMOTIFS.length]),
    [showIdx]
  )

  return (
    <aside className="stub" aria-hidden="true">
      <div className="stub-head">
        <span>Patron · stub</span>
        <span className="seat">Row C · Seat 14</span>
      </div>

      <div className="stub-meta">
        <div>
          Programme<strong>{showing.num} of 07</strong>
        </div>
        <div>
          Curtain<strong>20:00 · nightly</strong>
        </div>
      </div>

      <div className="marquee">
        <div className="marquee-eyebrow">
          <span>Now · showing</span>
          <span className="red">●  on the screen</span>
        </div>
        <div className="now-showing">
          <span className="red">{showing.num}</span> &middot; {showing.name}
        </div>
        <div className="now-reg">{showing.reg}</div>

        <ul className="now-feat">
          {featured.slice(1).map((f, i) => (
            <li key={f.num}>
              <span className="n">{f.num}</span>
              <span className="t">{f.name}</span>
              <span className="d">
                {i === 0 ? 'next · 20:42' : i === 1 ? 'next · 21:18' : 'late · 22:00'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="stub-foot">
        <div className="price">
          ƒ 2.8 <small>· house · admit</small>
        </div>
        <div className="barcode">
          <Barcode />
          LM · 04 · {showing.num} · 2026
        </div>
      </div>
    </aside>
  )
}
