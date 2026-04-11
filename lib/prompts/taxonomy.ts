export interface AtmosphereDescriptor {
  label: string
  description: string
  positivePhrase: string
  doNotUse: string[]
  /** Numeric BPM range for prompt generation: [low, high] or null for unmeasured */
  bpmRange: [number, number] | null
  specTempoRange: string
  specHarmonicCharacter: string
  specRegister: string
  specDynamics: string
  specRhythm: string
}

export interface FunctionDescriptor {
  label: string
  description: string
  /** Human-facing description for the director */
  generationPhrase: string
  /** Model-friendly musical description sent to Stable Audio */
  modelPhrase: string
  /** Use-case phrasing for the prompt */
  useCasePhrase: string
  icon: string
}

export const ATMOSPHERE_DESCRIPTORS: Record<string, AtmosphereDescriptor> = {
  dread_ominous: {
    label: 'Dread / Ominous Inevitability',
    description: 'Something terrible is going to happen. The audience knows it. The character doesn\'t.',
    positivePhrase: 'ominous, inescapable dread, chromatic descent, low register, sparse texture, minor seconds, tritones, dark atmospheric tension',
    doNotUse: ['major key', 'melodic hook', 'driving rhythm', 'bright', 'cheerful', 'upbeat'],
    bpmRange: [40, 60],
    specTempoRange: 'Sub-60 BPM or unmeasured / rubato',
    specHarmonicCharacter: 'Chromatic movement; minor seconds; tritones; unresolved suspensions; no tonal center',
    specRegister: 'Low emphasis — bass instruments prominent; upper register used sparingly as destabilising accent',
    specDynamics: 'Pianissimo with sudden unexpected spikes or silences',
    specRhythm: 'No steady pulse, or very slow pulse with syncopated disruption; tremolo preferred',
  },
  grief_sorrow: {
    label: 'Grief / Sorrow / Loss',
    description: 'Something irreplaceable is gone. The character is trying to hold it together.',
    positivePhrase: 'melancholic, sorrowful, descending melodic lines, slow tempo, sparse chamber texture, unresolved suspensions, intimate, deeply felt grief',
    doNotUse: ['percussion', 'driving rhythm', 'fast tempo', 'major key', 'upbeat', 'energetic'],
    bpmRange: [50, 70],
    specTempoRange: '50–70 BPM; rubato preferred',
    specHarmonicCharacter: 'Minor key with unresolved suspension; descending melodic lines',
    specRegister: 'Mid register — cello, viola, oboe, piano; not too extreme',
    specDynamics: 'Piano throughout; resist crescendo',
    specRhythm: 'Slow and unhurried; no driving percussion',
  },
  joy_elation: {
    label: 'Joy / Elation',
    description: 'Something good has happened. The character allows themselves to feel it.',
    positivePhrase: 'joyful, elated, bright major key, upward melodic motion, strong clear pulse, layered texture, energetic, celebratory',
    doNotUse: ['unresolved harmony', 'minor key', 'sparse', 'rubato', 'dread', 'tension'],
    bpmRange: [110, 140],
    specTempoRange: '110–140 BPM; strong clear pulse',
    specHarmonicCharacter: 'Major key; bright consonant intervals — thirds, sixths',
    specRegister: 'Upward movement; bright upper register prominent',
    specDynamics: 'Forte to fortissimo; unrestrained',
    specRhythm: 'Strong downbeats; clear pulse; syncopation that adds energy',
  },
  confidence_swagger: {
    label: 'Confidence / Swagger (adult drama)',
    description:
      "The character owns the room — cool, sleek, rhythmic. Think prestige cable walk, not celebration and not kids' TV.",
    positivePhrase:
      'confident strut, sleek adult drama swagger, dry wit, tight rhythmic pocket, cool sophistication, jazz-funk undertone, controlled major or bluesy harmony, understated never saccharine, premium cable prestige energy',
    doNotUse: [
      'nursery',
      'children\'s TV',
      'whimsical',
      'saccharine',
      'glockenspiel',
      'circus march',
      'naive cheer',
      'celebratory fanfare',
    ],
    bpmRange: [92, 118],
    specTempoRange: '92–118 BPM; locked pocket suitable for a power walk',
    specHarmonicCharacter:
      'Major or mixolydian/bluesy color; consonant but dry — avoid sugary pop resolution',
    specRegister: 'Rhythm section and mids clear; warmth without brittle sparkle',
    specDynamics: 'Controlled confidence; forte without cartoon swells or shouting',
    specRhythm: 'Syncopated pocket with attitude; steady enough to strut, never frantic',
  },
  triumph: {
    label: 'Triumph / Earned Victory',
    description: 'The character has gone through something hard and come out the other side. They earned this.',
    positivePhrase: 'triumphant, earned victory, broad major key, gravitas, strong brass, full strings, building to climactic peak',
    // Avoid cheapening triumph; do not blanket-ban "playful" or "pop" — those block confident struts and light corporate energy
    doNotUse: ['thin texture', 'sparse arrangement', 'minor key', 'cartoonish', 'flippant'],
    bpmRange: [70, 100],
    specTempoRange: '70–100 BPM; broad and expansive even at faster tempos',
    specHarmonicCharacter: 'Major with weight; avoid anything that sounds like a pop chorus',
    specRegister: 'Full range; brass prominent',
    specDynamics: 'Building to climactic peak; silence before main statement for impact',
    specRhythm: 'Strong downbeats; measured and purposeful',
  },
  tension_anxiety: {
    label: 'Tension / Anxiety',
    description: 'Something could go wrong at any moment. The character — and audience — is waiting.',
    positivePhrase: 'tense, anxious, chromatic, unresolved harmony, building density, irregular meter, suspended, uncertain',
    doNotUse: ['resolved cadence', 'major key', 'steady pulse', 'melodic clarity', 'consonant'],
    bpmRange: [80, 120],
    specTempoRange: '80–120 BPM; or driven by irregular pattern rather than BPM',
    specHarmonicCharacter: 'Unresolved; chromatic; suspended chords',
    specRegister: 'Wide spread; nothing that settles',
    specDynamics: 'Controlled but building; avoid premature peak',
    specRhythm: 'Off-beat emphasis; syncopation; irregular meters (5/4, 7/8)',
  },
  calm_peace: {
    label: 'Calm / Peace / Resolution',
    description: 'The tension has passed. The character can breathe.',
    positivePhrase: 'calm, peaceful, gently resolved harmony, soft, unhurried, atmospheric pad, breathing room between notes',
    doNotUse: ['dissonance', 'driving percussion', 'irregular meter', 'tension', 'urgency'],
    bpmRange: [60, 80],
    specTempoRange: '60–80 BPM or unmeasured',
    specHarmonicCharacter: 'Tonal; consonant; gentle resolution',
    specRegister: 'Mid to high; nothing heavy in the bass',
    specDynamics: 'Soft and consistent; avoid sudden changes',
    specRhythm: 'Gentle, unhurried; pulse feels like breathing',
  },
  wonder_awe: {
    label: 'Wonder / Awe / Vastness',
    description: 'The character encounters something larger than themselves. They feel small.',
    positivePhrase: 'awe-inspiring, vast, major sevenths, suspended chords, expansive, wide dynamic range, immeasurable',
    doNotUse: ['propulsive rhythm', 'predictable cadence', 'upbeat', 'busy', 'comedy'],
    bpmRange: [50, 75],
    specTempoRange: '50–75 BPM or unmeasured; expansive',
    specHarmonicCharacter: 'Major 7ths; suspended chords; non-functional; avoid predictable cadences',
    specRegister: 'Full range; high and low simultaneously for sense of scale',
    specDynamics: 'Wide dynamic range; very quiet beginning builds to full statement',
    specRhythm: 'Free; no metronomic pulse',
  },
  intimacy_tenderness: {
    label: 'Intimacy / Tenderness / Vulnerability',
    description: 'A quiet moment between two people, or a character alone with something true about themselves.',
    positivePhrase: 'intimate, tender, solo or duo instrumentation, simple folk-like harmony, very soft, close, delicate, vulnerable',
    doNotUse: ['orchestral density', 'electronic', 'driving rhythm', 'power', 'grandeur'],
    bpmRange: [60, 80],
    specTempoRange: '60–80 BPM or free; no percussion',
    specHarmonicCharacter: 'Simple; consonant; folk-like; avoid sophisticated harmony',
    specRegister: 'Mid; avoid extremes',
    specDynamics: 'Very soft; close-mic quality; consistent',
    specRhythm: 'Gentle, unmeasured preferred; no percussion',
  },
  menace: {
    label: 'Menace / Threat / Predatory Danger',
    description: 'A character or situation is dangerous in a calculated, cold way. Not explosive — present.',
    positivePhrase: 'menacing, predatory, low cluster chords, brass stabs, calculated, cold, dangerous, asymmetric density, tritones, dissonance',
    doNotUse: ['lyrical melody', 'regular pulse', 'warmth', 'comfort', 'bright'],
    bpmRange: [50, 90],
    specTempoRange: 'Variable; menace can be very slow (deliberate) or sudden',
    specHarmonicCharacter: 'Low cluster chords; tritones; unresolved dissonance',
    specRegister: 'Low dominant; sudden high accents as disruption',
    specDynamics: 'Asymmetric — sudden silences then full-density bursts',
    specRhythm: 'Strong and irregular; or complete absence followed by sudden rhythm',
  },
  irony_dissonance: {
    label: 'Irony / Image-Music Dissonance',
    description: 'What we see and what we feel are in deliberate conflict. Music comments on the image, it doesn\'t confirm it.',
    positivePhrase: 'ironic, detached, deliberate tonal contradiction, cognitive friction, cheerful music over dark imagery',
    doNotUse: ['predictable', 'on-the-nose', 'conventional scoring'],
    bpmRange: null,
    specTempoRange: 'Deliberately wrong for the image',
    specHarmonicCharacter: 'Major with underlying shadow, or minor with inappropriate brightness',
    specRegister: 'Chosen to create friction with the visual',
    specDynamics: 'Inappropriate for scene — too light or too heavy',
    specRhythm: 'Incongruous with visual pacing',
  },
  nostalgia_longing: {
    label: 'Nostalgia / Longing / Memory',
    description: 'Something from the past is being felt in the present. The character wants what was.',
    positivePhrase: 'nostalgic, longing, major with minor inflections, simple memorable melodic fragment, unhurried, bittersweet, analog warmth, time slowing down',
    doNotUse: ['clinical', 'processed', 'bright major', 'energetic', 'modern production'],
    bpmRange: [60, 80],
    specTempoRange: '60–80 BPM; time should feel like it is slowing',
    specHarmonicCharacter: 'Major with minor inflections; avoid resolution (what is longed for can\'t be retrieved)',
    specRegister: 'Mid; warm',
    specDynamics: 'Soft; consistent',
    specRhythm: 'Unhurried; no driving pulse',
  },
  urgency_propulsion: {
    label: 'Urgency / Propulsion / Drive',
    description: 'Something must happen now. The character is moving against time.',
    positivePhrase: 'urgent, propulsive, relentless pulse, driving eighth-note rhythm, forward momentum, repetitive harmony, intense energy',
    doNotUse: ['rubato', 'slow', 'sparse', 'wandering harmony', 'resolution'],
    bpmRange: [120, 170],
    specTempoRange: '120–170+ BPM; non-negotiably fast',
    specHarmonicCharacter: 'Simple and repetitive; harmony is fuel not content',
    specRegister: 'Full; emphasis on mid-high',
    specDynamics: 'Forte and building',
    specRhythm: 'Even eighth or sixteenth note pulse; strong downbeats',
  },
  doubt_ambiguity: {
    label: 'Doubt / Ambiguity / Unresolved Question',
    description: 'We don\'t know what to feel. The character doesn\'t know what\'s true.',
    positivePhrase: 'uncertain, ambiguous, bitonal, polytonal, irregular rhythm, no clear tonal center, unresolved, questioning',
    doNotUse: ['tonal center', 'major resolution', 'minor resolution', 'strong pulse', 'definitive'],
    bpmRange: [70, 100],
    specTempoRange: '70–100 BPM moderate or unmeasured',
    specHarmonicCharacter: 'Bitonal or polytonal; avoid clear major OR minor',
    specRegister: 'Middle; avoid extremes (extremes signal certainty)',
    specDynamics: 'Moderate; no strong dynamic statements',
    specRhythm: 'Irregular; nothing you can tap along to',
  },
}

