// Shared editorial section opener — used by every section from II onward.
// Renders as: top hairline + ornamented folio marker + title row with side meta.

interface FolioHeadProps {
  /** Roman numeral, e.g. "II". */
  num: string
  /** Section label, e.g. "Vocabulary". */
  label: string
  /** Title in display italic. */
  title: string
  /** Lead column meta (left). Can be empty. */
  lead?: string
  /** Right-aligned meta (right). */
  meta?: string
}

export function FolioHead({ num, label, title, lead = '', meta = '' }: FolioHeadProps) {
  return (
    <div className="sec-head">
      <div className="folio">
        <span className="line" aria-hidden />
        <span className="num">№ {num}</span>
        <span className="orn" aria-hidden />
        <span>{label}</span>
        <span className="orn" aria-hidden />
        <span className="line" aria-hidden />
      </div>
      <div className="row">
        <span className="lead">{lead}</span>
        <h2>{title}</h2>
        <span className="lead lead-right">{meta}</span>
      </div>
    </div>
  )
}
