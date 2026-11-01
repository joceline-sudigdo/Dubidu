-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_isDemo_role_idx" ON "User"("isDemo", "role");

-- Tandai akun contoh dari seed demo yang SUDAH ada di database (mis. Neon)
-- supaya tidak pernah terlihat oleh user sungguhan. Akun admin tidak ditandai.
UPDATE "User" SET "isDemo" = true
WHERE "role" <> 'ADMIN' AND "email" IN (
  'devi@dubidu.id', 'parent@dubidu.id', 'rina@dubidu.id', 'arka@dubidu.id', 'mamadimas@dubidu.id',
  'pras@dubidu.id', 'teacher@dubidu.id', 'nielsen@dubidu.id', 'larasati@dubidu.id', 'sarah@dubidu.id',
  'kevin@dubidu.id', 'citra@dubidu.id', 'siti@dubidu.id', 'bayu@dubidu.id',
  'amanda@dubidu.id', 'dimas.psi@dubidu.id', 'reni@dubidu.id', 'farhan@dubidu.id', 'psikolog@dubidu.id'
);
