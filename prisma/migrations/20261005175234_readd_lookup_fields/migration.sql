-- AlterTable
ALTER TABLE "fuel_types" ADD COLUMN "nameAr" TEXT;

-- AlterTable
ALTER TABLE "transmission_types" ADD COLUMN "nameAr" TEXT;

-- AlterTable
ALTER TABLE "colors" ADD COLUMN "nameAr" TEXT, ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "vehicle_categories" ADD COLUMN "nameAr" TEXT, ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_brandId_name_key" ON "vehicle_models"("brandId", "name");
