# Leitmotif — Development Journey

This document traces the full arc of building Leitmotif, from the initial research repository to a deployed MVP. It covers what was built at each stage, what decisions were made and why, what alternatives were considered, what broke along the way, and how the architecture evolved.

---

## 0. Before code: the research phase

Leitmotif started as a **research-only repository** called `film-audio-intent-tool`. No product code — just structured pre-build validation work organized into numbered folders:

```
film-audio-intent-tool/
├── 01-interviews/       Interview guides for composers, supervisors, directors
├── 02-taxonomy/         The vocabulary bridge: emotional descriptors → musical parameters
├── 03-prototype/        Paper prototype for running a real spotting session
├── 04-legal/            Sync licensing, reference content, AI generation risk
├── 05-distribution/     Pilot partner research and outreach strategy
├── 06-design/           MVP UI/UX spec
├── 07-apis/             Licensed library API evaluation (Musicbed, Artlist, Epidemic Sound)
├── 08-data-model/       Technical data model for version-resilient intent notes
└── 09-mvp-build-plan/   The build plan that became this product
```

The README for that repository explicitly stated: *"Do not write product code until the taxonomy (02) is validated with working composers and the paper prototype (03) has survived one real production."*

The core thesis established in this phase: this is **not** a review tool, a DAW replacement, or an AI music generator. It is a **structured communication artifact system** — purpose-built for the gap between emotional directorial intent and executable musical/sonic brief.

The most important output was the **intent-to-parameters mapping** (`02-taxonomy/`), which mapped 14 emotional atmospheres and 10 narrative functions to precise musical parameters (BPM ranges, harmonic character, dynamics, register, rhythm, exclusions). This mapping became the `lib/prompts/taxonomy.ts` file — arguably the core IP of the entire system.

---

## 1. The MVP build plan

Before any code was written, a detailed build plan was produced (`09-mvp-build-plan/mvp-plan.md`) with a clear hypothesis:

> *A director can select emotional intent tags, the tool generates a listenable mock cue from those tags, and a composer finds that mock cue more useful as a brief than a temp track or verbal description.*

The plan included eight educated assumptions (A1–A8) that let development proceed without waiting for interview data. Three of these shaped the architecture significantly:

- **A1: AI auto-suggesting tags from video is not MVP.** This cut 4–6 weeks and kept the scope on the core intent→generation loop.
- **A2: Stable Audio API, not self-hosted.** Self-hosting MusicGen/similar would require GPU infrastructure. Decision: use the REST API until monthly costs exceed ~$2k/month.
- **A3: Composers and supervisors create projects; directors get invited.** This assumption was later revised — in the shipped MVP, anyone can create a project and become its owner; roles are assigned at invite time rather than at signup.

### Tech stack decisions in the plan

The original plan specified:

| Layer | Planned | What actually shipped | Why it changed |
|---|---|---|---|
| Framework | Next.js 14 | Next.js 16 | Version advanced during development |
| Database | Supabase (Postgres + Auth + Storage) | Prisma + Supabase Postgres (DB only) | Supabase was removed as a platform; Postgres hosting kept |
| Auth | Supabase Auth (magic links) | Better Auth (email/password + OAuth) | Supabase removed; Better Auth chosen for flexibility |
| File storage | Supabase Storage | Cloudflare R2 (S3 API) | Needed S3-compatible storage independent of Supabase |
| Background jobs | Inngest | Inngest | Stayed as planned |
| Email | Resend | Resend | Stayed as planned |
| Deployment | Vercel | Vercel | Stayed as planned |
| AI generation | Stable Audio API | Stable Audio 2.5 API | Stayed as planned; model version advanced |
| Video player | React Player | Native HTML5 `<video>` | Simpler; no dependency needed |
| Audio waveform | WaveSurfer.js | Custom player components | Waveform visualization deferred; focused on playback |

---

## 2. The UI-first build (Cuepoint era)

The product was initially called **Cuepoint**. Development began UI-first — the entire frontend was built with mock data before any backend existed.

### The approach

A dedicated UI/UX agent was given explicit scope boundaries:

- **Owns:** everything visual/interactive under `components/`, styles, and `app/` (UI only)
- **Does not touch:** API routes, server actions, backend, DB, auth, env, or non-UI files
- **Backend needs:** flagged as notes only

