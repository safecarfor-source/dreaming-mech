-- AlterEnum
ALTER TYPE "OwnerStatus" ADD VALUE 'DEACTIVATED';

-- AlterTable
ALTER TABLE "Owner" ADD COLUMN "deactivatedAt" TIMESTAMP(3),
ADD COLUMN "isProtected" BOOLEAN NOT NULL DEFAULT false;
