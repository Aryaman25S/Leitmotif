import Link from 'next/link'
import { WorldToggle } from '@/components/landing/WorldToggle'
import s from './projects.module.css'
import { greetingWord, mastheadDate } from './lib'
import { AccountMenu } from './AccountMenu'

interface UserShape { name: string | null; email: string }

export function Masthead({ user, now }: { user: UserShape; now: Date }) {
  return (
    <header className={s['ll-mast']}>
      <div className={s['ll-mast-l']}>
        <div className={s['ll-wordmark']}>
          <span className={s['ll-perf']} /><em>Leitmotif</em>
        </div>
      </div>
      <div className={s['ll-mast-c']}>
        <div className={s['ll-mast-cap']}>Tonight&rsquo;s bill</div>
        <div className={s['ll-mast-date']}>{mastheadDate(now)}</div>
      </div>
      <div className={s['ll-mast-r']}>
        <WorldToggle />
        <AccountMenu user={user} />
      </div>
    </header>
  )
}

export function Greeting({
  user,
  now,
  attentionCount,
  activeCount,
}: {
  user: UserShape
  now: Date
  attentionCount: number
  activeCount: number
}) {
  const word = greetingWord(now)
  const displayName = user.name?.trim() || user.email
  return (
    <section className={s['ll-greet']}>
      <div className={s['ll-greet-credit']}>
        <span className={s['ll-smallcaps']}>Programme</span>
        <span className={s['ll-greet-rule']} />
        <span className={s['ll-smallcaps']}>For the desk of</span>
        <span className={s['ll-greet-name']}>{displayName}</span>
      </div>
      <h1 className={s['ll-greet-title']}>
        <span className={s['ll-greet-q']}>&ldquo;</span>
        {word}, {displayName.split(' ')[0]}. {attentionCount === 1 ? 'There is ' : 'There are '}<em>{attentionCount}</em>
        {' '}thing{attentionCount === 1 ? '' : 's'} asking for you,
        and <em>{activeCount}</em> production{activeCount === 1 ? '' : 's'} in rotation.
        <span className={s['ll-greet-q']}>&rdquo;</span>
      </h1>
      <div className={s['ll-greet-foot']}>
        <span className={s['ll-greet-line']} />
        <span className={s['ll-smallcaps']}>Pick a production to enter</span>
        <span className={s['ll-greet-or']}>or</span>
        <Link className={s['ll-greet-begin']} href="/projects/new">Begin a new one</Link>
      </div>
    </section>
  )
}

export function EmptyState() {
  return (
    <section className={s['ll-empty']}>
      <div className={s['ll-empty-rule-top']} />
      <div className={s['ll-empty-folio']}>
        <span className={s['ll-folio-orn']} />
        <span className={s['ll-smallcaps']}>House lights</span>
        <span className={s['ll-folio-orn']} />
      </div>
      <h2 className={s['ll-empty-title']}>
        <span className={s['ll-greet-q']}>&ldquo;</span>
        Your bill is empty.
        <span className={s['ll-greet-q']}>&rdquo;</span>
      </h2>
      <p className={s['ll-empty-sub']}>
        Every Leitmotif begins with a project: a feature, an episode, a short, a sixty-second spot.
        Name it, brief its tone, and the first scene card opens.
      </p>
      <div className={s['ll-empty-actions']}>
        <Link className={s['ll-btn-primary']} href="/projects/new">Begin a new production</Link>
        <span className={s['ll-empty-or']}>or</span>
        <Link className={s['ll-btn-quiet']} href="/sign-in">Accept an invitation</Link>
      </div>
      <div className={s['ll-empty-rule-bot']} />
      <div className={s['ll-empty-margin']}>
        <span className={s['ll-smallcaps']}>Footnote</span>
        <p>If a director has invited you, the invitation arrives by email and lands here as your first programme.</p>
      </div>
    </section>
  )
}

export function LoadingState() {
  return (
    <section className={s['ll-loading']}>
      <div className={s['ll-load-folio']}>
        <span className={s['ll-folio-orn']} />
        <span className={s['ll-smallcaps']}>House lights</span>
        <span className={s['ll-folio-orn']} />
        <span className={s['ll-load-ellipsis']}>loading the bill</span>
      </div>
      <div className={s['ll-load-leader']}>
        {[8, 7, 6, 5, 4, 3].map((n, i) => (
          <span key={n} className={`${s['ll-leader']} ${i === 2 ? s['is-now'] : ''}`}>{n}</span>
        ))}
      </div>
      <ol className={`${s['ll-rows']} ${s['ll-rows--skel']}`}>
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className={`${s['ll-row']} ${s['ll-row--skel']}`}>
            <div className={s['ll-row-cue']}><span className={`${s['ll-skel']} ${s['ll-skel-cue']}`} /></div>
            <div className={s['ll-row-title']}>
              <span className={`${s['ll-skel']} ${s['ll-skel-title']}`} />
              <span className={`${s['ll-skel']} ${s['ll-skel-fmt']}`} />
            </div>
            <div className={s['ll-row-credit']}>
              <span className={`${s['ll-skel']} ${s['ll-skel-credit']}`} />
              <span className={`${s['ll-skel']} ${s['ll-skel-credit-sub']}`} />
            </div>
            <div className={s['ll-row-standing']}>
              <span className={`${s['ll-skel']} ${s['ll-skel-standing']}`} />
            </div>
            <div className={s['ll-row-last']}>
              <span className={`${s['ll-skel']} ${s['ll-skel-last']}`} />
            </div>
            <div className={s['ll-row-enter']}><span className={`${s['ll-skel']} ${s['ll-skel-arrow']}`} /></div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function PageFooter() {
  return (
    <footer className={s['ll-foot']}>
      <span>© Leitmotif Programme · MMXXVI</span>
      <span className={s['ll-foot-c']}>· a vocabulary bridge ·</span>
      <span>Printed in the projection booth</span>
    </footer>
  )
}

const SKELETON_FILTERS = [
  'All productions',
  'Productions I direct',
  'Productions I compose for',
  'Productions I supervise',
  'Sound design',
  'I am observing',
] as const

export function StaticFilterRail() {
  // Body-grid balance during loading; items are inert until real data arrives.
  return (
    <nav className={s['ll-filter']}>
      <div className={s['ll-filter-cap']}>
        <span className={s['ll-smallcaps']}>Filed under</span>
      </div>
      <ul className={s['ll-filter-list']}>
        {SKELETON_FILTERS.map((label) => (
          <li key={label} className={s['ll-filter-item']}>
            <button type="button" disabled aria-hidden="true">
              <span className={s['ll-filter-mark']}>·</span>
              <span className={s['ll-filter-label']}>{label}</span>
              <span className={s['ll-filter-count']}>··</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
