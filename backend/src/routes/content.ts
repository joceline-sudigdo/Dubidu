import { randomInt } from "node:crypto";

import { Router } from "express";

import { prisma } from "../db.js";
import { me, requireAuth } from "../lib/auth.js";
import { getContent, getContentRow, isContentKey, PUBLIC_CONTENT_KEYS } from "../lib/content.js";
import { shortDate } from "../lib/dates.js";
import { HttpError, notFound, param } from "../lib/http.js";
import { addPoints } from "../lib/points.js";

// Konten yang dikelola dari web admin + penukaran Madu dengan voucher.
export const contentRouter = Router();

/**
 * GET /api/content/:key — legal.terms, legal.privacy, faqs, doobieTopics, rewards, missions, levels, plans, settings
 * Tanpa login (halaman S&K dan FAQ dibuka sebelum daftar). FAQ yang belum dipublikasikan & reward nonaktif disaring.
 */
contentRouter.get("/content/:key", async (req, res) => {
  const key = param(req, "key");
  if (!isContentKey(key) || !PUBLIC_CONTENT_KEYS.includes(key)) throw notFound("Konten");
  const row = await getContentRow(key);
  let value: unknown = row.value;
  if (key === "faqs") value = (row.value as { published: boolean; order: number }[]).filter((f) => f.published).sort((a, b) => a.order - b.order);
  if (key === "rewards" || key === "missions") value = (row.value as { active: boolean }[]).filter((r) => r.active);
  res.json({ key, version: row.version, updatedAt: row.updatedAt, value });
});

const roleKey = (role: string) => (role === "TEACHER" ? "teacher" : "parent");

/** GET /api/rewards — katalog hadiah untuk role-ku + level & saldo Madu */
contentRouter.get("/rewards", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me(req).id } });
  const [rewards, missions, levels] = await Promise.all([getContent("rewards"), getContent("missions"), getContent("levels")]);
  const role = roleKey(user.role);
  const earned = await prisma.pointTransaction.aggregate({ where: { userId: user.id, amount: { gt: 0 } }, _sum: { amount: true } });
  const lifetime = earned._sum.amount ?? 0; // level dihitung dari total Madu yang pernah didapat
  const level = [...levels].sort((a, b) => b.min - a.min).find((l) => lifetime >= l.min) ?? levels[0]!;
  res.json({
    points: user.points,
    lifetimePoints: lifetime,
    level,
    levels,
    rewards: rewards.filter((r) => r.active && r.role === role),
    missions: missions.filter((m) => m.active && m.role === role),
  });
});

/** GET /api/rewards/redemptions — voucher milikku */
contentRouter.get("/rewards/redemptions", requireAuth, async (req, res) => {
  const rows = await prisma.redemption.findMany({ where: { userId: me(req).id }, orderBy: { createdAt: "desc" } });
  res.json(rows.map((r) => ({ ...r, redeemedLabel: shortDate(r.createdAt), expiresLabel: shortDate(r.expiresAt) })));
});

/** POST /api/rewards/:id/redeem — tukar Madu dengan voucher (berlaku 30 hari) */
contentRouter.post("/rewards/:id/redeem", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me(req).id } });
  const rewards = await getContent("rewards");
  const reward = rewards.find((r) => r.id === param(req, "id") && r.active && r.role === roleKey(user.role));
  if (!reward) throw notFound("Hadiah");
  if (user.points < reward.cost) throw new HttpError(400, "Madu kamu belum cukup");
  if (reward.minLevel) {
    const levels = await getContent("levels");
    const earned = await prisma.pointTransaction.aggregate({ where: { userId: user.id, amount: { gt: 0 } }, _sum: { amount: true } });
    const current = [...levels].sort((a, b) => b.min - a.min).find((l) => (earned._sum.amount ?? 0) >= l.min);
    if ((current?.level ?? 1) < reward.minLevel) throw new HttpError(400, `Hadiah ini untuk level ${reward.minLevel} ke atas`);
  }
  if (reward.stock !== null) {
    const used = await prisma.redemption.count({ where: { rewardId: reward.id, status: { not: "CANCELLED" } } });
    if (used >= reward.stock) throw new HttpError(409, "Stok hadiah ini sudah habis");
  }

  const code = `DBD-${reward.id.replace(/^t?r-/, "").toUpperCase().slice(0, 6)}-${randomInt(1000, 9999)}`;
  const redemption = await prisma.$transaction(async (tx) => {
    await addPoints(tx, user.id, -reward.cost, `redeem:${reward.id}`);
    return tx.redemption.create({
      data: {
        userId: user.id,
        rewardId: reward.id,
        rewardTitle: reward.title,
        code,
        cost: reward.cost,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  });
  const { points } = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { points: true } });
  res.status(201).json({ redemption, points });
});