This separation was deliberate: design the product experience first, then wire up the backend. Two workspaces were maintained:

- `film-audio-intent-tool/` — research and spec (read-only reference)
- `cuepoint/` — the real app (where UI changes went)

### The original UI plan

The `cuepoint_ui_build` plan established the visual identity:

- **Dark-first, cinematic palette.** Near-black backgrounds (`#0A0A0B`), neutral grays, restrained indigo accent (`#6366F1`). No light mode — film production tools are dark.
- **Content-forward layout.** Video and waveform are the hero. Chrome recedes. Panels use subtle 1px borders and transparency.
- **Vocabulary Bridge chips as the signature interaction.** Framer Motion for selection animations, grouped by emotional energy tier, max 3 selections.
- **Professional density.** More information per screen than typical SaaS. Film professionals expect dense, scannable interfaces.
- **Monospaced timecodes.** `font-variant-numeric: tabular-nums` everywhere.

Components built in this phase:
- `SceneIntentEditor` — the vocabulary bridge (atmosphere chips, narrative function selector, density, handoff settings, all additional dimensions)
- `GenerationWorkspace` — generate button, mock cue version list, approval flow
- `SceneMetaEditor` — scene card metadata editing
- `SceneVideoUpload` — video upload with drag-and-drop
- `MockCuePlayer` / `MockCuePlayerStatic` — audio playback components
- `ComposerAcknowledge` — brief acknowledgement UI
- `CommentThread` — per-scene comments
- `AddSceneDialog` — new scene creation
- `AppNav` — application navigation with project breadcrumbs
- `LandingPage` — marketing landing page

### UI iteration: from safe to cinematic

The initial UI pass was functional but "visually safe." A second pass was explicitly commissioned with references to Basement Studio, Linear, Vercel dashboard, and Arc browser. The direction:

- **Signature visual motif:** "light on dark" — a radial "projector spill" glow behind the scene title (`.scene-glow`)
- **Depth system:** `.panel-elevated`, `.panel-inset` utility classes for layered surfaces
- **SceneTabs:** Framer Motion `layoutId` sliding tab indicator instead of default pills
- **GenerationWorkspace:** entrance animation, stronger generate CTA with glow while processing

### Landing page: three iterations

The landing page at `/` went through three complete rebuilds:

1. **First version:** Gradient hero, scanlines, tension lines, how-it-works section. Functionally correct but felt flat.
2. **Second version:** Added CSS keyframe animations, but still didn't have enough energy.
3. **Final version:** References to Runway, ElevenLabs, Linear, Basement Studio. Three animated orbs, 56-bar waveform visualization, grain overlay, floating nav, coded product mock (showing actual chips, player, spec). This version shipped.

**Technical issues solved during landing page work:**
- **Base UI warning:** `Button` with `render={<Link>}` triggered a `nativeButton` conflict in Base UI's React integration. Fix: use `Link` + `buttonVariants` + `cn` instead of wrapping Link inside Button.
- **Hydration mismatch:** Waveform bar heights used `Math.random()` which produced different values on server and client. Fix: precompute bar heights as a module-scope constant (`BARS`) with rounding to avoid float precision differences.
- **Accessibility:** Decorative elements (grain overlay, orbs) needed explicit `aria-hidden="true"` to prevent SSR/client mismatch on dynamically generated attributes.

---

## 3. Removing Supabase: the local-first pivot

A pivotal architectural decision was made early in backend development: **remove Supabase completely**. The explicit requirement:

> *"The app must run locally with zero external backend dependencies. No Supabase, no external DB, no external storage required for now. Replace auth with a no-auth or mock-auth system. Replace storage with local file handling. Point out where I can later plug in a real backend (Postgres/Prisma)."*

This reshaped the architecture:

- **Auth:** replaced with a mock-auth system (`lib/mock-auth.ts`) that returned a hardcoded `MOCK_USER` for all requests. Every API route treated every request as authenticated by this single user.
- **Storage:** replaced with local filesystem writes to `.data/uploads/` directory. Files served via `/api/files/` route.
- **Database:** The data model was implemented entirely in `lib/store.ts` — a single module containing all CRUD operations. Crucially, the store module was designed from the start to accept Prisma + Postgres later. Function signatures matched what a real ORM layer would need.
- **Schema:** A `supabase/migrations/0001_initial_schema.sql` was carried over from the plan but removed in the cleanup commit since it was no longer executed against Supabase.

