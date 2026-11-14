-- CreateEnum
CREATE TYPE "FavoriteKind" AS ENUM ('TEACHER', 'PSYCHOLOGIST');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "settings" JSONB;

-- AlterTable
ALTER TABLE "PsychologistProfile" ADD COLUMN "about" TEXT;

-- AlterTable
ALTER TABLE "ConversationParticipant" ADD COLUMN "mutedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Favorite" (
    "userId" TEXT NOT NULL,
    "kind" "FavoriteKind" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","kind","targetId")
);

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
