# Leitmotif

**Translate directorial intent into actionable music direction.**

A director uploads a scene clip, tags emotional intent using a controlled vocabulary, and triggers an AI-generated mock cue that concretises the direction. Once approved, a **shareable composer brief** (public URL) bundles the structured spec and reference audio — closing the gap between "it should feel like loss" and direction a composer can execute. **Optional email** (Resend): project invites and brief-ready notices when env is configured; otherwise share links manually (see [Application flow](#application-flow)).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui v4 |
| Data store | **PostgreSQL** via **Prisma** ([`prisma/schema.prisma`](prisma/schema.prisma), [`lib/store.ts`](lib/store.ts)) |
| File storage | **Cloudflare R2** (S3 API) when `R2_*` env vars are set; otherwise **local disk** `.data/uploads/` and `/api/files/` ([`lib/storage.ts`](lib/storage.ts)) |
| AI music generation | **Stable Audio 2.5** (Stability AI) or **Lyria 3** (Google Gemini API) — selectable per project; silent WAV mock when no API key is set |
| Auth | **[Better Auth](https://www.better-auth.com)** — email/password and optional **Google / GitHub OAuth** ([`lib/auth.ts`](lib/auth.ts), [`lib/oauth-providers.ts`](lib/oauth-providers.ts)); sessions + users in Postgres ([`app/api/auth/[...all]/route.ts`](app/api/auth/[...all]/route.ts)); app [`Profile`](prisma/schema.prisma) synced by email on sign-in ([`lib/session.ts`](lib/session.ts)) |

---

## Setup

### 1. Install

```bash
cd /path/to/leitmotif
npm install
```

### 2. Database (required)

Provision a Postgres database and set URLs in `.env.local` (see [`.env.example`](.env.example)):

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."   # often same as DATABASE_URL; use direct host for migrations if using a pooler
```

Apply schema (includes Better Auth `user` / `session` / `account` / `verification` tables):

```bash
npx prisma migrate dev
# or: npx prisma db push
```

### 3. Better Auth (required)

Add to `.env.local` (see [`.env.example`](.env.example)):

- **`BETTER_AUTH_SECRET`** — at least 32 random bytes (e.g. `openssl rand -base64 32`). **Required in production.**
- **`BETTER_AUTH_URL`** — app origin (e.g. `http://localhost:3000`). Used for callbacks and CSRF.

Then open **`/sign-up`** to create the first account, or **`/sign-in`** to log in. The app shell under `/projects` requires a session.

**OAuth (optional):** Set both `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` and/or `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` in `.env.local` (see [`.env.example`](.env.example)). In each provider’s developer console, register the redirect URL **`{BETTER_AUTH_URL}/api/auth/callback/google`** or **`.../callback/github`** (same origin as `BETTER_AUTH_URL`, e.g. production `https://www.example.com/api/auth/callback/google`). Restart the dev server after changing env. Sign-in and sign-up pages show “Continue with …” only for providers that are configured.

If you previously used the mock dev user (`mock-user-01`), existing projects still point at that profile id. To **log in with Better Auth** and keep the same data, run:

```bash
npm run ensure:director-auth
```

That upserts profile `mock-user-01` / `director@local.dev`, recreates the Better Auth user for that email, and prints a dev password (override with `DIRECTOR_DEV_PASSWORD` in `.env.local`). Then use **`/sign-in`** with that email and password — [`lib/session.ts`](lib/session.ts) ties the session to the existing `Profile` by email, so `owner_id = mock-user-01` projects remain visible.

Alternatively reassign `owner_id` in the database to your other account’s profile id, or create new projects under that account.

### 4. Environment (optional)

- **`STABILITY_API_KEY`** — Stable Audio **2.5** mock cues via `.../stable-audio-2.5/text-to-audio` (select **Stable Audio** in project settings; default provider is **Lyria**). Restart `npm run dev` after setting so [`next.config.ts`](next.config.ts) can expose `NEXT_PUBLIC_HAS_STABILITY_KEY`.
- **`STABLE_AUDIO_CFG_SCALE`** / **`STABLE_AUDIO_STEPS`** — optional; defaults **7** and **50** (explicit CFG and step count; override for cost/latency or Stability’s recommended ranges).
- **`GEMINI_API_KEY`** — Lyria 3 mock cues via Google Gemini API (default provider). Get a key at [AI Studio](https://aistudio.google.com/apikey). Select **Stable Audio 2.5** in project settings if you prefer Stability instead.
- **`NEXT_PUBLIC_APP_URL`** — base URL for invite and brief links in emails and JSON (e.g. `http://localhost:3000`). On Vercel, `VERCEL_URL` is used when this and `BETTER_AUTH_URL` are unset.
- **`RESEND_API_KEY`** / **`RESEND_FROM`** — when both are set, [Resend](https://resend.com) sends **project invite** emails and **brief-ready** emails to composer / music-supervisor members (see [`.env.example`](.env.example)). Set **`RESEND_BRIEF_EMAILS=false`** to turn off brief emails only.
- **`R2_*`** — Cloudflare R2 for uploads in production (see [`.env.example`](.env.example)).
- **`INNGEST_EVENT_KEY`** / **`INNGEST_SIGNING_KEY`** — **recommended in production**; mock-cue generation is queued on [Inngest](https://www.inngest.com/) with step retries instead of relying on Next `after()` on the same invocation ([`app/api/inngest/route.ts`](app/api/inngest/route.ts), [`inngest/functions.ts`](leitmotif/inngest/functions.ts)). If unset in production, each generate request logs a warning when falling back to `after()`.
- **`NEXT_DEV_ALLOWED_ORIGINS`** — optional; comma-separated hostnames when opening dev from a LAN IP (see [`next.config.ts`](next.config.ts)).

**Smoke test** Stable Audio without the app UI:

```bash
npm run test:stable-audio
```

Writes `scripts/out-test-stable-audio.wav` and prints `stable_api` vs `silent_mock`.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The **home page** (`/`) is public. Everything under **`/projects`** (and other routes in the signed-in shell) **requires a session** — use **`/sign-in`** or **`/sign-up`** first. Public composer briefs at **`/brief/[mockCueId]`** stay readable without auth once a cue is approved.

---

## Application flow

```
Create project
    ↓
Add scene card (label + optional cue number)
    ↓
Upload video clip (optional — used for duration reference)
    ↓
Tag intent:
  • Emotional atmosphere  (controlled vocabulary)
  • Narrative function    (what is the music doing?)
  • Music density         (silence → saturated)
  • Score / sound balance (score-forward vs. sound-forward)
  • Director's words + what would be wrong
    ↓
Save intent → musical spec + AI prompts generated
    ↓
Generate mock cue
  → With STABILITY_API_KEY: calls Stable Audio 2.5 (~30–90s)
  → Without key: generates a silent reference WAV in ~1s
    ↓
Play mock cue, iterate or approve
    ↓
On approval → composer brief URL (/brief/[cueId])
  • Structured musical direction spec
  • Mock cue player (labeled: reference only)
  • Print / save as PDF (browser print)
```

**Brief delivery:** Approving unlocks **`/brief/[mockCueId]`** for sharing (and browser print). **Transactional email:** when **`RESEND_API_KEY`** and **`RESEND_FROM`** are set, [Resend](https://resend.com) sends **brief-ready** mail to composer / music-supervisor members (see [`.env.example`](.env.example)); you can still copy the brief link from the scene workspace anytime. **Project invites** use a **token URL** (`/invite/[token]`): the invitee accepts **after they sign in**; same Resend env sends the invite email when configured, otherwise share the link from the API response or toast.

---

## Roles and permissions

Roles are **per-project**, not global. Anyone can sign up and create projects — whoever creates a project is the **owner**. A user can be a director on one project and a composer on another. Roles are assigned at invite time via project settings.

| Action | Owner | Director | Music Sup. | Composer | Sound Des. | Viewer |
|--------|:-----:|:--------:|:----------:|:--------:|:----------:|:------:|
| View project / scenes / intent | Y | Y | Y | Y | Y | Y |
| Edit project settings | Y | Y | - | - | - | - |
| Add / delete scenes | Y | Y | - | - | - | - |
| Edit scene metadata | Y | Y | - | - | - | - |
| Upload video | Y | Y | - | - | - | - |
| Edit intent | Y | Y | - | - | - | - |
| Generate mock cue | Y | Y | - | - | - | - |
| Approve mock cue | Y | Y | Y | - | - | - |
| Acknowledge brief | - | - | - | Y | Y | - |
| Comment | Y | Y | Y | Y | Y | Y |
| Invite / remove members | Y | - | - | - | - | - |
| Delete project | Y | - | - | - | - | - |

Permission groups are defined in [`lib/roles.ts`](lib/roles.ts) (`canDirect`, `canApprove`, `canAcknowledge`, `canComment`, `canManage`). API routes enforce these via assertion guards in [`lib/api-auth.ts`](lib/api-auth.ts). The UI adapts based on the viewer's role — non-directors see read-only intent, hidden generate/upload controls, and disabled settings fields. The `/projects` list shows a role badge per project.

The public brief page (`/brief/[cueId]`) remains accessible without auth — the link itself is the access control for external composers.

---

## Data storage

| What | Where |
|---|---|
| Projects, scenes, intents, jobs, cues, comments, members | **Postgres** (Prisma), e.g. hosted on **Supabase** |
| Uploaded videos & generated mock cue WAVs | **R2 bucket** in production (browser loads via same-origin `/api/files/…` which streams from R2); locally under `.data/uploads/` (git-ignored) |

**Reset DB:** drop/recreate the database or use Prisma migrate reset. **Reset local files:** delete `.data/uploads/`. **R2:** clear objects from the bucket in the Cloudflare dashboard if needed.

---

## Key files

```
app/
  (app)/
    projects/                    Project list
    projects/new/                Create project
    projects/[id]/               Scene card list
    projects/[id]/scenes/[id]/   Core scene editor (intent + generation)
    projects/[id]/settings/      Project settings + team invite
  invite/[token]/                Accept project invite (token URL; user must be signed in)
  brief/[cueId]/                 Composer brief (public, no auth)
  api/
    projects/                    CRUD + invite + member DELETE
    projects/.../members/[id]/   Remove collaborator (owner only)
    build-info/                  Optional GET build metadata (e.g. Vercel git SHA)
    scenes/                      Scene cards, video, meta, generate, status
    intent/                      Save intent versions
    mock-cues/                    Approve, audio URL, composer acknowledge
    export/brief-data/           JSON bundle for cue + intent (integrations)
    storage/upload/              Init + commit file upload
    files/[...path]/             Stream from R2 or disk (same-origin for media playback)
    api/inngest/                 Inngest sync + registered functions (optional queue)

components/
  vocabulary-bridge/SceneIntentEditor   Intent tagging UI
  generation/GenerationWorkspace        Mock cue generation + player
  generation/MockCuePlayer              Scrubable audio player
  player/SceneVideoUpload               Video upload

lib/
  roles.ts                       Per-project role constants + permission helpers
  store.ts                       Prisma data access
  public-url.ts                  Origin for invite/brief links (env + request)
  mail/resend.ts                 Optional Resend invite + brief emails
  auth.ts                        Better Auth server instance
  auth-client.ts                 Better Auth React client
  session.ts                     Session → Profile sync (by email)
  api-auth.ts                    API route session + project/role access helpers
  storage.ts                     R2 + local disk; read/write helpers
  generation/runGenerationJob.ts Shared generation → storage → DB pipeline (routes to provider)
  generation/stableAudio.ts      Stable Audio 2.5 API client + silent fallback
  generation/lyria.ts            Lyria 3 (Gemini API) client + silent fallback
  videoDuration.ts               Server-side duration via music-metadata (no ffprobe)
  prompts/taxonomy.ts            Controlled vocabulary
  prompts/buildGenerationPrompt.ts    Intent → prompts + musical spec (Stable Audio + Lyria)
  prompts/intentDisplay.ts       Human labels for brief / UI
```

---

## Production hardening checklist

These are **called out in code (TODO)** and matter for a real deployment:

| Area | Current behavior | Target |
|------|------------------|--------|
| **Generation jobs** | **`after()`** when `INNGEST_EVENT_KEY` is unset (risky for long Stable runs on serverless); **Inngest** queue + step retries when set — [`app/api/scenes/[sceneId]/generate/route.ts`](app/api/scenes/[sceneId]/generate/route.ts), [`inngest/functions.ts`](leitmotif/inngest/functions.ts) | **Production:** set `INNGEST_EVENT_KEY` (Inngest-first). Structured logs in [`runGenerationJob`](leitmotif/lib/generation/runGenerationJob.ts); add external metrics/alerting as needed |
| **File hosting** | **R2** + same-origin `/api/files` streaming; **presigned PUT** to R2 for scene video when R2 env is set; otherwise multipart upload via **`/api/storage/upload/commit`** and local disk in dev | Tune CORS on the R2 bucket for your app origin; optional multipart tuning |
| **Auth & RBAC** | Better Auth **email/password** + optional **Google / GitHub OAuth**; Postgres sessions; app [`Profile`](prisma/schema.prisma) synced by email — [`lib/auth.ts`](lib/auth.ts), [`lib/oauth-providers.ts`](lib/oauth-providers.ts). **Per-project roles** (owner, director, music_supervisor, composer, sound_designer, viewer) enforced at API + UI level — [`lib/roles.ts`](lib/roles.ts), [`lib/api-auth.ts`](lib/api-auth.ts) | Optional: org-style features beyond `ProjectMember`, stricter **email verification** if required. |
| **Invites & briefs** | With **Resend** env (`RESEND_API_KEY`, `RESEND_FROM`): invite + brief-ready emails from those routes; always returns shareable URLs in JSON | Tune copy, `RESEND_REPLY_TO`, deliverability, and **`RESEND_BRIEF_EMAILS`** — [`app/api/projects/[projectId]/invite/route.ts`](app/api/projects/[projectId]/invite/route.ts), [`app/api/mock-cues/[cueId]/approve/route.ts`](app/api/mock-cues/[cueId]/approve/route.ts), [`lib/mail/resend.ts`](lib/mail/resend.ts) |
| **Video duration** | Server re-probes with **music-metadata** when the file is readable; browser value used as fallback | Optional: stricter validation or hosted transcode if a format is unsupported |

---

## Disclaimers

- **Mock cues are not deliverables.** They are AI-generated reference audio to communicate intent, not to replace composition.
- **Stable Audio 2.5 ToS:** Commercial use of generated audio is permitted. Do not upload copyrighted material without rights.
- Consult your attorney before using AI-generated audio in final deliverables.