export const FUNCTION_DESCRIPTORS: Record<string, FunctionDescriptor> = {
  anchor_emotion: {
    label: 'Anchor Emotion',
    description: 'Confirm what the character is feeling. Music tells the audience this is real.',
    generationPhrase: 'Music confirms and anchors the emotional truth of the scene.',
    modelPhrase: 'emotionally direct, sincere, earnest',
    useCasePhrase: 'perfect for an emotionally revealing moment',
    icon: 'Anchor',
  },
  reveal_subtext: {
    label: 'Reveal Subtext',
    description: 'Show what the character is NOT saying. Music contradicts or complicates what we see.',
    generationPhrase: 'Music reveals what is beneath the surface, contradicting or complicating the visible action.',
    modelPhrase: 'uneasy undercurrent beneath calm surface, subtle tension',
    useCasePhrase: 'perfect for a scene with hidden meaning',
    icon: 'Eye',
  },
  drive_pace: {
    label: 'Drive Pace',
    description: 'Keep the audience moving forward. Music is fuel, not content.',
    generationPhrase: 'Music propels the scene forward, acting as kinetic fuel rather than emotional content.',
    modelPhrase: 'propulsive, kinetic, momentum-driven, rhythmically insistent',
    useCasePhrase: 'perfect for a fast-paced montage or chase',
    icon: 'ArrowRight',
  },
  misdirect: {
    label: 'Misdirect',
    description: 'Make the audience expect one outcome. Music will be contradicted by what happens.',
    generationPhrase: 'Music builds an expectation that will be undercut — sets up a wrong prediction.',
    modelPhrase: 'deceptively warm, building false sense of safety',
    useCasePhrase: 'perfect for a scene before a twist',
    icon: 'GitBranch',
  },
  relieve_tension: {
    label: 'Relieve Tension',
    description: 'Decompress after a high-tension moment. Allow the audience to breathe.',
    generationPhrase: 'Music releases built tension, offering resolution and space to breathe.',
    modelPhrase: 'releasing, resolving, exhaling, open and spacious',
    useCasePhrase: 'perfect for a moment of relief after crisis',
    icon: 'Wind',
  },
  mark_the_cost: {
    label: 'Mark the Cost',
    description: 'Make sure the audience feels the weight of what just happened.',
    generationPhrase: 'Music bears witness to the cost of what occurred — slows down to let the weight land.',
    modelPhrase: 'heavy, weighted, solemn, deliberate slowness',
    useCasePhrase: 'perfect for the aftermath of a devastating event',
    icon: 'Scale',
  },
  create_intimacy: {
    label: 'Create Intimacy',
    description: 'Pull the audience close to the character\'s inner experience.',
    generationPhrase: 'Music creates psychological closeness with the character — interior and private.',
    modelPhrase: 'intimate, close-mic, private, hushed, interior',
    useCasePhrase: 'perfect for a quiet personal moment',
    icon: 'Heart',
  },
  signal_transition: {
    label: 'Signal Transition',
    description: 'Bridge two scenes or time periods.',
    generationPhrase: 'Music bridges a shift in time, place, or emotional register.',
    modelPhrase: 'transitional, shifting, evolving texture, bridging',
    useCasePhrase: 'perfect for a scene transition or time passage',
    icon: 'ArrowLeftRight',
  },
  withhold: {
    label: 'Withhold (No Music)',
    description: 'Hold music back to increase its impact when it arrives.',
    generationPhrase: 'Silence is the choice — holding music back for greater impact later.',
    modelPhrase: 'near-silence, barely audible, restrained, withheld',
    useCasePhrase: 'perfect for building anticipation through absence',
    icon: 'VolumeX',
  },
  comment_observe: {
    label: 'Comment / Observe',
    description: 'Music as narrator, watching with the audience rather than feeling with the character.',
    generationPhrase: 'Music observes from a slight distance, commenting rather than feeling alongside the character.',
    modelPhrase: 'detached, observational, wry, slightly distant',
    useCasePhrase: 'perfect for an observational or reflective scene',
    icon: 'MessageSquare',
  },
}

