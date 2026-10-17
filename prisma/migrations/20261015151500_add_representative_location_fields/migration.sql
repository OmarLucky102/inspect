-- AlterTable
ALTER TABLE "representatives" ADD COLUMN "governorate_id" UUID,
ADD COLUMN "city_id" UUID,
ADD COLUMN "branch_name" VARCHAR(255);

-- CreateIndex
CREATE INDEX "representatives_governorate_id_idx" ON "representatives"("governorate_id");

-- CreateIndex
CREATE INDEX "representatives_city_id_idx" ON "representatives"("city_id");

-- AddForeignKey
ALTER TABLE "representatives" ADD CONSTRAINT "representatives_governorate_id_fkey" FOREIGN KEY ("governorate_id") REFERENCES "governorates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "representatives" ADD CONSTRAINT "representatives_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