The key decision: treat Prisma + Postgres as the future plug-in point. The `store.ts` module abstracted all data access so the switch would be mechanical — change the implementation, not the callers.

---

## 4. Wiring up Prisma + Postgres

After the frontend and mock backend were stable, the database was formalized:

- **Provider:** Supabase was brought back — but **only as a Postgres host**, not as the full Supabase platform. Direct connection strings to the Supabase-managed PostgreSQL instance, not the Supabase JS client.
- **ORM:** Prisma with the `@prisma/adapter-pg` driver adapter for connection pooling.
- **Schema:** `prisma/schema.prisma` defined all models (Profile, Project, GenerationSettings, ProjectMember, SceneCard, IntentVersion, GenerationJob, MockCue, Comment) plus the Better Auth tables that were added later.
- **Connection strings:** Both direct (`DATABASE_URL` for migrations) and transaction-pooler (`DATABASE_URL_UNPOOLED`) Supabase endpoints were configured. IPv4 vs IPv6 considerations in the Supabase dashboard were navigated during setup.

A common point of confusion during development was the distinction between **database hosting** (still Supabase Postgres) and **everything else** (no longer Supabase). The Supabase JS SDK was fully removed; only the raw PostgreSQL connection was retained.

---

## 5. Stable Audio integration and prompt engineering

### Integration path

The Stable Audio 2.5 API was integrated in `lib/generation/stableAudio.ts`. The function:

1. Takes a positive prompt, negative prompt, and duration
2. POSTs to `https://api.stability.ai/v2beta/audio/stable-audio-2.5/text-to-audio` (model is selected by URL path; `cfg_scale` and `steps` are sent explicitly).
3. Receives a WAV buffer
4. Includes a demo mode that returns a silent WAV when `STABILITY_API_KEY` is not set

A practical constraint shaped development: only 25 free credits on the Stability AI account. Every test generation was precious, so prompt quality was iterated carefully before burning credits.

### The prompt compiler

`lib/prompts/buildGenerationPrompt.ts` is the function that converts structured intent into AI-ready prompts. The prompt format was optimized specifically for Stable Audio 2.5's expected structure:

```
Format → Genre → Instruments → Mood → Style → BPM → Use-case → Title
```

Each atmosphere tag contributes a `positivePhrase` and a `doNotUse` list. The function:

1. Collects atmosphere descriptions, averages BPM ranges for multiple selections, combines harmonic descriptions
2. Adds narrative function phrasing (human-facing description + model-optimized phrase)
3. Applies density, handoff, diegetic status, and format modifiers
4. Incorporates project-level settings (instrumentation families, era reference, budget reality)
5. Builds the negative prompt from atmosphere exclusions + "what would be wrong" + project-level exclusions + baseline exclusions (no vocals, lyrics, pop production, advertising jingle)

### Bugs and iteration

- **Prisma schema drift:** An `Unknown argument` error on `intentVersion.create` — the schema defined `format_tag` but the code was passing a different field name. Required realigning the schema with the code.
- **Stable Audio API failure:** Production calls returned errors that required debugging the exact request format, headers, and error response parsing.

---

## 6. First deployment: Vercel + Cloudflare

### Hosting decision

Vercel was the obvious choice for Next.js deployment (zero-config, serverless, preview environments per PR). The domain `theleitmotif.com` was purchased on Cloudflare.

### The storage problem

The first deployment surfaced a fundamental issue: **Vercel's serverless compute is ephemeral**. The local `.data/uploads/` directory that worked in development would be wiped on every function invocation. Generated audio files and uploaded videos needed durable storage.

This led to the **Cloudflare R2 integration** (commit `0c9ea2d`):

- R2 was chosen because it provides an S3-compatible API with no egress fees
- `@aws-sdk/client-s3` for the SDK (R2 supports the S3 protocol)
- Local disk fallback preserved for development: when R2 env vars aren't set, files go to `.data/uploads/`
- The `saveFile()` and `getFileUrl()` functions were updated to be async (R2 operations are network calls)
- `maxDuration=60` added to the generation route for serverless compatibility (Stable Audio calls take 30–45 seconds)

