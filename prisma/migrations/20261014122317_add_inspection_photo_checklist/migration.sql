-- CreateTable
CREATE TABLE "inspection_photo_checklists" (
    "id" UUID NOT NULL,
    "inspectionRequestId" UUID NOT NULL,
    "licensePhoto" BOOLEAN NOT NULL DEFAULT true,
    "airbagPhoto" BOOLEAN NOT NULL DEFAULT true,
    "roofPhoto" BOOLEAN NOT NULL DEFAULT true,
    "odometerPhoto" BOOLEAN NOT NULL DEFAULT true,
    "chassisPhoto" BOOLEAN NOT NULL DEFAULT true,
    "customFields" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_photo_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inspection_photo_checklists_inspectionRequestId_key" ON "inspection_photo_checklists"("inspectionRequestId");

-- AddForeignKey
ALTER TABLE "inspection_photo_checklists" ADD CONSTRAINT "inspection_photo_checklists_inspectionRequestId_fkey" FOREIGN KEY ("inspectionRequestId") REFERENCES "inspection_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
