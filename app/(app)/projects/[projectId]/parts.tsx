import Link from 'next/link'
import { WorldToggle } from '@/components/landing/WorldToggle'
import { AccountMenu } from '@/app/(app)/projects/AccountMenu'
import { mastheadDate } from '@/app/(app)/projects/lib'
import s from './binder.module.css'

interface UserShape { name: string | null; email: string }

export function Masthead({
  user,
  now,
  caption = 'In the binder',
}: {
  user: UserShape
  productionTitle?: string
  now: Date
  caption?: string
}) {
  return (
    <header className={s.mast}>
      <div className={s.mastL}>
        <Link href="/projects" className={s.wordmark} title="Tonight's bill">
          <span className={s.perf} /><em>Leitmotif</em>
        </Link>
      </div>
      <div className={s.mastC}>
        <div className={s.mastCap}>{caption}</div>
        <div className={s.mastDate}>{mastheadDate(now)}</div>
      </div>
      <div className={s.mastR}>
        <WorldToggle />
        <AccountMenu user={user} />
      </div>
    </header>
  )
}

export function LoadingState() {
  return (
    <section className={s.loading}>
      <div className={s.loadFolio}>
        <span className={s.folioOrn} />
        <span className={s.smallcaps}>House lights</span>
        <span className={s.folioOrn} />
        <span className={s.loadEllipsis}>opening the binder</span>
      </div>
      <div className={s.loadLeader}>
        {[5, 4, 3, 2, 1, 'R'].map((n, i) => (
          <span key={String(n)} className={`${s.leader} ${i === 2 ? s.leaderNow : ''}`}>{n}</span>
        ))}
      </div>
      {[0, 1].map((r) => (
        <div key={r} className={s.loadReel}>
          <div className={s.loadReelHead}>
            <span className={s.skel} style={{ width: 80, height: 18 }} />
            <span className={s.skel} style={{ width: 220, height: 14 }} />
          </div>
          <ol className={`${s.rows} ${s.rowsSkel}`}>
            {[0, 1, 2].map((i) => (
              <li key={i} className={`${s.row} ${s.rowSkel}`}>
                <div className={s.rowCue}><span className={s.skel} style={{ width: 28, height: 18 }} /></div>
                <div className={s.rowTitle}>
                  <span className={s.skel} style={{ width: '70%', height: 22, marginBottom: 8, display: 'block' }} />
                  <span className={s.skel} style={{ width: '40%', height: 11, display: 'block' }} />
                </div>
                <div className={s.rowIntent}>
                  <span className={s.skel} style={{ width: '60%', height: 14, display: 'block' }} />
                </div>
                <div className={s.rowStatus}>
                  <span className={s.skel} style={{ width: '70%', height: 14, display: 'block' }} />
                </div>
                <div className={s.rowEnter}><span className={s.skel} style={{ width: 32, height: 16, display: 'block', marginLeft: 'auto' }} /></div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  )
}

export function PageFooter({ projectTitle }: { projectTitle: string }) {
  return (
    <footer className={s.foot}>
      <span>© Leitmotif Programme · binder for {projectTitle}</span>
      <span className={s.footC}>— a vocabulary bridge —</span>
      <span>Production binder</span>
    </footer>
  )
}
