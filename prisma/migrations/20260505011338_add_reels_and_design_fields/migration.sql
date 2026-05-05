-- Adds Reel as a real grouping under Project, with each existing SceneCard
-- assigned to a default "Reel 1" so the schema stays consistent across
-- environments. Also adds the design-driven optional fields:
--   Project.runtime_minutes, Project.slate, SceneCard.director_note,
--   MockCue.scored_at + MockCue.scored_by.

-- AlterTable: optional design fields on existing models
ALTER TABLE "MockCue"
  ADD COLUMN "scored_at" TIMESTAMP(3),
  ADD COLUMN "scored_by" TEXT;

ALTER TABLE "Project"
  ADD COLUMN "runtime_minutes" INTEGER,
  ADD COLUMN "slate" TEXT;

ALTER TABLE "SceneCard"
  ADD COLUMN "director_note" TEXT;

-- CreateTable: Reel
CREATE TABLE "Reel" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cue_position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reel_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Reel_project_id_idx" ON "Reel"("project_id");
CREATE UNIQUE INDEX "Reel_project_id_cue_position_key" ON "Reel"("project_id", "cue_position");

ALTER TABLE "Reel" ADD CONSTRAINT "Reel_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: add reel_id to SceneCard, nullable for the duration of the
-- backfill so existing rows can be assigned before the NOT NULL is enforced.
ALTER TABLE "SceneCard" ADD COLUMN "reel_id" TEXT;

-- Backfill: every existing project gets a default "Reel 1", and every existing
-- scene card in that project is attached to it.
INSERT INTO "Reel" ("id", "project_id", "name", "cue_position", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "id", 'Reel 1', 1, NOW(), NOW()
FROM "Project";

UPDATE "SceneCard" sc
SET "reel_id" = r."id"
FROM "Reel" r
WHERE r."project_id" = sc."project_id"
  AND r."cue_position" = 1;

-- Enforce NOT NULL now that every row has a reel.
ALTER TABLE "SceneCard" ALTER COLUMN "reel_id" SET NOT NULL;

CREATE INDEX "SceneCard_reel_id_idx" ON "SceneCard"("reel_id");

ALTER TABLE "SceneCard" ADD CONSTRAINT "SceneCard_reel_id_fkey"
  FOREIGN KEY ("reel_id") REFERENCES "Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: scored_by on MockCue
ALTER TABLE "MockCue" ADD CONSTRAINT "MockCue_scored_by_fkey"
  FOREIGN KEY ("scored_by") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
