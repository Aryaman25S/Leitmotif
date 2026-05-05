// The 14 atmospheres of Leitmotif.
// Each entry is a vocabulary tag (lead word + register subtitle), a fixed
// "film stock" swatch (intentionally world-independent — each atmosphere is
// its own stock), and the musical specification a composer can execute.
//
// Ported from leitmotif/project/atmospheres.js in the design bundle.

export interface AtmosphereSwatch {
  /** Cell background — dark warm/cool base. */
  bg: string
  /** Foreground ink for name + register. */
  ink: string
  /** Ground tone of the figure layer. */
  ground: string
  /** CSS background-image expression for the figure layer. */
  figure: string
}

export interface AtmosphereSpec {
  tempo: string
  meter: string
  harmony: string
  register: string
  dynamics: string
  texture: string
  timbre: string
  /** Comma-separated list — split on render to strike each item. */
  exclude: string
}

export interface Atmosphere {
  /** Two-digit ordinal, used for keys and folio numbering. */
  n: string
  name: string
  register: string
  swatch: AtmosphereSwatch
  spec: AtmosphereSpec
  refs: string
}

// Bridge from the product's taxonomy keys (e.g. `joy_elation`,
// `dread_ominous`) to the landing atmospheres above. Lets the in-app
// vocabulary picker reuse the same visual swatches as the landing's
// atmosphere grid, keeping one source of truth for the ground/figure/ink.
export const PRODUCT_KEY_TO_ATMOSPHERE_INDEX: Record<string, number> = {
  dread_ominous:        0,  // 01 Dread
  grief_sorrow:         1,  // 02 Grief
  joy_elation:          2,  // 03 Joy
  confidence_swagger:   3,  // 04 Confidence
  triumph:              4,  // 05 Triumph
  tension_anxiety:      5,  // 06 Tension
  calm_peace:           6,  // 07 Calm
  wonder_awe:           7,  // 08 Wonder
  intimacy_tenderness:  8,  // 09 Intimacy
  menace:               9,  // 10 Menace
  irony_dissonance:    10,  // 11 Irony
  nostalgia_longing:   11,  // 12 Nostalgia
  urgency_propulsion:  12,  // 13 Urgency
  doubt_ambiguity:     13,  // 14 Doubt
}

export function atmosphereByProductKey(key: string): Atmosphere | undefined {
  const idx = PRODUCT_KEY_TO_ATMOSPHERE_INDEX[key]
  return idx === undefined ? undefined : ATMOSPHERES[idx]
}

