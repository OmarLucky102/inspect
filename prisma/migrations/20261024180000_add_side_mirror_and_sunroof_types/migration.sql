-- CreateTable
CREATE TABLE "side_mirror_types" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,

    CONSTRAINT "side_mirror_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sunroof_types" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,

    CONSTRAINT "sunroof_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "side_mirror_types_code_key" ON "side_mirror_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sunroof_types_code_key" ON "sunroof_types"("code");
