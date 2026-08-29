-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateTable
CREATE TABLE "bank_invitations" (
    "id" UUID NOT NULL,
    "bankId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_memberships" (
    "id" UUID NOT NULL,
    "bankId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_settings" (
    "id" UUID NOT NULL,
    "bankId" UUID NOT NULL,
    "logoUrl" TEXT,
    "language" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banks" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_invitations_tokenHash_key" ON "bank_invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "bank_invitations_bankId_idx" ON "bank_invitations"("bankId");

-- CreateIndex
CREATE INDEX "bank_memberships_bankId_idx" ON "bank_memberships"("bankId");

-- CreateIndex
CREATE INDEX "bank_memberships_userId_idx" ON "bank_memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_memberships_bankId_userId_key" ON "bank_memberships"("bankId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_settings_bankId_key" ON "bank_settings"("bankId");

-- CreateIndex
CREATE UNIQUE INDEX "banks_code_key" ON "banks"("code");

-- AddForeignKey
ALTER TABLE "bank_invitations" ADD CONSTRAINT "bank_invitations_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_memberships" ADD CONSTRAINT "bank_memberships_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_memberships" ADD CONSTRAINT "bank_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_settings" ADD CONSTRAINT "bank_settings_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