export const ATMOSPHERES: readonly Atmosphere[] = [
  {
    n: '01',
    name: 'Dread',
    register: 'ominous inevitability',
    swatch: {
      bg: '#0a0706',
      ink: '#a86a4a',
      ground: '#1a0f0a',
      figure: 'radial-gradient(ellipse at 30% 80%, #3a1a10 0%, transparent 55%)',
    },
    spec: {
      tempo: 'ƒ. 44 bpm, immovable',
      meter: '4/4, downbeat heavy',
      harmony: 'minor with tritone, no release',
      register: 'contrabass, low brass, taiko felt mallet',
      dynamics: 'mf, contained — never f',
      texture: 'ground bass, repeating, gathering mass',
      timbre: 'wood, skin, low metal',
      exclude: 'high register, melodic flourish, cymbal',
    },
    refs: 'Guðnadóttir — Joker (subway); Jóhannsson — Sicario',
  },
  {
    n: '02',
    name: 'Grief',
    register: 'sorrow, loss',
    swatch: {
      bg: '#0d0c09',
      ink: '#a89478',
      ground: '#1a1612',
      figure:
        'linear-gradient(180deg, transparent 0%, transparent 60%, #2a241c 60.5%, #2a241c 100%)',
    },
    spec: {
      tempo: 'ƒ. 42–48 bpm, tempo rubato',
      meter: 'free / unmetered',
      harmony: 'open fifths, suspended fourths, no resolution',
      register: 'low strings, sub-bass, occasional high harmonic',
      dynamics: 'ppp — mp; never crescendo',
      texture: 'monodic, single sustained voice, generous silence',
      timbre: 'bowed metal, exhaled brass, felt piano',
      exclude: 'percussion of any kind, melodic motif, vibrato',
    },
    refs: 'Jóhannsson — Arrival; Cave/Ellis — The Assassination of Jesse James',
  },
  {
    n: '03',
    name: 'Joy',
    register: 'elation',
    swatch: {
      bg: '#0d0b08',
      ink: '#d8b890',
      ground: '#1c1610',
      figure: 'linear-gradient(135deg, #2c1f14 0%, transparent 50%, #1c1610 100%)',
    },
    spec: {
      tempo: 'ƒ. 132 bpm, exuberant',
      meter: 'common, with strong upbeats',
      harmony: 'diatonic major, raised IV permitted, plagal release',
      register: 'full ensemble, voices welcome',
      dynamics: 'mf — f, breathing',
      texture: 'melodic, foreground theme',
      timbre: 'wood, brass, bright strings, daylight',
      exclude: 'minor key, suspension without resolution, drone',
    },
    refs: 'Mancini — bright sequences; Vince Guaraldi (faster)',
  },
  {
    n: '04',
    name: 'Confidence',
    register: 'swagger',
    swatch: {
      bg: '#0a0907',
      ink: '#b89c70',
      ground: '#181410',
      figure:
        'repeating-linear-gradient(90deg, transparent 0px, transparent 18px, #1f1a14 18px, #1f1a14 19px)',
    },
    spec: {
      tempo: 'ƒ. 96 bpm, exact',
      meter: 'common, syncopated',
      harmony: 'major, dominant 7ths welcome, blue 3rd permitted',
      register: 'low brass, electric bass, brushed kit',
      dynamics: 'mf, sustained, no apologies',
      texture: 'riff-led, foreground groove',
      timbre: 'metal, breath, room',
      exclude: 'rubato, suspension, woodwind solo',
    },
    refs: 'Reznor/Ross — confident motion cues',
  },
  {
    n: '05',
    name: 'Triumph',
    register: 'earned victory',
    swatch: {
      bg: '#0a0907',
      ink: '#b89a76',
      ground: '#161210',
      figure:
        'linear-gradient(90deg, #0a0907 0%, #0a0907 48%, #2a2218 48%, #2a2218 52%, #0a0907 52%, #0a0907 100%)',
    },
    spec: {
      tempo: 'ƒ. 60 bpm, processional accelerating to 84',
      meter: 'common, march at first then released',
      harmony: 'minor with raised seventh, resolving major at apex',
      register: 'low brass choir, tolling bell, strings entering late',
      dynamics: 'mp swelling to ff at the cadence only',
      texture: 'homophonic four-part opening to tutti',
      timbre: 'metal, breath, distance closing',
      exclude: 'early climax, ornament, melisma',
    },
    refs: 'Morricone — The Mission (procession cues)',
  },
  {
    n: '06',
    name: 'Tension',
    register: 'anxiety',
    swatch: {
      bg: '#0a0907',
      ink: '#c0a888',
      ground: '#15110c',
      figure: 'radial-gradient(ellipse at 50% 50%, #2a2218 0%, transparent 65%)',
    },
    spec: {
      tempo: 'static, pulse implied not played',
      meter: '4/4 implied, downbeats omitted',
      harmony: 'single pedal tone, microtonal swell',
      register: 'mid strings, whispered woodwind',
      dynamics: 'ppp, threshold of audibility',
      texture: 'drone, slow oscillation',
      timbre: 'ondes martenot, ebowed guitar, breath',
      exclude: 'downbeat, melody, harmonic resolution',
    },
    refs: 'Reznor/Ross — The Social Network (opening)',
  },
  {
    n: '07',
    name: 'Calm',
    register: 'peace, resolution',
    swatch: {
      bg: '#0c0a08',
      ink: '#d4b88c',
      ground: '#1a1410',
      figure: 'radial-gradient(circle at 50% 70%, #3a2c1c 0%, transparent 50%)',
    },
    spec: {
      tempo: 'ƒ. 64 bpm, hymnal',
      meter: 'common time, plainsong cadence',
      harmony: 'modal — dorian, no leading tone',
      register: 'solo voice or chamber strings',
      dynamics: 'mp, even, processional',
      texture: 'monophonic or two-part counterpoint',
      timbre: 'human voice, wood, gut string',
      exclude: 'synthesizer, reverb tail beyond 1.2s',
    },
    refs: 'Pärt; Mica Levi — Jackie (interior cues)',
  },
  {
    n: '08',
    name: 'Wonder',
    register: 'awe, vastness',
    swatch: {
      bg: '#0a0a0c',
      ink: '#a8b4c0',
      ground: '#12141a',
      figure:
        'linear-gradient(180deg, transparent 0%, transparent 70%, #1a1e26 70%, #1a1e26 100%)',
    },
    spec: {
      tempo: 'ƒ. 54 bpm, tempo giusto',
      meter: '4/4, crystalline',
      harmony: 'major with flattened ninth, lydian inflection',
      register: 'celesta, harp harmonics, vibraphone bowed, high strings',
      dynamics: 'p, even, with single quiet swell',
      texture: 'punctuated, generous space, slow bloom',
      timbre: 'metal at rest, ice, far-room reverb',
      exclude: 'warm timbres, rubato, vibrato',
    },
    refs: 'Sakamoto — late period; Jóhannsson — Arrival',
  },
  {
    n: '09',
    name: 'Intimacy',
    register: 'tenderness, vulnerability',
    swatch: {
      bg: '#0c0907',
      ink: '#c89878',
      ground: '#1a120c',
      figure: 'linear-gradient(180deg, #2a1814 0%, transparent 40%, #1a120c 100%)',
    },
    spec: {
      tempo: 'ƒ. 68 bpm, walking',
      meter: '6/8, lilting but not lilting',
      harmony: 'minor with major sixth, ambiguous',
      register: 'cello, alto voice, nylon string',
      dynamics: 'mp, with restraint',
      texture: 'duet, two voices not always agreeing',
      timbre: 'human, wood, breath',
      exclude: 'lush strings, romantic gesture, pop dynamics',
    },
    refs: 'Reznor/Ross — Mank; Cave/Ellis',
  },
  {
    n: '10',
    name: 'Menace',
    register: 'threat, predatory danger',
    swatch: {
      bg: '#08080a',
      ink: '#8c98a8',
      ground: '#101216',
      figure:
        'repeating-linear-gradient(45deg, #101216 0px, #101216 4px, #15181e 4px, #15181e 5px)',
    },
    spec: {
      tempo: 'ƒ. 50 bpm, mechanical',
      meter: '7/8, asymmetric',
      harmony: 'atonal cluster, narrow band',
      register: 'high strings sul ponticello, prepared piano',
      dynamics: "p, perfectly even — never tells you it's coming",
      texture: 'pointillistic, isolated events',
      timbre: 'metal, glass, breath through reed',
      exclude: 'warmth, vibrato, tonal center',
    },
    refs: 'Levi — Under the Skin (laboratory sequences)',
  },
  {
    n: '11',
    name: 'Irony',
    register: 'image-music dissonance',
    swatch: {
      bg: '#0a0a0a',
      ink: '#a09a92',
      ground: '#161616',
      figure: 'radial-gradient(circle at 50% 50%, #1e1e1e 0%, #0a0a0a 70%)',
    },
    spec: {
      tempo: 'ƒ. 76 bpm, comfortable — deliberately wrong for the picture',
      meter: '4/4, gentle',
      harmony: 'diatonic major, plagal cadence, sweet',
      register: 'acoustic guitar, upright piano, brushed kit, music box',
      dynamics: 'mp, intimate, untouched by the image',
      texture: 'song-shaped, verse implied',
      timbre: 'wood, room, daylight, 78rpm warmth',
      exclude: 'any acknowledgment of the picture, sting, hit-point',
    },
    refs: "Kubrick's needle drops; Will Oldham; Vince Guaraldi (slow)",
  },
  {
    n: '12',
    name: 'Nostalgia',
    register: 'longing, memory',
    swatch: {
      bg: '#0d0a07',
      ink: '#c8a07a',
      ground: '#1c150f',
      figure: 'linear-gradient(180deg, #2a1d12 0%, transparent 100%)',
    },
    spec: {
      tempo: 'ƒ. 72 bpm, andante',
      meter: '3/4, waltz implied not danced',
      harmony: 'major seventh, lydian inflection',
      register: 'upper strings, music box, harp',
      dynamics: 'mp, distant',
      texture: 'thin, transparent',
      timbre: '78rpm warmth, room tone, vinyl crackle permitted',
      exclude: 'low end below 80Hz, present-tense brass',
    },
    refs: 'Mancini — Days of Wine and Roses (reverie)',
  },
  {
    n: '13',
    name: 'Urgency',
    register: 'propulsion, drive',
    swatch: {
      bg: '#0c0a08',
      ink: '#9a8568',
      ground: '#181410',
      figure:
        'repeating-linear-gradient(180deg, transparent 0px, transparent 7px, #1f1a14 7px, #1f1a14 8px)',
    },
    spec: {
      tempo: 'ƒ. 138 bpm, tempo giusto, never slowing',
      meter: '5/8 over 4/4, asymmetric pulse',
      harmony: 'minor, ostinato-locked, no key change',
      register: 'low strings ostinato, taiko, synth bass',
      dynamics: 'mf, even — no swell, no rest',
      texture: 'ostinato foreground, motion always',
      timbre: 'wood, skin, electric pulse',
      exclude: 'rubato, melodic phrasing, breath, silence',
    },
    refs: 'Jóhannsson — Sicario (motion cues); Reznor/Ross',
  },
  {
    n: '14',
    name: 'Doubt',
    register: 'ambiguity, unresolved question',
    swatch: {
      bg: '#08070a',
      ink: '#9890a0',
      ground: '#12111a',
      figure: 'radial-gradient(ellipse at 50% 100%, #1c1828 0%, transparent 70%)',
    },
    spec: {
      tempo: 'ƒ. 58 bpm, drifting',
      meter: 'ametric',
      harmony: 'polychord, slowly cycling — no tonic ever asserted',
      register: 'full orchestral, blended, no soloist',
      dynamics: 'p — mp, breathing',
      texture: 'wash, no foreground',
      timbre: 'indistinct, blended ensemble',
      exclude: 'solo voice, melodic identification, cadence',
    },
    refs: 'Jóhannsson — Sicario; Cave/Ellis',
  },
]
