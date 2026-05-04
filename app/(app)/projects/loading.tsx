import { LeitmotifWorld } from '@/components/landing/LeitmotifWorld'
import s from './projects.module.css'
import { LoadingState, PageFooter, StaticFilterRail } from './parts'
import { mastheadDate } from './lib'

export default function ProjectsLoading() {
  const now = new Date()
  return (
    <LeitmotifWorld>
      <div className={s['ll-page']}>
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
          <div className={s['ll-mast-r']} />
        </header>
        <div className={s['ll-body']}>
          <StaticFilterRail />
          <main className={s['ll-main']}>
            <LoadingState />
          </main>
        </div>
        <PageFooter />
      </div>
    </LeitmotifWorld>
  )
}
