import { PrismaPg } from "@prisma/adapter-pg";

import { config } from "./config.js";
import { PrismaClient } from "./generated/prisma/client.js";

// Pengaturan pool untuk serverless (Vercel) + database yang bisa tidur (Neon paket gratis):
// koneksi menganggur cepat ditutup supaya tidak terpakai lagi setelah database tidur,
// keepAlive mendeteksi koneksi putus, dan menunggu koneksi baru dibatasi (bukan selamanya).
const adapter = new PrismaPg({
  connectionString: config.databaseUrl,
  max: 5,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 15_000,
  keepAlive: true,
});

export const prisma = new PrismaClient({ adapter });

export * from "./generated/prisma/client.js";
