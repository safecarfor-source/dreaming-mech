-- AlterTable
ALTER TABLE "ServiceInquiry"
  ALTER COLUMN "customerId" DROP NOT NULL,
  ADD COLUMN "name" TEXT;
