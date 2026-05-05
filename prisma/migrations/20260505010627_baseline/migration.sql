-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'feature',
    "tone_brief" TEXT,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationSettings" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "instrumentation_families" TEXT[],
    "era_reference" TEXT,
    "budget_reality" TEXT,
    "do_not_generate" TEXT,
    "model_provider" TEXT NOT NULL DEFAULT 'lyria',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT,
    "role_on_project" TEXT NOT NULL,
    "invite_email" TEXT,
    "magic_token" TEXT,
    "can_edit" BOOLEAN NOT NULL DEFAULT true,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneCard" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "cue_number" TEXT,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "tc_in_smpte" TEXT,
    "tc_out_smpte" TEXT,
    "picture_version_label" TEXT,
    "video_file_key" TEXT,
    "video_duration_sec" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'untagged',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "SceneCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentVersion" (
    "id" TEXT NOT NULL,
    "scene_card_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "emotional_atmospheres" TEXT[],
    "narrative_function" TEXT,
    "density" TEXT,
    "director_words" TEXT,
    "what_would_be_wrong" TEXT,
    "handoff_setting" TEXT,
    "diegetic_status" TEXT,
    "frequency_note" TEXT,
    "target_bpm" INTEGER,
    "key_signature" TEXT,
    "featured_instruments" TEXT,
    "recording_quality" TEXT,
    "working_title" TEXT,
    "format_tag" TEXT,
    "positive_prompt" TEXT,
    "negative_prompt" TEXT,
    "spec_tempo_range" TEXT,
    "spec_harmonic_character" TEXT,
    "spec_density" TEXT,
    "spec_register" TEXT,
    "spec_dynamics" TEXT,
    "spec_rhythm" TEXT,
    "spec_instrumentation" TEXT,
    "spec_do_not_use" TEXT[],
    "spec_confirmed_by" TEXT,
    "spec_confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "IntentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "scene_card_id" TEXT NOT NULL,
    "intent_version_id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'queued',
    "model_provider" TEXT NOT NULL DEFAULT 'lyria',
    "positive_prompt" TEXT NOT NULL,
    "negative_prompt" TEXT,
    "duration_sec" DOUBLE PRECISION NOT NULL,
    "error_message" TEXT,
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockCue" (
    "id" TEXT NOT NULL,
    "generation_job_id" TEXT NOT NULL,
    "scene_card_id" TEXT NOT NULL,
    "intent_version_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "duration_sec" DOUBLE PRECISION NOT NULL,
    "is_mock" BOOLEAN NOT NULL DEFAULT true,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "composer_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "composer_acknowledged_at" TIMESTAMP(3),
    "composer_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockCue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "scene_card_id" TEXT NOT NULL,
    "author_id" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationSettings_project_id_key" ON "GenerationSettings"("project_id");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationSettings" ADD CONSTRAINT "GenerationSettings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneCard" ADD CONSTRAINT "SceneCard_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentVersion" ADD CONSTRAINT "IntentVersion_scene_card_id_fkey" FOREIGN KEY ("scene_card_id") REFERENCES "SceneCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_scene_card_id_fkey" FOREIGN KEY ("scene_card_id") REFERENCES "SceneCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_intent_version_id_fkey" FOREIGN KEY ("intent_version_id") REFERENCES "IntentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockCue" ADD CONSTRAINT "MockCue_generation_job_id_fkey" FOREIGN KEY ("generation_job_id") REFERENCES "GenerationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockCue" ADD CONSTRAINT "MockCue_scene_card_id_fkey" FOREIGN KEY ("scene_card_id") REFERENCES "SceneCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockCue" ADD CONSTRAINT "MockCue_intent_version_id_fkey" FOREIGN KEY ("intent_version_id") REFERENCES "IntentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockCue" ADD CONSTRAINT "MockCue_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_scene_card_id_fkey" FOREIGN KEY ("scene_card_id") REFERENCES "SceneCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

