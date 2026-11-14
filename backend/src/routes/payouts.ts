import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { getSettings } from "../lib/content.js";
import { shortDate } from "../lib/dates.js";
import { HttpError, parse } from "../lib/http.js";
import { notifyAdmins } from "../lib/notify.js";

// Pencairan pendapatan teacher & psikolog. Saldo = pendapatan dari pembayaran lunas − pencairan (diajukan/ditransfer).
export const payoutsRouter = Router();
payoutsRouter.use(requireAuth, requireRole("TEACHER", "PSYCHOLOGIST"));

/** Saldo pengguna saat ini (dipakai juga oleh admin saat memproses pencairan) */
export async function balanceOf(userId: string) {
  const [earned, waiting, withdrawn] = await Promise.all([
    prisma.payment.aggregate({ where: { payeeUserId: userId, status: "PAID" }, _sum: { payeeAmount: true } }),
    prisma.payment.aggregate({ where: { payeeUserId: userId, status: { in: ["PENDING", "VERIFYING"] } }, _sum: { payeeAmount: true }, _count: true }),
    prisma.payout.aggregate({ where: { userId, status: { in: ["PENDING", "TRANSFERRED"] } }, _sum: { amount: true } }),
  ]);
  const available = (earned._sum.payeeAmount ?? 0) - (withdrawn._sum.amount ?? 0);
  return {
    available: Math.max(0, available),
    held: waiting._sum.payeeAmount ?? 0,
    heldNote: waiting._count ? `${waiting._count} pembayaran menunggu konfirmasi` : "",
    totalEarned: earned._sum.payeeAmount ?? 0,
  };
}

const mask = (accountNumber: string) => `•••• ${accountNumber.replace(/\D/g, "").slice(-4)}`;

/** GET /api/payouts/balance → { available, held, heldNote, minPayout, payoutFee, account } */
payoutsRouter.get("/balance", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me(req).id } });
  const settings = await getSettings();
  res.json({
    ...(await balanceOf(user.id)),
    minPayout: settings.minPayout,
    payoutFee: settings.payoutFee,
    account: user.payoutBankName && user.payoutAccountNumber
      ? { bankName: user.payoutBankName, accountNumberMasked: mask(user.payoutAccountNumber), accountName: user.payoutAccountName }
      : null,
  });
});

/** PUT /api/payouts/account { bankName, accountNumber, accountName } — rekening tujuan pencairan */
payoutsRouter.put("/account", async (req, res) => {
  const body = parse(
    z.object({
      bankName: z.string().trim().min(2).max(40),
      accountNumber: z.string().trim().regex(/^[0-9 -]{5,30}$/, "Nomor rekening hanya angka"),
      accountName: z.string().trim().min(2).max(100),
    }),
    req.body,
  );
  const user = await prisma.user.update({
    where: { id: me(req).id },
    data: { payoutBankName: body.bankName, payoutAccountNumber: body.accountNumber.replace(/\D/g, ""), payoutAccountName: body.accountName },
  });
  res.json({ bankName: user.payoutBankName, accountNumberMasked: mask(user.payoutAccountNumber!), accountName: user.payoutAccountName });
});

/** GET /api/payouts — riwayat pencairan */
payoutsRouter.get("/", async (req, res) => {
  const rows = await prisma.payout.findMany({ where: { userId: me(req).id }, orderBy: { createdAt: "desc" }, take: 50 });
  res.json(
    rows.map((p) => ({
      id: p.id,
      amount: p.amount,
      fee: p.fee,
      received: p.amount - p.fee,
      bankName: p.bankName,
      accountNumberMasked: mask(p.accountNumber),
      status: p.status,
      rejectReason: p.rejectReason,
      date: shortDate(p.createdAt),
      createdAt: p.createdAt,
      processedAt: p.processedAt,
    })),
  );
});

/** POST /api/payouts { amount } — ajukan pencairan ke rekening tersimpan, diproses admin */
payoutsRouter.post("/", async (req, res) => {
  const { amount } = parse(z.object({ amount: z.number().int().positive() }), req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me(req).id } });
  if (!user.payoutBankName || !user.payoutAccountNumber || !user.payoutAccountName) {
    throw new HttpError(400, "Isi rekening tujuan pencairan dulu");
  }
  const settings = await getSettings();
  if (amount < settings.minPayout) throw new HttpError(400, `Minimal pencairan Rp${settings.minPayout.toLocaleString("id-ID")}`);
  const pending = await prisma.payout.count({ where: { userId: user.id, status: "PENDING" } });
  if (pending) throw new HttpError(409, "Masih ada pencairan yang sedang diproses");
  const balance = await balanceOf(user.id);
  if (amount > balance.available) throw new HttpError(400, "Saldo tidak cukup");

  const payout = await prisma.payout.create({
    data: {
      userId: user.id,
      amount,
      fee: settings.payoutFee,
      bankName: user.payoutBankName,
      accountNumber: user.payoutAccountNumber,
      accountName: user.payoutAccountName,
      availableBalance: balance.available,
    },
  });
  await notifyAdmins({
    category: "LAINNYA",
    icon: "bank-transfer-out",
    tone: "yellow",
    title: "Pengajuan pencairan baru",
    body: `${user.fullName} mengajukan pencairan Rp${amount.toLocaleString("id-ID")}.`,
    tag: "Pencairan",
  });
  res.status(201).json({ ...payout, accountNumber: undefined, accountNumberMasked: mask(payout.accountNumber) });
});
