-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_colorId_fkey";

-- AlterTable
ALTER TABLE "vehicles" ALTER COLUMN "colorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "colors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
