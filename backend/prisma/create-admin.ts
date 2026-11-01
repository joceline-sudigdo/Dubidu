// Buat / reset akun admin.
// Pakai: npm run admin:create -- admin@dubidu.id PasswordKuatSekali "Nama Admin"
import bcrypt from "bcryptjs";

import { prisma } from "../src/db.js";

const [email, password, fullName = "Admin Dubidu"] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.error('Pakai: npm run admin:create -- <email> <password min 8 karakter> ["Nama"]');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);
const admin = await prisma.user.upsert({
  where: { email: email.toLowerCase() },
  create: { role: "ADMIN", email: email.toLowerCase(), fullName, passwordHash },
  update: { role: "ADMIN", passwordHash },
});
console.log(`✔ Admin siap: ${admin.email}`);
await prisma.$disconnect();
