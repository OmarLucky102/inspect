-- AlterTable
ALTER TABLE "media" ADD COLUMN "checklistItemCode" TEXT;

-- CreateIndex
CREATE INDEX "media_checklistItemCode_idx" ON "media"("checklistItemCode");

