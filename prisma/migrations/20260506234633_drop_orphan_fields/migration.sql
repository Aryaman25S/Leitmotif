/*
  Warnings:

  - You are about to drop the column `spec_confirmed_at` on the `IntentVersion` table. All the data in the column will be lost.
  - You are about to drop the column `spec_confirmed_by` on the `IntentVersion` table. All the data in the column will be lost.
  - You are about to drop the column `can_edit` on the `ProjectMember` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "IntentVersion" DROP COLUMN "spec_confirmed_at",
DROP COLUMN "spec_confirmed_by";

-- AlterTable
ALTER TABLE "ProjectMember" DROP COLUMN "can_edit";
