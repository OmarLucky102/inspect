-- AlterTable
ALTER TABLE "inspection_requests" ADD COLUMN "originalTrimId" UUID;

-- CreateIndex
CREATE INDEX "inspection_requests_originalTrimId_idx" ON "inspection_requests"("originalTrimId");

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_originalTrimId_fkey" FOREIGN KEY ("originalTrimId") REFERENCES "vehicle_trims"("id") ON DELETE SET NULL ON UPDATE CASCADE;
