// Skeleton for /projects/[id]/settings — keeps the masthead and form-head
// visible while server data resolves so the page doesn't flash. Mirrors the
// real form's spacing so layout shift is minimal when data lands.

import { LeitmotifWorld } from '@/components/landing/LeitmotifWorld'
import s from './settings.module.css'

export default function SettingsLoading() {
  return (
    <LeitmotifWorld>
      <main className={s.page}>
        <div style={{ height: 14 }} />
        <header className={s.formHead}>
          <div>
            <div className={s.formNo}>
              <span className={s.punch} />Form 7B · Production Record
            </div>
            <div style={{ height: 56, display: 'flex', alignItems: 'center' }}>
              <span className={s.skel} style={{ width: 280, height: 36 }} />
            </div>
          </div>
          <div className={s.formStamp}>
            <span className={s.skel} style={{ width: 140, height: 14, display: 'inline-block' }} />
          </div>
        </header>

        <div className={s.formMeta}>
          <div>Owner<strong><span className={s.skel} style={{ width: 120, height: 16 }} /></strong></div>
          <div>Last revised<strong><span className={s.skel} style={{ width: 100, height: 16 }} /></strong></div>
          <div>Open cues<strong><span className={s.skel} style={{ width: 80, height: 16 }} /></strong></div>
        </div>

        {[1, 2, 3].map((i) => (
          <section key={i} className={s.sec}>
            <div className={s.secRail}>
              <div className={s.secNum}>§{i}</div>
              <div className={s.secTag}>
                <span className={s.skel} style={{ width: 80, height: 10 }} />
              </div>
            </div>
            <div className={s.secBody}>
              <div style={{ marginBottom: 22 }}>
                <span className={s.skel} style={{ width: '40%', height: 24, display: 'block', marginBottom: 12 }} />
                <span className={s.skel} style={{ width: '70%', height: 14, display: 'block' }} />
              </div>
              <div style={{ display: 'grid', gap: 14 }}>
                {[0, 1, 2].map((j) => (
                  <span key={j} className={s.skel} style={{ width: '100%', height: 36 }} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </main>
    </LeitmotifWorld>
  )
}
