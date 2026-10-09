-- DropForeignKey
ALTER TABLE "checklists" DROP CONSTRAINT "checklists_vehicleCategoryId_fkey";

-- AlterTable
ALTER TABLE "checklist_items" ADD COLUMN     "bankId" UUID,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isMandatory" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "checklists" ADD COLUMN     "bankId" UUID,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "vehicleCategoryId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "checklist_items_bankId_idx" ON "checklist_items"("bankId");

-- CreateIndex
CREATE UNIQUE INDEX "checklists_code_key" ON "checklists"("code");

-- CreateIndex
CREATE INDEX "checklists_bankId_idx" ON "checklists"("bankId");

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_vehicleCategoryId_fkey" FOREIGN KEY ("vehicleCategoryId") REFERENCES "vehicle_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
