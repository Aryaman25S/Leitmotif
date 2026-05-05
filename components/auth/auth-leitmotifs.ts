// "Now showing" leitmotif rotation for the auth ticket stub.
// Ported from leitmotif/project/auth-shared.jsx — these seven entries are the
// design's curated marquee programme and are independent of the 14-atmosphere
// landing taxonomy.

export interface AuthLeitmotif {
  num: string
  name: string
  reg: string
}

export const AUTH_LEITMOTIFS: readonly AuthLeitmotif[] = [
  { num: '01', name: 'Lacrimae rerum',  reg: 'tears in things — the long held breath' },
  { num: '02', name: 'Glasshouse',      reg: 'fragile, transparent, just a wire' },
  { num: '03', name: 'Pulsefield',      reg: 'mechanical, undeniable, a heartbeat below' },
  { num: '04', name: 'Brass cathedral', reg: 'low brass, vast, processional' },
  { num: '05', name: 'Last train home', reg: 'pizzicato, miles between people' },
  { num: '06', name: 'The cipher',      reg: 'four notes, recurring, withholding' },
  { num: '07', name: 'Ember room',      reg: 'piano alone, single lamp, dust in the beam' },
]
