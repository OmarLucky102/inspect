-- CreateTable
CREATE TABLE "representatives" (
    "id" UUID NOT NULL,
    "representative_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "location_name" VARCHAR(255),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "representatives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "representatives_representative_id_key" ON "representatives"("representative_id");

-- CreateIndex
CREATE UNIQUE INDEX "representatives_user_id_key" ON "representatives"("user_id");

-- CreateIndex
CREATE INDEX "representatives_user_id_idx" ON "representatives"("user_id");

-- CreateIndex
CREATE INDEX "representatives_representative_id_idx" ON "representatives"("representative_id");

-- AddForeignKey
ALTER TABLE "representatives" ADD CONSTRAINT "representatives_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