### CORS and the proxy pattern

The first R2 integration used direct R2 URLs (redirecting to `files.theleitmotif.com`). This broke audio playback: direct R2 URLs are cross-origin from `www.theleitmotif.com`, and browsers reject `HTMLMediaElement.play()` without permissive CORS and Range headers on the bucket.

The fix (commit `df4af44`): serve all media through a **same-origin proxy** at `/api/files/`. Instead of redirecting to R2, the route streams the object from R2 (using `transformToWeb` / `fs.createReadStream` depending on storage backend). This added latency but eliminated all CORS issues.

### Presigned uploads (later improvement)

Initially, file uploads went through Next.js API routes (multipart form data → API route → save to R2). This hit Vercel's 4.5MB body size limit for serverless functions, making large video uploads fail.

The solution (commit `b203210`): **presigned PUT URLs**. The flow changed to:

1. Client calls `POST /api/storage/upload` → receives a presigned R2 PUT URL + file key
2. Client PUTs the file directly to R2 from the browser (no size limit)
3. Client calls `POST /api/storage/upload/commit` to record the file in the database

This required `@aws-sdk/s3-request-presigner` and Cloudflare R2 CORS configuration to allow PUT requests from the app domain.

### DNS configuration

Setting up the Cloudflare → Vercel DNS involved navigating CNAME records and a "DNS change recommended" warning in Vercel. The custom domain was configured with Cloudflare's proxy (orange cloud) disabled for the Vercel-pointed records, since Vercel needs direct DNS resolution for SSL certificate provisioning.

### LAN development

Running `next dev` with LAN access (testing on other devices on the same network) required `allowedDevOrigins` configuration in `next.config.ts` — a Next.js 16 requirement to prevent cross-origin HMR websocket connections from being rejected.

---

## 7. Post-deploy hardening (commit `deed4ec`)

After the first production deployment worked, several reliability issues were addressed:

### Audio playback reliability

- `MockCuePlayer` and `MockCuePlayerStatic`: called `await play()` to handle the browser promise-based audio API. Synced state with `onPlay`/`onPause` events. Added `onError` toast. Guarded against invalid duration for scrub/progress bar calculations.

### Error handling

- `app/error.tsx` and `app/not-found.tsx` for global error and 404 states — previously, any crash showed a raw Next.js error page.

### Video duration extraction

- The video PATCH route extracted duration server-side using `music-metadata` + `readFileBuffer`, returning `durationSec` in the JSON response. This let the client display accurate timecodes without waiting for the video to load.

---

## 8. The name change: Cuepoint → Leitmotif

The product was renamed from "Cuepoint" to "Leitmotif." The reasoning:

> *"Cuepoint worked fine till now but, this is a cuepoint already"* — the term "cue point" is already used in DAWs and DJ software to mark positions in audio. It wasn't distinctive.

The name search considered several alternatives, but shorter names had domain availability issues. The final choice was "Leitmotif" — a musical term meaning a recurring theme associated with a character or idea, which mirrors what the product does (translating a directorial theme into musical direction).

The rename involved changing references across the entire codebase: package.json, README, landing page copy, UI strings, and the project directory itself (from `cuepoint/` to `leitmotif/`).

---

## 9. Authentication: mock → Better Auth → OAuth

### Phase 1: Mock auth

The initial system used `lib/mock-auth.ts` — a single hardcoded `MOCK_USER` for all requests. Every API route called `getMockUser()` which always returned the same profile. This let the entire application work without any login flow, which was critical for rapid UI development and testing.

### Phase 2: Choosing an auth library

When it was time to add real authentication, the options considered were:

- **NextAuth.js / Auth.js** — the ecosystem standard, but complex configuration and the v4→v5 migration added uncertainty
- **Clerk** — hosted auth, easy to set up, but adds an external dependency and cost
- **Lucia** — lightweight, database-backed, but was being deprecated
- **Better Auth** — newer library with a Prisma adapter, email/password + social login, session management built-in

