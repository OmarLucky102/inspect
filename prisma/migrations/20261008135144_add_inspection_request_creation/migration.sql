-- AlterEnum
ALTER TYPE "InspectionStatus" ADD VALUE 'DRAFT';

-- DropForeignKey
ALTER TABLE "inspection_requests" DROP CONSTRAINT "inspection_requests_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_fuelTypeId_fkey";

-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_transmissionTypeId_fkey";

-- DropIndex
DROP INDEX "vehicles_plateNumber_key";

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "nationalId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "inspection_requests" ADD COLUMN     "cityId" UUID,
ADD COLUMN     "governorateId" UUID,
ADD COLUMN     "requestedCompletionDate" TIMESTAMP(3),
ALTER COLUMN "vehicleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "engineCc" INTEGER,
ADD COLUMN     "insuranceValue" DECIMAL(10,2),
ADD COLUMN     "power" INTEGER,
ADD COLUMN     "registrationDate" TIMESTAMP(3),
ADD COLUMN     "trimId" UUID,
ALTER COLUMN "plateNumber" DROP NOT NULL,
ALTER COLUMN "mileage" DROP NOT NULL,
ALTER COLUMN "fuelTypeId" DROP NOT NULL,
ALTER COLUMN "transmissionTypeId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "request_number_counters" (
    "bankId" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "request_number_counters_pkey" PRIMARY KEY ("bankId","period")
);

-- CreateIndex
CREATE INDEX "inspection_requests_bankId_currentStatus_idx" ON "inspection_requests"("bankId", "currentStatus");

-- CreateIndex
CREATE INDEX "inspection_requests_governorateId_idx" ON "inspection_requests"("governorateId");

-- CreateIndex
CREATE INDEX "inspection_requests_cityId_idx" ON "inspection_requests"("cityId");

-- CreateIndex
CREATE INDEX "vehicles_trimId_idx" ON "vehicles"("trimId");

-- AddForeignKey
ALTER TABLE "request_number_counters" ADD CONSTRAINT "request_number_counters_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "governorates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "fuel_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_transmissionTypeId_fkey" FOREIGN KEY ("transmissionTypeId") REFERENCES "transmission_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_trimId_fkey" FOREIGN KEY ("trimId") REFERENCES "vehicle_trims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create partial unique index for plateNumber
CREATE UNIQUE INDEX "vehicles_plateNumber_key" ON "vehicles"("plateNumber") WHERE "plateNumber" IS NOT NULL;

-- Create partial unique index for duplicate requests (same VIN, same bank, open status)
CREATE UNIQUE INDEX "inspection_requests_bankId_vehicleId_key" ON "inspection_requests"("bankId", "vehicleId") WHERE "vehicleId" IS NOT NULL AND "currentStatus" NOT IN ('COMPLETED','APPROVED','REJECTED','CANCELLED');
