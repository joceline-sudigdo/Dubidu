/*
  Warnings:

  - You are about to drop the `Swipe` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Skill" AS ENUM ('SPEECH', 'COMMUNICATION', 'ADHD', 'SENSORY', 'SOCIAL', 'AUTISM', 'ACADEMIC');

-- DropForeignKey
ALTER TABLE "Swipe" DROP CONSTRAINT "Swipe_actorId_fkey";

-- DropForeignKey
ALTER TABLE "Swipe" DROP CONSTRAINT "Swipe_childId_fkey";

-- DropForeignKey
ALTER TABLE "Swipe" DROP CONSTRAINT "Swipe_teacherUserId_fkey";

-- AlterTable
ALTER TABLE "NeedOption" ADD COLUMN     "skill" "Skill";

-- DropTable
DROP TABLE "Swipe";

-- DropEnum
DROP TYPE "SwipeDirection";

-- CreateTable
CREATE TABLE "TeacherSkill" (
    "teacherId" TEXT NOT NULL,
    "skill" "Skill" NOT NULL,
    "selfLevel" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "adminAdjusted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherSkill_pkey" PRIMARY KEY ("teacherId","skill")
);

-- CreateTable
CREATE TABLE "MatchSkip" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "teacherUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchSkip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchSkip_actorId_createdAt_idx" ON "MatchSkip"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchSkip_actorId_childId_teacherUserId_key" ON "MatchSkip"("actorId", "childId", "teacherUserId");

-- AddForeignKey
ALTER TABLE "TeacherSkill" ADD CONSTRAINT "TeacherSkill_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSkip" ADD CONSTRAINT "MatchSkip_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSkip" ADD CONSTRAINT "MatchSkip_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSkip" ADD CONSTRAINT "MatchSkip_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Pengisian data yang sudah ada (mis. di Neon)
-- ---------------------------------------------------------------------------

-- 1. Peta pilihan kebutuhan anak → bidang keahlian teacher
UPDATE "NeedOption" SET "skill" = 'SPEECH'        WHERE "label" IN ('Speech delay');
UPDATE "NeedOption" SET "skill" = 'COMMUNICATION' WHERE "label" IN ('Sulit menyampaikan kebutuhan', 'Kesulitan memahami instruksi');
UPDATE "NeedOption" SET "skill" = 'SOCIAL'        WHERE "label" IN ('Sulit berinteraksi dengan teman', 'Sulit bergiliran & berbagi');
UPDATE "NeedOption" SET "skill" = 'AUTISM'        WHERE "label" IN ('Kurang kontak mata', 'Sulit mengikuti aturan & rutinitas');
UPDATE "NeedOption" SET "skill" = 'ADHD'          WHERE "label" IN ('Sulit fokus & konsentrasi', 'Hiperaktif / sulit duduk tenang', 'Tantrum / ledakan emosi');
UPDATE "NeedOption" SET "skill" = 'ACADEMIC'      WHERE "label" IN ('Kesulitan membaca & menulis', 'Kesulitan berhitung');
UPDATE "NeedOption" SET "skill" = 'SENSORY'       WHERE "label" IN ('Sensitif terhadap suara', 'Sensitif terhadap sentuhan', 'Mencari stimulasi berlebih');

-- 2. Level awal untuk teacher lama (sebelum ada isian level): 85 di bidang yang
--    pernah dicentang sebagai spesialisasi, 55 di bidang lain. Teacher bisa mengubahnya sendiri.
INSERT INTO "TeacherSkill" ("teacherId", "skill", "selfLevel", "level", "updatedAt")
SELECT tp."id", sk."skill", lv."level", lv."level", CURRENT_TIMESTAMP
FROM "TeacherProfile" tp
CROSS JOIN (SELECT unnest(enum_range(NULL::"Skill")) AS "skill") sk
CROSS JOIN LATERAL (
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM "TeacherSpecialization" ts
    JOIN "NeedOption" n ON n."id" = ts."needOptionId"
    WHERE ts."teacherId" = tp."id" AND n."skill" = sk."skill"
  ) THEN 85 ELSE 55 END AS "level"
) lv
WHERE EXISTS (SELECT 1 FROM "TeacherSpecialization" ts WHERE ts."teacherId" = tp."id")
ON CONFLICT DO NOTHING;
