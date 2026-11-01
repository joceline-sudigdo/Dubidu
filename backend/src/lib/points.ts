import type { Prisma } from "../db.js";

/** Hadiah Madu per hari check-in (Sen → Min), sesuai desain beranda. */
export const CHECKIN_REWARDS = [10, 15, 20, 25, 30, 40, 100];

/** Tambah/kurangi Madu dalam satu transaksi database (saldo + riwayat selalu sinkron). */
export async function addPoints(tx: Prisma.TransactionClient, userId: string, amount: number, reason: string) {
  await tx.pointTransaction.create({ data: { userId, amount, reason } });
  return tx.user.update({ where: { id: userId }, data: { points: { increment: amount } }, select: { points: true } });
}
