-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('QRIS', 'BANK_TRANSFER');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'VERIFYING';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "amountDue" INTEGER,
ADD COLUMN     "manualMethodId" TEXT,
ADD COLUMN     "proofNote" TEXT,
ADD COLUMN     "proofSenderName" TEXT,
ADD COLUMN     "proofSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "proofUrl" TEXT,
ADD COLUMN     "rejectReason" TEXT,
ADD COLUMN     "uniqueCode" INTEGER,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "label" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT NOT NULL,
    "qrImageUrl" TEXT,
    "instructions" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_manualMethodId_fkey" FOREIGN KEY ("manualMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
