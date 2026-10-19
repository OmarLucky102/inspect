-- CreateEnum
CREATE TYPE "ChecklistReviewDecision" AS ENUM ('PASS', 'FAIL', 'RESHOOT');

-- AlterEnum
ALTER TYPE "InspectionStatus" ADD VALUE 'PENDING_ASSIGNMENT';

-- AlterTable
ALTER TABLE "inspection_checklist_items" ADD COLUMN     "reviewDecision" "ChecklistReviewDecision",
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3);