export const DENSITY_PHRASES: Record<string, string> = {
  silence: 'near-silence, barely perceptible',
  sparse: 'minimal instrumentation, generous silence between events',
  textural: 'atmospheric texture without melodic foreground',
  melodic: 'single melodic voice with quiet harmonic support',
  layered: 'multiple voices, full but articulated texture',
  saturated: 'maximum density, fully saturated sonic environment',
}

export const INSTRUMENTATION_PHRASES: Record<string, string> = {
  solo_intimate: 'solo instrument or intimate duo',
  chamber: 'small chamber ensemble',
  orchestral: 'full orchestral forces',
  electronic: 'purely electronic and synthetic sounds',
  hybrid: 'hybrid acoustic-electronic',
  ethnic: 'specific cultural instrumental palette',
  band: 'contemporary band — guitar, bass, drums, keys',
  jazz: 'jazz ensemble — improvised and harmonic',
}

export const BUDGET_PHRASES: Record<string, string> = {
  full_orchestra: 'full orchestral forces',
  small_ensemble: 'small chamber ensemble',
  solo_duo: 'solo or duo instrumentation',
  electronic_only: 'purely electronic and synthetic',
  hybrid: 'hybrid acoustic-electronic',
}

export const RECORDING_QUALITY_PHRASES: Record<string, string> = {
  pristine:   'studio-quality, pristine, stereo',
  intimate:   'intimate room recording, close-mic, warm',
  lofi:       'lo-fi, vintage analog, tape warmth, slightly imperfect',
  raw:        'raw, textured, unpolished, gritty',
}

export const DIEGETIC_PRODUCTION: Record<string, { positive: string; negative: string }> = {
  non_diegetic:   { positive: '',                                                   negative: '' },
  diegetic:       { positive: 'diegetic source music, room ambience, slightly muffled, as if playing from a radio or speaker in the room', negative: 'pristine studio recording' },
  meta_diegetic:  { positive: 'subjective interior sound, dreamlike, reverberant, as if heard inside the character\'s mind', negative: 'crisp, direct recording' },
  ambiguous:      { positive: 'ambiguous source, blurred line between score and diegetic, neither fully in the room nor fully cinematic', negative: '' },
}

export const KEY_SIGNATURES = [
  'C Major', 'C Minor',
  'D Major', 'D Minor',
  'E Major', 'E Minor',
  'F Major', 'F Minor',
  'G Major', 'G Minor',
  'A Major', 'A Minor',
  'Bb Major', 'Bb Minor',
  'Eb Major', 'Eb Minor',
  'Ab Major',
  'F# Minor',
] as const
