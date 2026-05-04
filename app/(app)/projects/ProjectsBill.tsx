'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ProjectListRow } from '@/lib/store'
import s from './projects.module.css'
import {
  casualRelative, computeStanding, formatDisplay, roleCredit, toRoman,
} from './lib'
import { EmptyState } from './parts'

interface FilterDef {
  id: string
  label: string
  roles: readonly string[] | null
}

const FILTERS: readonly FilterDef[] = [
  { id: 'all',       label: 'All productions',           roles: null },
  { id: 'direct',    label: 'Productions I direct',      roles: ['owner', 'director'] },
  { id: 'compose',   label: 'Productions I compose for', roles: ['composer'] },
  { id: 'supervise', label: 'Productions I supervise',   roles: ['music_supervisor'] },
  { id: 'sound',     label: 'Sound design',              roles: ['sound_designer'] },
  { id: 'observe',   label: 'I am observing',            roles: ['viewer'] },
] as const

function matchesFilter(row: ProjectListRow, filterId: string): boolean {
  const f = FILTERS.find((x) => x.id === filterId)
  if (!f || !f.roles) return true
  return f.roles.includes(row.viewerRole)
}

export function ProjectsBill({
  rows,
  greeting,
}: {
  rows: ProjectListRow[]
  greeting: React.ReactNode
}) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filterId = params.get('role') ?? 'all'
  const activeFilter = FILTERS.find((f) => f.id === filterId) ? filterId : 'all'

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length }
    for (const f of FILTERS) {
      if (!f.roles) continue
      c[f.id] = rows.filter((r) => f.roles!.includes(r.viewerRole)).length
    }
    return c
  }, [rows])

  const visible = useMemo(() => rows.filter((r) => matchesFilter(r, activeFilter)), [rows, activeFilter])

  function setFilter(id: string) {
    const next = new URLSearchParams(params.toString())
    if (id === 'all') next.delete('role')
    else next.set('role', id)
    const q = next.toString()
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
  }

  return (
    <div className={s['ll-body']}>
      <nav className={s['ll-filter']}>
        <div className={s['ll-filter-cap']}>
          <span className={s['ll-smallcaps']}>Filed under</span>
        </div>
        <ul className={s['ll-filter-list']}>
          {FILTERS.map((f) => {
            const c = counts[f.id] ?? 0
            const active = activeFilter === f.id
            return (
              <li key={f.id} className={`${s['ll-filter-item']} ${active ? s['is-active'] : ''}`}>
                <button onClick={() => setFilter(f.id)} type="button">
                  <span className={s['ll-filter-mark']}>{active ? '—' : '·'}</span>
                  <span className={s['ll-filter-label']}>{f.label}</span>
                  <span className={s['ll-filter-count']}>{String(c).padStart(2, '0')}</span>
                </button>
              </li>
            )
          })}
        </ul>
        {/* TODO: archived projects filter — needs schema migration to add Project.archived */}
      </nav>

      <main className={s['ll-main']}>
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {greeting}
            <CueSheet rows={visible} />
          </>
        )}
      </main>
    </div>
  )
}

function CueSheet({ rows }: { rows: ProjectListRow[] }) {
  return (
    <section>
      <header className={s['ll-sheet-head']}>
        <div className={s['ll-sheet-head-num']}>№</div>
        <div>Production</div>
        <div>Credit · your role</div>
        <div>Standing</div>
        <div>Last entered</div>
        <div className={s['ll-sheet-head-enter']}>&nbsp;</div>
      </header>
      <ol className={s['ll-rows']}>
        {rows.map((row, idx) => <ProjectRow key={row.id} row={row} idx={idx} />)}
      </ol>
      <footer className={s['ll-sheet-foot']}>
        <span className={s['ll-sheet-foot-l']}>· end of bill ·</span>
        <Link className={s['ll-sheet-foot-r']} href="/projects/new">
          <span className={s['ll-foot-arrow']}>+</span>
          <span className={s['ll-foot-label']}>Begin a new production</span>
          <span className={s['ll-foot-sub']}>title · format · tone brief</span>
        </Link>
      </footer>
    </section>
  )
}

function ProjectRow({ row, idx }: { row: ProjectListRow; idx: number }) {
  const credit = roleCredit(row.viewerRole, row.counterpartName, row.counterpartRole)
  const standing = computeStanding(row, row.viewerRole)
  const last = casualRelative(new Date(row.updated_at))
  const attention = standing.find(
    (it): it is { kind: 'approval' | 'ack'; text: string } =>
      it.kind === 'approval' || it.kind === 'ack'
  )
  const margin = attention ? marginCopy(attention.kind, row, credit.key) : null

  return (
    <li>
      <Link
        href={`/projects/${row.id}`}
        className={`${s['ll-row']} ${attention ? s['ll-row--attn'] : ''} ${s[`ll-row--${credit.key}`]}`}
        aria-label={`Enter ${row.title}`}
      >
      <div className={s['ll-row-cue']}>
        <span className={s['ll-row-cue-num']}>{toRoman(idx + 1)}</span>
        <span className={s['ll-row-cue-bell']} aria-hidden={!attention}>{attention ? '●' : ''}</span>
      </div>

      <div className={s['ll-row-title']}>
        <h2>{row.title}</h2>
        <div className={s['ll-row-fmt']}>
          <span>{formatDisplay(row.format)}</span>
        </div>
      </div>

      <div className={s['ll-row-credit']}>
        <div className={s['ll-credit-lead']}>{credit.lead}</div>
        {credit.sub && <div className={s['ll-credit-sub']}>{credit.sub}</div>}
      </div>

      <div className={s['ll-row-standing']}>
        <ul className={s['ll-standing']}>
          {standing.map((it, i) => (
            <li key={i} className={s[`ll-standing-${it.kind}`]}>{it.text}</li>
          ))}
        </ul>
        <div className={s['ll-standing-meta']}>
          <span>{row.sceneCount} scene{row.sceneCount === 1 ? '' : 's'}</span>
          <span className={s['ll-dot']}>·</span>
          <span>{row.scenesWithIntents} intent{row.scenesWithIntents === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div className={s['ll-row-last']}>
        <div className={s['ll-last-rel']}>{last.rel}</div>
        <div className={s['ll-last-abs']}>{last.abs}</div>
      </div>

      <div className={s['ll-row-enter']}>
        <span className={s['ll-enter-arrow']}>→</span>
        <span className={s['ll-enter-label']}>Enter</span>
      </div>

      {margin && (
        <aside className={s['ll-row-margin']}>
          <span className={s['ll-margin-bracket']}>[</span>
          <span><em>{margin.lead}.</em> {margin.detail}</span>
          <span className={s['ll-margin-bracket']}>]</span>
        </aside>
      )}
      </Link>
    </li>
  )
}

function marginCopy(
  kind: 'approval' | 'ack',
  row: ProjectListRow,
  creditKey: ReturnType<typeof roleCredit>['key']
): { lead: string; detail: string } {
  if (kind === 'approval') {
    const n = row.cuesAwaitingApproval
    const noun = n === 1 ? 'mock cue' : 'mock cues'
    const fromWho = creditKey === 'owner' || creditKey === 'director'
      ? row.counterpartName ? ` from ${row.counterpartName}` : ''
      : ''
    return {
      lead: 'Awaiting your approval',
      detail: `${n} ${noun}${fromWho} ready for your eye.`,
    }
  }
  const n = row.cuesAwaitingAck
  const noun = n === 1 ? 'brief' : 'briefs'
  return {
    lead: 'Awaiting your acknowledgement',
    detail: `${n} ${noun} delivered to you. Please acknowledge.`,
  }
}
