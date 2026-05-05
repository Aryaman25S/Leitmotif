import { LeitmotifWorld } from '@/components/landing/LeitmotifWorld'
import binderStyles from '@/app/(app)/projects/[projectId]/binder.module.css'
import s from './editor.module.css'

// Bar widths for the loading skeleton — fixed at module load so the render is
// deterministic and the result is stable across SSR/CSR. Eight bars of varying
// width is a nicer rhythm than uniform pulses.
const SKEL_BARS = [62, 96, 78, 110, 70, 132, 88, 104]

export default function SceneLoading() {
  return (
    <LeitmotifWorld>
      <div className={binderStyles.page}>
        {/* Skeleton masthead — three columns, a quiet wordmark + caption. */}
        <header className={binderStyles.mast}>
          <div className={binderStyles.mastL}>
            <span className={binderStyles.wordmark}>
              <span className={binderStyles.perf} /><em>Leitmotif</em>
            </span>
          </div>
          <div className={binderStyles.mastC}>
            <div className={binderStyles.mastCap}>At the workbench</div>
            <div className={binderStyles.mastDate}>house lights · opening the leaf</div>
          </div>
          <div className={binderStyles.mastR} aria-hidden />
        </header>

        {/* Skeleton slate. */}
        <header className={s.slate}>
          <nav className={s.slateCrumbs}>
            <span>← <span>Loading…</span></span>
          </nav>
          <div className={s.slatePrimary}>
            <div className={s.slateMeta}>
              <span className={s.slateMetaCue}>Cue —</span>
              <span className={s.slateMetaSep}>·</span>
              <span className={s.slateMetaPos}>— of —</span>
            </div>
            <h1 className={s.slateTitle}>—</h1>
          </div>
          <div className={s.slateR}>
            <span className={s.tc}><em>—</em><span className={s.tcArrow}>→</span><em>—</em></span>
          </div>
        </header>

        {/* Skeleton body — empty picture + faint brief outline + leader spinner. */}
        <div className={s.body}>
          <div className={s.colLeft}>
            <section className={s.block}>
              <div className={s.blockHead}>
                <span className={s.blockNum}>i.</span>
                <h2 className={s.blockTitle}>The picture</h2>
              </div>
              <div className={`${s.picture} ${s.pictureEmpty}`}>
                <div className={s.pictureStrip}>
                  <div className={s.picturePerfs} />
                  <div className={s.pictureFrame} aria-hidden />
                  <div className={s.picturePerfs} />
                </div>
              </div>
            </section>

            <section className={s.block}>
              <div className={s.blockHead}>
                <span className={s.blockNum}>I.</span>
                <h2 className={s.blockTitle}>The brief</h2>
                <span className={s.blockAside}>opening the binder…</span>
              </div>
              <div className={s.density}>
                {SKEL_BARS.map((w, i) => (
                  <div key={i} className={s.dens} style={{ opacity: 0.4 }}>
                    <span className={s.densCap}>—</span>
                    <span className={s.densGlyph} style={{ width: w }} />
                    <span className={s.densLabel}>—</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className={s.colRight}>
            <section className={`${s.result} ${s.resultGen}`}>
              <div className={s.genBody}>
                <div className={s.leader}>3</div>
                <h3 className={s.genTitle}>House lights.</h3>
                <p className={s.genSub}>The leaf is still loading.</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </LeitmotifWorld>
  )
}
