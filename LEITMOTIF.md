# Leitmotif

**A vocabulary bridge between directors and composers for film music.**

---

## The problem

Film music direction is broken at the handoff.

A director watches a rough cut and feels something — dread creeping in during a hospital corridor walk, the hollow weight after a character learns they've been betrayed, the quiet swagger of someone who owns every room they enter. They know exactly what they want. But when they sit across from their composer, what comes out is:

> "It should feel like... loss? But not sad. More like... the absence of something. And maybe a little bit hopeful? But not in a cheesy way."

The composer nods, goes away for two weeks, and comes back with something that doesn't land. Not because they're not talented — because the vocabulary gap between emotional intent and musical execution is enormous. Directors think in images, performances, and feelings. Composers think in keys, tempos, harmonic progressions, and instrumentation. There is no shared language between them.

This is not a small problem. It is the central friction point in the film music pipeline, and it has been unsolved for as long as the two roles have existed. The result is wasted time, wasted budget, strained creative relationships, and music that frequently misses on the first several passes.

### Why existing tools don't solve it

**Temp tracks** (placing existing commercial music against a scene) are the industry's current workaround. They create a different problem: the director falls in love with the temp, the composer is asked to produce something "like that but legally different," and the result is derivative work that satisfies no one. Temp tracks also carry licensing risk and anchor the creative conversation to someone else's artistic choices rather than the director's own intent.

**Spotting notes** — written documents from music supervisors after spotting sessions — capture timing and rough mood but rarely achieve the precision needed for a composer to execute correctly on the first pass. They are prose documents, not structured specifications. "Tense but not too tense, building but not too fast" is common spotting note language. It communicates almost nothing actionable.

**Reference playlists** share the same anchoring problem as temp tracks and add the burden of the composer trying to reverse-engineer what the director actually liked about each reference — the harmony? The tempo? The instrumentation? The production quality? The emotional quality? Usually the director can't articulate which dimension they're pointing at.

### The core insight

The gap is not about talent or taste on either side. It is a **vocabulary problem**. Directors have rich, precise emotional intent. Composers have rich, precise musical execution capability. What's missing is a structured translation layer — a controlled vocabulary that maps the emotional and narrative dimensions a director thinks in to the musical parameters a composer works with, without requiring either party to learn the other's language.

---

## The solution

Leitmotif is that translation layer. It provides:

1. **A controlled vocabulary** for directorial intent — 14 emotional atmospheres, 10 narrative functions, 6 density levels, diegetic classifications, score/sound-design balance options, and negative-space questions ("what would be wrong") — each designed by studying how directors actually talk about music in spotting sessions.

2. **Automatic translation to musical specification** — each vocabulary tag carries precise musical metadata (BPM ranges, harmonic character, register, dynamics, rhythm profiles, "do not use" exclusions) that the system assembles into a structured musical spec a composer can execute against.

3. **AI-generated mock cues** — the same structured intent is compiled into optimized prompts for Stable Audio 2.5, producing a reference audio cue that makes the direction *audible* rather than just readable. The director can hear whether what they described is what they meant — and iterate before a composer spends a single hour.

4. **A shareable composer brief** — when the director approves a mock cue, it unlocks a public URL bundling the structured musical spec, the reference audio (clearly labeled as AI-generated reference, not a creative template), and all the directorial metadata. The composer receives something they can actually work from.

The system doesn't replace composers. It doesn't generate final music. It replaces the broken telephone game between "it should feel like loss" and a composer's first draft.

---

## The vocabulary bridge: how it works

### Emotional atmospheres

The core of the system. 14 atmosphere tags, each carrying:

| Atmosphere | What the director is feeling | Musical translation |
|---|---|---|
| **Dread / Ominous Inevitability** | Something terrible is going to happen. The audience knows it. The character doesn't. | Chromatic descent, sub-60 BPM, minor seconds, tritones, no steady pulse, pianissimo with sudden spikes |
| **Grief / Sorrow / Loss** | Something irreplaceable is gone. The character is trying to hold it together. | Minor key, unresolved suspensions, descending melodic lines, 50–70 BPM rubato, no driving percussion |
| **Joy / Elation** | Something good has happened. The character allows themselves to feel it. | Major key, upward melodic motion, 110–140 BPM strong pulse, bright consonant intervals, forte to fortissimo |
| **Confidence / Swagger** | The character owns the room — cool, sleek, rhythmic. Prestige cable drama, not celebration. | Mixolydian/bluesy color, 92–118 BPM locked pocket, syncopated attitude, controlled confidence |
| **Triumph / Earned Victory** | They've gone through something hard and come out the other side. They earned this. | Broad major key with gravitas, 70–100 BPM, strong brass, building to climactic peak |
| **Tension / Anxiety** | Something could go wrong at any moment. The character — and audience — is waiting. | Unresolved chromatic harmony, 80–120 BPM irregular, off-beat emphasis, syncopation, suspended chords |
| **Calm / Peace / Resolution** | The tension has passed. The character can breathe. | Tonal consonant, 60–80 BPM or unmeasured, gentle resolution, pulse feels like breathing |
| **Wonder / Awe / Vastness** | The character encounters something larger than themselves. They feel small. | Major 7ths, suspended chords, 50–75 BPM unmeasured, wide dynamic range, full register simultaneously |
| **Intimacy / Tenderness** | A quiet moment between two people, or a character alone with something true. | Solo/duo, simple folk-like harmony, 60–80 BPM free, very soft close-mic, no percussion |
| **Menace / Predatory Danger** | Dangerous in a calculated, cold way. Not explosive — present. | Low cluster chords, tritones, asymmetric density, sudden silences then full bursts |
| **Irony / Image-Music Dissonance** | What we see and feel are in deliberate conflict. Music comments on the image. | Deliberately wrong tempo/register/dynamics for the visual, cognitive friction |
| **Nostalgia / Longing** | Something from the past is being felt in the present. The character wants what was. | Major with minor inflections, 60–80 BPM, simple memorable melodic fragment, analog warmth |
| **Urgency / Propulsion** | Something must happen now. The character is moving against time. | 120–170+ BPM, relentless eighth-note pulse, simple repetitive harmony, forte and building |
| **Doubt / Ambiguity** | We don't know what to feel. The character doesn't know what's true. | Bitonal/polytonal, 70–100 BPM irregular, no clear tonal center, moderate dynamics |

Each atmosphere also carries a **"do not use" list** — specific musical elements that would undermine the intent. For example, selecting "Grief / Sorrow" automatically excludes driving percussion, fast tempo, major key, and upbeat energy from the generated output. This is as important as what's included: it prevents the AI model from drifting toward generic choices.

Directors select up to three atmospheres. When multiple are selected, their BPM ranges are averaged, their harmonic descriptions are combined, and — critically — the system warns about conflicting combinations. Selecting "Tension / Anxiety" alongside "Joy / Elation" triggers a visible warning because Tension's exclusions (steady pulse, major key) directly conflict with Joy's requirements.

### Narrative functions

What the music is *doing* in the scene, separate from what it sounds like:

- **Anchor Emotion** — confirm what the character is feeling
- **Reveal Subtext** — show what the character is NOT saying
- **Drive Pace** — keep the audience moving forward; music is fuel, not content
- **Misdirect** — make the audience expect one outcome that will be undercut
- **Relieve Tension** — decompress after a high-tension moment
- **Mark the Cost** — make sure the audience feels the weight of what just happened
- **Create Intimacy** — pull the audience close to the character's inner experience
- **Signal Transition** — bridge two scenes or time periods
- **Withhold (No Music)** — hold music back to increase its impact when it arrives
- **Comment / Observe** — music as narrator, watching rather than feeling

Each function carries both a human-facing description (for the director to understand the choice) and a model-optimized phrase (for AI generation). "Mark the Cost" becomes "heavy, weighted, solemn, deliberate slowness" in the model prompt, plus "perfect for the aftermath of a devastating event" in the use-case context.

### Additional dimensions

Beyond atmospheres and functions, the intent editor captures:

- **Music density** — six levels from silence to saturated, each translated into texture descriptions for the AI model
- **Score / sound design balance** — whether music leads, sound design leads, they're negotiated, or music is absent
- **Diegetic status** — non-diegetic (score), diegetic (source music), meta-diegetic (in the character's head), or deliberately ambiguous. Each modifies the production quality in the prompt (e.g., diegetic adds "room ambience, slightly muffled, as if playing from a radio")
- **Director's words** — freeform text that goes directly into the positive prompt, preserving the director's own language alongside the structured vocabulary
- **"What would be wrong"** — the negative-space question. What should this music absolutely NOT sound like? This feeds directly into the negative prompt
- **How often the music appears** — guidance for the composer about entries and exits within the scene
- **Target BPM** — auto-suggested from the atmosphere selection, overridable
- **Key signature** — optional, for directors with musical knowledge
- **Featured instruments** — specific instrumentation requests
- **Recording quality** — pristine studio, intimate room, lo-fi/vintage, or raw/textured
- **Format** — solo, duet, band, orchestra, or chorus
- **Working title** — a human reference title for the cue

### The prompt compiler

All of this structured intent is compiled into two things simultaneously:

1. **An AI generation prompt** — optimized for Stable Audio 2.5's prompt structure (`Format → Genre → Instruments → Mood → Style → BPM → Use-case → Title`), with a corresponding negative prompt built from "do not use" lists, the "what would be wrong" answer, project-level exclusions, and baseline film-score exclusions (no vocals, lyrics, pop production, advertising jingle)

2. **A human-readable musical specification** — a structured table of tempo, harmonic character, register, dynamics, rhythm, and exclusions that a composer can read and execute against without ever hearing the AI-generated reference

The dual output is the key design decision. The AI mock cue makes the direction audible. The musical spec makes it precise. Together they close the vocabulary gap from both sides.

---

## The workflow

### For the director

1. **Create a project** — title, format (feature, episodic, short, commercial), tone brief, and project-level generation settings (instrumentation palette, era/style reference, budget reality, project-wide exclusions)

2. **Add scene cards** — one per cue, with an optional cue number, timecodes (SMPTE), and scene clip upload

3. **Tag intent** — use the vocabulary bridge to describe what the music should do. The UI is organized into progressive disclosure: emotional core (always visible), narrative function, density, then collapsible sections for scene context and audio generation parameters

4. **Save intent** — the system compiles the prompt and musical spec, versioning each save so the director can iterate without losing previous versions

5. **Generate mock cue** — triggers Stable Audio 2.5 (or a silent WAV in demo mode). The job runs via Inngest with step retries for durability, polling the UI every 2.5 seconds until complete

6. **Review and iterate** — play the mock cue alongside the scene clip. If it doesn't land, adjust the intent tags and regenerate. Previous versions are kept and playable

7. **Approve** — when the mock cue captures the intent, approve it. This unlocks the public composer brief URL and optionally emails composer/music supervisor collaborators

### For the composer

1. **Receive the brief** — via email notification (when Resend is configured), a shared URL, or as a logged-in project member

2. **Review the brief page** — scene metadata, director's emotional intent, narrative function, full musical specification table, the mock cue player (clearly labeled "Reference mock cue — not final music. AI-generated to communicate emotional intent only. Please use it as a directorial guide, not a creative template"), and the exact AI prompts used (for transparency)

3. **Acknowledge** — confirm receipt and optionally leave notes for the director

### For the team

The project supports six per-project roles:

| Role | What they can do |
|---|---|
| **Owner** | Everything — created the project. Can invite/remove members and delete the project |
| **Director** | Full creative control — edit intent, scenes, generate, upload, approve, edit settings |
| **Music Supervisor** | View everything, approve mock cues, comment |
| **Composer** | View everything, acknowledge briefs, comment |
| **Sound Designer** | View everything, acknowledge briefs, comment |
| **Viewer** | View everything, comment |

Roles are purely per-project. The same user can be a director on one project and a composer on another. There is no global role — sign-up is role-agnostic, and anyone can create a new project (becoming its owner).

---

## Architecture

### Tech stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui v4 |
| Database | PostgreSQL via Prisma |
| File storage | Cloudflare R2 (S3 API) with local disk fallback |
| AI generation | Stability AI — Stable Audio 2.5 |
| Background jobs | Inngest (event-driven, durable, with step retries) |
| Auth | Better Auth — email/password + optional Google/GitHub OAuth |
| Email | Resend (optional — project invites and brief-ready notifications) |

### Data model

The core entities and their relationships:

```
Profile (user identity, synced from Better Auth by email)
  └── Project (owner_id → Profile)
        ├── GenerationSettings (project-level instrumentation, era, budget, exclusions)
        ├── ProjectMember (role_on_project, invite flow with magic token)
        └── SceneCard (one per cue)
              ├── IntentVersion (versioned intent tags + compiled prompts + musical spec)
              ├── GenerationJob (queued → processing → completed/failed)
              ├── MockCue (generated audio file, approval state, composer acknowledgement)
              └── Comment (threaded per scene)
```

### Generation pipeline

```
Intent saved
  → buildGenerationPrompt() compiles positive + negative prompts
  → buildMusicalSpec() compiles human-readable spec
  → POST /api/scenes/[id]/generate creates GenerationJob
  → Inngest event dispatched (or after() fallback if Inngest not configured)
  → runGenerationJob():
      → Stable Audio 2.5 API call (or silent WAV mock)
      → Audio buffer saved to R2 (or local disk)
      → MockCue record created with file key
      → GenerationJob status → completed
      → SceneCard status → awaiting_approval
  → UI polls /api/scenes/[id]/status every 2.5s until complete
```

### Permission enforcement

Permissions are enforced at two layers:

**API layer** — every mutating route checks the caller's project role via assertion guards (`assertCanDirectScene`, `assertCanDirectProject`, `assertCanApproveCue`, `assertCanAcknowledgeCue`). These resolve the user's role from the database and return 403 if insufficient.

**UI layer** — server components resolve the viewer's role and pass it as props to client components. Non-directors see read-only intent, hidden generate/upload controls, disabled settings fields. The UI never shows a button the user can't use.

### File handling

Scene videos and generated mock cues are stored in Cloudflare R2 in production. Uploads use presigned PUT URLs (browser uploads directly to R2, avoiding Next.js payload limits). In development, files go to local disk under `.data/uploads/`. All media is served through a same-origin `/api/files/` proxy route to avoid CORS issues with audio playback.

### Brief page

The composer brief at `/brief/[mockCueId]` is a public, auth-free page. It displays:

- Scene metadata (cue number, timecodes, duration)
- Director's full intent (emotional atmospheres, narrative function, density, handoff, diegetic status, director's words, what would be wrong, featured instruments, recording quality, BPM, key)
- Musical specification table (tempo, harmonic character, register, dynamics, rhythm, exclusions)
- Mock cue audio player with a prominent disclaimer that it is AI-generated reference audio
- The exact positive and negative prompts used for the AI generation (full transparency)
- A composer acknowledgement form