**Better Auth was chosen** based on an explicit decision: *"I wanna use Better Auth right now."* The key factors: Prisma adapter (matching the existing ORM choice), built-in email/password, straightforward session management, and no external service dependency beyond the database.

### Implementation (commit `f7db194`)

Better Auth required adding several tables to the Prisma schema: `user`, `session`, `account`, `verification`. A catch-all API route at `/api/auth/[...all]/route.ts` handles all auth endpoints.

The critical architectural decision was **profile syncing**: Better Auth manages its own `user` table, but the application's data model uses `Profile`. A sync function in `lib/session.ts` (`syncProfileFromBetterAuthUser`) resolves a Better Auth user to an app Profile by email, creating one if it doesn't exist.

**Data migration:** The mock user's data needed to survive the transition to real auth. A script (`scripts/ensure-director-auth.mts`) was created to link the existing mock-user profile (with all its projects, scenes, and generated cues) to a real Better Auth account by matching email addresses.

**API route protection:** `lib/api-auth.ts` was created with `requireApiSession` — every API route now validates the session cookie before proceeding. Project and scene access checks (`assertProjectAccess`, `assertSceneAccess`) ensure users can only access their own data.

**Sign-out bug:** Sign-out didn't work initially — the client-side sign-out call succeeded but the page didn't reflect it because React Server Components cached the old session. Fix: hard navigation (`window.location.href = '/'`) after sign-out to force a full page reload and RSC re-render.

### Phase 3: OAuth (commit `05c3ee2`)

Google and GitHub OAuth were added as optional providers. The implementation:

