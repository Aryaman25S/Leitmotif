import { LeitmotifWorld } from '@/components/landing/LeitmotifWorld'
import { LoadingState, PageFooter } from './parts'
import s from './binder.module.css'

export default function ProjectLoading() {
  // Mirrors the design's "House lights · opening the binder" leader-countdown
  // skeleton. Masthead is rendered as a static placeholder so the page-shell
  // chrome doesn't pop in when the data lands.
  return (
    <LeitmotifWorld>
      <div className={s.page}>
        <header className={s.mast}>
          <div className={s.mastL}>
            <span className={s.wordmark}>
              <span className={s.perf} /><em>Leitmotif</em>
            </span>
          </div>
          <div className={s.mastC}>
            <div className={s.mastCap}>In the binder</div>
            <div className={s.mastDate}>—</div>
          </div>
          <div className={s.mastR} aria-hidden />
        </header>
        <div className={s.body}>
          <nav className={s.rail}>
            <div className={s.railCap}>
              <span className={s.smallcaps}>Reels</span>
            </div>
            <ol className={s.railList}>
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className={s.railItem}>
                  <button type="button" disabled aria-hidden="true">
                    <span className={s.railMark}>·</span>
                    <span className={s.railBody}>
                      <span className={s.skel} style={{ width: 60, height: 14, display: 'block', marginBottom: 4 }} />
                      <span className={s.skel} style={{ width: 110, height: 11, display: 'block' }} />
                    </span>
                    <span className={s.skel} style={{ width: 22, height: 11, display: 'block' }} />
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <main className={s.main}>
            <LoadingState />
          </main>
        </div>
        <PageFooter projectTitle="…" />
      </div>
    </LeitmotifWorld>
  )
}