The page is print-optimized for PDF export via browser print.

---

## What makes this different

**It's not a DAW.** Leitmotif doesn't generate final music and doesn't try to. It generates reference audio that makes direction audible.

**It's not an AI music tool.** The AI generation is a means to an end — the real value is the structured vocabulary and the compiled musical specification. The AI cue could be replaced by any text-to-audio model; what matters is that the director can hear their intent before committing a composer's time.

**It's a communication tool.** The fundamental output is a composer brief — a structured document that replaces "it should feel like loss" with tempo ranges, harmonic character, register guidance, dynamic profiles, rhythm specifications, and explicit exclusions. The mock cue is attached as a reference, not a template.

**It preserves creative authority on both sides.** The director's emotional intent is captured precisely. The composer's artistic interpretation remains unconstrained — the brief gives them a target, not a ceiling. The "do not use" lists tell the composer what would be wrong without telling them what must be right.

---

## Current state (MVP)

The application is functional end-to-end:

- Full project and scene management with per-project role-based access control
- 14 emotional atmospheres with complete musical translation metadata
- 10 narrative functions with human and model-optimized descriptions
- Complete intent editor with progressive disclosure and real-time prompt preview
- AI mock cue generation via Stable Audio 2.5 with Inngest-backed durable execution
- Versioned intent and mock cue history
- Public composer brief pages with structured spec, audio player, and acknowledgement
- Team collaboration with invites, role badges, and per-role UI adaptation
- Email notifications for invites and brief delivery (via Resend)
- Production deployment on Vercel with R2 storage and Inngest queue

---

## Disclaimers

- **Mock cues are not deliverables.** They are AI-generated reference audio to communicate intent, not to replace composition.
- **Stable Audio 2.5 ToS:** Commercial use of generated audio is permitted. Do not upload copyrighted material without rights.
- Consult your attorney before using AI-generated audio in final deliverables.
