-- CreateEnum
CREATE TYPE "CaptureMode" AS ENUM ('STANDARD', 'ADVANCED');

-- AlterTable
ALTER TABLE "inspection_requests" ADD COLUMN     "captureMode" "CaptureMode" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "includeInterior" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "calendarNumber" TEXT,
ADD COLUMN     "carInterior" TEXT,
ADD COLUMN     "sideMirrors" TEXT,
ADD COLUMN     "specialInstructions" TEXT,
ADD COLUMN     "sunroofSpecification" TEXT;
