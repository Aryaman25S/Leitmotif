// Decorative cinema-house chrome surrounding the ticket — drape backdrop,
// upper/lower house rules, mast (top) and foot (bottom). All `aria-hidden`;
// the auth form alone carries semantic meaning.

type Props = {
  isSignup: boolean
}

export function TicketHouseChrome({ isSignup }: Props) {
  return (
    <>
      <div className="drape" aria-hidden="true" />
      <div className="house-rule top" aria-hidden="true" />
      <div className="house-rule bot" aria-hidden="true" />

      <div className="house-mast" aria-hidden="true">
        <div>
          <span className="live-dot">●</span>&nbsp; House · open
        </div>
        <div className="C">
          <span className="perf-dot" /> Leitmotif <em style={{ fontStyle: 'italic', color: '#b8ad95' }}>· box office</em>
        </div>
        <div>Vol. iv · 12 &nbsp; · &nbsp; Aperture ƒ 2.8</div>
      </div>

      <div className="house-foot" aria-hidden="true">
        <div>Doors · half-hour prior</div>
        <div>{isSignup ? 'New patrons · welcome' : 'Returning patrons · welcome back'}</div>
        <div>Curated nightly</div>
      </div>
    </>
  )
}
