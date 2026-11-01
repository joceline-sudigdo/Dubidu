/*
  Warnings:

  - You are about to drop the column `pushToken` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "meetingProvider" TEXT,
ADD COLUMN     "meetingRoom" TEXT,
ADD COLUMN     "meetingUrl" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "gatewayPayload" JSONB,
ADD COLUMN     "gatewayStatus" TEXT,
ADD COLUMN     "paymentType" TEXT,
ADD COLUMN     "redirectUrl" TEXT,
ADD COLUMN     "snapToken" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "pushToken";

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchInsight" (
    "childId" TEXT NOT NULL,
    "teacherUserId" TEXT NOT NULL,
    "aiScore" INTEGER NOT NULL,
    "reasons" TEXT[],
    "caution" TEXT,
    "inputHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchInsight_pkey" PRIMARY KEY ("childId","teacherUserId")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_createdAt_idx" ON "PasswordReset"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MatchInsight_teacherUserId_idx" ON "MatchInsight"("teacherUserId");

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
