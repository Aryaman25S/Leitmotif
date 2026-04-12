# Leitmotif

**Translate directorial intent into actionable music direction.**

A director uploads a scene clip, tags emotional intent using a controlled vocabulary, and triggers an AI-generated mock cue that concretises the direction. Once approved, a **shareable composer brief** (public URL) bundles the structured spec and reference audio — closing the gap between "it should feel like loss" and direction a composer can execute. **Email delivery is not wired yet**; you share the brief link manually (see [Application flow](#application-flow)).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui v4 |
| Data store | **PostgreSQL** via **Prisma** ([`prisma/schema.prisma`](prisma/schema.prisma), [`lib/store.ts`](lib/store.ts)) |
| File storage | **Cloudflare R2** (S3 API) when `R2_*` env vars are set; otherwise **local disk** `.data/uploads/` and `/api/files/` ([`lib/storage.ts`](lib/storage.ts)) |
| AI music generation | Stability AI — Stable Audio 2.5 (optional; silent WAV mock if no key) |
| Auth (current) | **NextAuth credentials** (username/email + password) via [`lib/auth.ts`](lib/auth.ts) |

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

Apply schema:

```bash
npx prisma migrate dev
# or: npx prisma db push
```

### 3. Environment (optional)

- **`STABILITY_API_KEY`** — real Stable Audio mock cues. Restart `npm run dev` after setting so [`next.config.ts`](next.config.ts) can expose `NEXT_PUBLIC_HAS_STABILITY_KEY` and the UI shows “Calling Stable Audio…”.
- **`NEXTAUTH_SECRET`** / **`NEXTAUTH_URL`** — required for session auth.
- **`R2_*`** — Cloudflare R2 for uploads in production (see [`.env.example`](.env.example)).
- **`INNGEST_EVENT_KEY`** / **`INNGEST_SIGNING_KEY`** — optional; when set, mock-cue generation runs on [Inngest](https://www.inngest.com/) instead of only `after()` on the same serverless invocation ([`app/api/inngest/route.ts`](app/api/inngest/route.ts)).
- **`NEXT_DEV_ALLOWED_ORIGINS`** — optional; comma-separated hostnames when opening dev from a LAN IP (see [`next.config.ts`](next.config.ts)).

**Smoke test** Stable Audio without the app UI:

```bash
npm run test:stable-audio
```

Writes `scripts/out-test-stable-audio.wav` and prints `stable_api` vs `silent_mock`.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then create an account at `/auth/register`.

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

**Brief delivery:** Approving unlocks **`/brief/[mockCueId]`**. There is **no email to the composer** in this repo yet — copy the link from the scene workspace. Project invites use a **magic link** (`/invite/[token]`) when you share the token returned after inviting (email integration is still TODO).

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
  invite/[token]/                Accept project invite (magic link)
  brief/[cueId]/                 Composer brief (public, no auth)
  api/
    projects/                    CRUD + invite
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
  store.ts                       Prisma data access
  auth.ts                        NextAuth credentials config + session helpers
  password.ts                    Password hashing + verification helpers
  storage.ts                     R2 + local disk; read/write helpers
  generation/runGenerationJob.ts Shared Stable Audio → storage → DB pipeline
  videoDuration.ts               Server-side duration via music-metadata (no ffprobe)
  prompts/taxonomy.ts            Controlled vocabulary
  prompts/buildGenerationPrompt.ts    Intent → prompts + musical spec
  prompts/intentDisplay.ts       Human labels for brief / UI
  generation/stableAudio.ts      Stable Audio 2.5 + silent fallback
```

---

## Production hardening checklist

These are **called out in code (TODO)** and matter for a real deployment:

| Area | Current behavior | Target |
|------|------------------|--------|
| **Generation jobs** | `after()` on Vercel; optional **Inngest** when `INNGEST_EVENT_KEY` is set — [`app/api/scenes/[sceneId]/generate/route.ts`](app/api/scenes/[sceneId]/generate/route.ts) | Long-term: keep Inngest or add observability / retries in the dashboard |
| **File hosting** | **R2** + same-origin `/api/files` streaming; local disk in dev | Pre-signed **browser → R2** uploads (smaller API payloads) — upload init route TODO |
| **Auth** | NextAuth credentials (local username/password) | Add email verification + password reset flows |
| **Invites & briefs** | Magic link + manual URL share | Resend (or similar) for invite + “brief ready” email — [`app/api/projects/[projectId]/invite/route.ts`](app/api/projects/[projectId]/invite/route.ts), approve route |
| **Video duration** | Server re-probes with **music-metadata** when the file is readable; browser value used as fallback | Optional: stricter validation or hosted transcode if a format is unsupported |

---

## Disclaimers

- **Mock cues are not deliverables.** They are AI-generated reference audio to communicate intent, not to replace composition.
- **Stable Audio 2.5 ToS:** Commercial use of generated audio is permitted. Do not upload copyrighted material without rights.
- Consult your attorney before using AI-generated audio in final deliverables.
