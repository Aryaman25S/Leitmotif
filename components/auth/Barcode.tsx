// Synthetic 36-bar barcode for the ticket stub footer. Heights are derived
// from a fixed sine pattern so server and client renders match — no random.

export function Barcode() {
  const heights: number[] = []
  for (let i = 0; i < 36; i++) {
    heights.push(8 + Math.round((Math.sin(i * 1.7) + 1) * 8 + (i % 3 === 0 ? 8 : 0)))
  }
  return (
    <div className="bars" aria-hidden="true">
      {heights.map((h, i) => (
        <i key={i} style={{ height: h }} />
      ))}
    </div>
  )
}
