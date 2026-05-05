// Decorative perforation column between stub and main panels of the ticket.
// The half-moon punches at top and bottom and the dotted vertical line are
// painted entirely in CSS via the `.perf` selector in ticketStyles.ts.

export function TicketPerforation() {
  return (
    <div className="perf" aria-hidden="true">
      <div className="marks" />
      <div className="tear-hint">Tear · here</div>
    </div>
  )
}