- `lib/oauth-providers.ts` dynamically builds the `socialProviders` config based on which env vars are set (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`)
- `OAuthButtons` component on sign-in and sign-up pages renders provider buttons conditionally
- Callback URLs follow Better Auth's convention: `{BETTER_AUTH_URL}/api/auth/callback/{provider}`

The decision to make OAuth providers **optional** (env-var gated) was deliberate: the app works with just email/password; OAuth enhances the experience but isn't required for deployment.

### Phase 4: Magic links deprecated

The original MVP plan specified magic links for director access (no account required). After implementing email/password + OAuth, magic links were explicitly dropped:

> *"Now that we have a proper auth as well as oauth I don't think we need magic links."*

The brief page (`/brief/[mockCueId]`) remained public and unauthenticated — the magic-link use case (directors reviewing briefs without accounts) was already solved by public brief URLs.

---

## 10. Email: Resend integration (commit `2857ba2`)

Resend was integrated for two email types:

1. **Project invites** — when an owner invites a collaborator, they receive an email with a link to accept
2. **Brief-ready notifications** — when a mock cue is approved, composer and music supervisor members receive an email linking to the brief

### Design decisions

- **Env-var gated:** Resend is optional. When `RESEND_API_KEY` and `RESEND_FROM` aren't set, invites still work (DB records are created) and approvals still work (brief URLs are generated) — just no email is sent.
- **`RESEND_BRIEF_EMAILS`:** A separate flag to disable brief notifications independently of invite emails. Default: enabled when Resend is configured.
- **Reply-to:** `RESEND_REPLY_TO` sets the reply-to address on all emails, so replies go to a real person rather than a no-reply address.
- **Error handling:** Email send failures never block the primary operation. If the invite email fails, the member record is still created and the API returns `emailWarning` alongside success. The UI shows a toast distinguishing "invited + email sent" from "invited but email failed."

### Domain setup

Resend requires a verified sending domain. `mail.theleitmotif.com` was configured with the necessary DNS records (SPF, DKIM, DMARC) on Cloudflare.

---

## 11. Team management (commit `f31dfde`)

Collaborator management was fleshed out:

- **Remove members:** Owner-only `DELETE /api/projects/[projectId]/members/[memberId]` with `DeleteConfirmButton` in the settings UI
- **View-only for non-owners:** The invite form is only shown to the project owner. Non-owners see the team list but can't invite or remove.
- **`viewerIsOwner`:** The project API response includes this boolean, used by the client to gate management UI

---

## 12. Inngest: background job queue

### Why Inngest

The generation pipeline calls Stable Audio 2.5's API, which takes 30–45 seconds. On Vercel's serverless platform, long-running requests risk timeout. Inngest provides durable execution with step-level retries — if the function crashes mid-execution, it resumes from the last completed step rather than restarting entirely.

### The dual-path architecture

A pragmatic decision: Inngest is **optional**. The generation route checks for `INNGEST_EVENT_KEY`:

- **If set:** dispatches an Inngest event (`leitmotif/generate.requested`), and the Inngest function (`processGeneration`) handles the job with step retries
- **If not set:** falls back to `after()` — Next.js's built-in mechanism to run work after sending a response. This works in development but lacks retries and durability

This means the app is fully functional without Inngest configured — important for local development and for deployments where Inngest setup hasn't been completed.

### Setup challenges

Inngest setup was the most friction-heavy external integration in the project. Issues encountered:

1. **`INNGEST_DEV=1`:** Required in `.env.local` for local development. Without it, the Inngest SDK runs in "cloud mode" and demands a signing key, causing 500 errors on the local dev server. The flag tells the SDK to skip signature verification locally.

2. **Inngest Cloud onboarding:** The Inngest dashboard's onboarding wizard includes a "Searching for your app..." step that auto-detects a local dev server. This detector was unreliable and often got stuck searching indefinitely. The workaround: click "I already have an Inngest app" to skip the detection step.

3. **Vercel Deployment Protection:** Inngest Cloud needs to reach the app's `/api/inngest` endpoint to sync function definitions. Vercel's Deployment Protection blocks unauthenticated requests to preview deployments, causing Inngest to report "We could not reach your URL" for preview URLs like `leitmotif-xxxx.vercel.app`.

4. **The fix — custom production domain:** Instead of using Vercel preview URLs, the Inngest integration was configured to use the custom production domain (`https://www.theleitmotif.com`) for app syncing. This domain isn't behind Deployment Protection, and Inngest could reach it successfully.

5. **Env var auto-population:** When the Inngest Vercel integration was connected, it automatically populated `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` as Vercel environment variables — no manual copy-paste needed.

The contrast was noted during development:

> *"This was supposed to be a quick and easy 5 minute setup. Better Auth and Resend was a much more pleasant experience than this."*

### Observability improvements

The `runGenerationJob` function was enhanced with structured console logs at each step (job fetch, API call start, audio save, completion). This was critical for debugging production issues where the function would fail silently.

---

## 13. The audit cycle

A recurring pattern throughout development: comprehensive audits. These were explicitly requested at multiple milestones to assess what was complete, partially done, and remaining relative to the MVP plan's feature set.

### Audit 1: Post-UI build

Assessed the mock-data frontend against the MVP plan. Identified: all screens built but no backend wiring.

### Audit 2: Post-Prisma + Stable Audio

Assessed end-to-end flow. Found: generation working, but error handling weak. Audio playback unreliable. Storage on ephemeral filesystem.

### Audit 3: Post-deploy

Assessed production readiness. Found: R2 needed, CORS issues with direct R2 URLs, no auth, no email, generation running via `after()` not Inngest.

### Audit 4: Post-auth + email + Inngest

The most comprehensive audit. Found: core loop working end-to-end in production. Remaining gaps: presigned uploads (large videos failing), generation observability (silent failures), role model too simplistic (everyone is a "director").

This audit directly led to the final two major pieces of work: the hardening commit (`b203210`) and the per-project roles system (`9bcd80d`).

---

## 14. Build-info endpoint

A small but important operational addition: `app/api/build-info/route.ts` returns the current Git SHA and build timestamp. This was added after a production debugging session where it was unclear whether a Vercel deployment was running the latest code or a cached build.

The endpoint lets anyone verify: *"Is this deployment actually running the code I just pushed?"*

---

## 15. Per-project roles and permissions (commit `9bcd80d`)

### The problem with the original role model

The original schema included `role_default` on the Profile model — every user had a global role, and new sign-ups were automatically designated as "director." This created several problems:

- A composer or sound designer couldn't sign up independently without being labeled a director
- There was no way for the same person to be a director on one project and a composer on another
- The role was cosmetic — not enforced at the API layer

### The decision: per-project, not global

This was an explicit product decision:

> *"Should the roles be given per project? Because as it exists right now, a composer, or sound designer, or music supervisor can't onboard or sign up on the app independently without them being automatically designated the role of a director."*

The answer: **per-project roles.** Sign-up is role-agnostic. Anyone can create a project (becoming its owner). Roles are assigned when someone is invited to a project.

### Implementation

**New module: `lib/roles.ts`**
- Defines `PROJECT_ROLES`: `director`, `composer`, `music_supervisor`, `sound_designer`, `viewer`
- `EffectiveRole` type: `'owner' | ProjectRole` (owner is resolved from the project, not stored on the member)
- Permission functions: `canDirect()`, `canApprove()`, `canAcknowledge()`, `canComment()`, `canManage()`

**Permission matrix:**

| Permission | Owner | Director | Music Supervisor | Composer | Sound Designer | Viewer |
|---|---|---|---|---|---|---|
| canDirect (edit intent, scenes, generate, upload, settings) | ✓ | ✓ | — | — | — | — |
| canApprove (approve mock cues) | ✓ | ✓ | ✓ | — | — | — |
| canAcknowledge (confirm brief receipt) | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| canComment | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| canManage (invite/remove members, delete project) | ✓ | — | — | — | — | — |

**API enforcement: `lib/api-auth.ts`**
- `getProjectRole()` resolves a user's effective role on a project (owner check first, then member lookup)
- Assertion guards: `assertCanDirectProject()`, `assertCanDirectScene()`, `assertCanApproveCue()`, `assertCanAcknowledgeCue()`
- Every mutating API route was updated to use the appropriate guard instead of generic access checks

**UI enforcement:**
- Server components resolve `viewerRole` and pass it as props to client components
- `readOnly` props on `SceneMetaEditor`, `SceneVideoUpload`, `SceneIntentEditor`
- `canGenerate` and `canApproveCue` props on `GenerationWorkspace`
- `<fieldset disabled={!viewerCanDirect}>` on the settings page
- Role badges on project cards in the project list

**Schema change:**
- `Profile.role_default` column dropped from Prisma schema
- Sign-up form placeholder changed from "Director name" to "Name"
- Session sync code updated to remove `role_default` references

**Invite validation:**
- The invite route now validates the `role` parameter against the `PROJECT_ROLES` allowlist, rejecting unknown roles with a 400 error

**Acknowledge route — hybrid approach:**
- The acknowledge endpoint allows both authenticated and unauthenticated access (public brief URLs must work without login)
- If a user is logged in, `assertCanAcknowledgeCue` is enforced
- If no session exists, the acknowledge is still permitted (backwards-compatible with the public brief design)

---

## 16. Architecture summary: what the stack looks like now

```
Browser
  ├── Next.js 16 App Router (React Server Components + Client Components)
  ├── Tailwind CSS v4 + shadcn/ui v4
  └── Framer Motion for interactions

  ↓ API Routes (/app/api/)

Next.js Serverless Functions (Vercel)
  ├── Better Auth (session cookies, OAuth callbacks)
  ├── Prisma ORM → PostgreSQL (hosted on Supabase)
  ├── Cloudflare R2 (presigned PUT for uploads, streaming GET for playback)
  ├── Inngest (event dispatch for generation jobs)
  └── Resend (transactional email)

  ↓ Background Jobs

Inngest Cloud
  └── processGeneration function
        ├── Stable Audio 2.5 API → WAV buffer
        ├── Save to R2
        └── Update DB (MockCue, GenerationJob, SceneCard status)
```

### Key architectural patterns

- **Same-origin media proxy:** All R2 objects served through `/api/files/` to avoid CORS issues with audio playback
- **Presigned uploads:** Browser → R2 directly (bypassing API route body size limits)
- **Dual-path generation:** Inngest when configured, `after()` fallback when not
- **Profile syncing:** Better Auth user → app Profile by email, on every session resolve
- **Permission enforcement at two layers:** API guards + UI prop-based rendering
- **Env-var gated features:** R2, Inngest, Resend, OAuth providers all work when configured and degrade gracefully when not

---

## 17. Decisions considered but not taken

| Decision | Why it was considered | Why it was rejected |
|---|---|---|
| Supabase as full platform (Auth + Storage + Realtime) | Original plan used it | Removed to eliminate platform lock-in; only Postgres hosting retained |
| Self-hosted music generation (MusicGen) | Lower per-generation cost at scale | GPU infrastructure not justified before product-market fit |
| WaveSurfer.js for waveform visualization | In the original plan for synced playback | Deferred to focus on core playback; custom player components simpler |
| React Player for video | In the original plan | Native HTML5 `<video>` element was sufficient; one less dependency |
| Magic links for director access | Original plan: directors don't need accounts | Public brief URLs achieve the same goal; email/password + OAuth simpler |
| Global user roles | Initial implementation | Per-project roles more flexible; same user can have different roles on different projects |
| NextAuth.js for authentication | Ecosystem standard | Better Auth chosen for Prisma adapter, simplicity, and active development |
| Direct R2 URLs for media | Simpler architecture | CORS issues with audio playback made same-origin proxy necessary |
| Multipart upload through API routes | Simpler implementation | Vercel body size limits required presigned PUT uploads for large videos |

---

## 18. Production issues and fixes

| Issue | How it manifested | Fix |
|---|---|---|
| Audio won't play | `HTMLMediaElement.play()` returns a promise that rejects | `await play()` with error handling and user-visible toast |
| R2 CORS | Direct R2 URLs blocked by browser for cross-origin audio | Same-origin proxy at `/api/files/` |
| Hydration mismatch (waveform) | `Math.random()` in component produces different server/client values | Precompute values at module scope |
| Video upload size limit | Vercel rejects >4.5MB multipart bodies | Presigned PUT URLs (browser → R2 directly) |
| Inngest signing key error | Local dev server running in cloud mode | `INNGEST_DEV=1` in `.env.local` |
| Inngest can't reach app | Deployment Protection blocks preview URLs | Use custom production domain for Inngest sync |
| Sign-out doesn't work | RSC cache retains old session | Hard navigation (`window.location.href`) after sign-out |
| Schema/code drift | Prisma schema and code using different field names | Realign schema; `npx prisma generate` |
| Deployment not updating | Vercel serving cached deployment | Manual redeploy from Vercel dashboard |

---

## 19. Development tooling and workflow

- **AI-assisted development:** The entire codebase was built with Cursor (AI-assisted IDE). Each commit includes `Made-with: Cursor` in the trailer.
- **Plan-driven development:** Major features were implemented via structured plans (`.plan.md` files) with explicit todo items, marked as in-progress and completed sequentially.
- **Audit-driven prioritization:** Regular comprehensive audits against the MVP feature set drove what got built next.
- **Two-workspace separation:** Research (`film-audio-intent-tool`) and code (`leitmotif`) kept separate to avoid mixing spec work with implementation.
- **Script-assisted debugging:** Utility scripts (`scripts/test-stable-audio.mts`, `scripts/diagnose-owners.mts`, `scripts/ensure-director-auth.mts`, `scripts/ensure-mock-profile.mts`) for testing integrations, diagnosing data issues, and managing the auth migration.
- **Build verification:** `npm run build` (Next.js production build) run after every significant change to catch type errors, import issues, and RSC violations before deployment.

---

## 20. What's next

The MVP is functional end-to-end. The features explicitly deferred from the MVP plan remain as the roadmap:

- AI auto-suggestion of intent tags from video analysis (v1.5)
- A/B comparison of two generations side by side (v1.5)
- Structured revision requests ("what's wrong" chips) (v1.5)
- Picture change remap / frame-offset tracking (v1.5)
- Pro Tools / NLE marker export (v1.5)
- Licensed library reference palette integration (v1.5)
- Cue sheet CSV export (v2)
- AAF/EDL/XML ingest (v2)
- Custom fine-tuned generation model (v2)
- Rate limiting on generation endpoint
- Synchronized video + audio playback (video scrub controls audio)

The taxonomy (`lib/prompts/taxonomy.ts`) — the 14 atmospheres, 10 narrative functions, and their musical parameter mappings — remains the core IP. Everything else is infrastructure to make that vocabulary bridge accessible and audible. The next phase is getting it into real productions and validating whether the hypothesis holds: does a structured intent + mock cue brief actually reduce revision cycles compared to temp tracks and verbal spotting notes?
