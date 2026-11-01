import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db.js";
import { assertChildAccess } from "../lib/access.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { isoDate, startOfWeekWib, wibDate } from "../lib/dates.js";
import { HttpError, parse } from "../lib/http.js";
import { addPoints, CHECKIN_REWARDS } from "../lib/points.js";

export const checkinsRouter = Router();
checkinsRouter.use(requireAuth, requireRole("PARENT", "TEACHER"));

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Kartu "Check-in hari ini": 7 hari Sen–Min minggu ini beserta status & hadiah Madu. */
export async function weekCheckins(userId: string, childId: string) {
  const monday = startOfWeekWib();
  const today = wibDate();
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const rows = await prisma.moodCheckin.findMany({
    where: { userId, childId, date: { gte: monday, lte: sunday } },
  });
  const byDate = new Map(rows.map((r) => [isoDate(r.date), r]));

  const days = DAY_LABELS.map((day, i) => {
    const date = new Date(monday.getTime() + i * 86400000);
    const row = byDate.get(isoDate(date));
    const status = row
      ? "done"
      : date.getTime() === today.getTime()
        ? "today"
        : date < today
          ? "missed"
          : "upcoming";
    return { day, date: isoDate(date), reward: CHECKIN_REWARDS[i], status, mood: row?.mood ?? null };
  });
  return { days, todayDone: byDate.has(isoDate(today)) };
}

/** GET /api/checkins/week?childId=... */
checkinsRouter.get("/week", async (req, res) => {
  const childId = parse(z.string().min(1), req.query.childId);
  await assertChildAccess(me(req), childId);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me(req).id }, select: { points: true } });
  res.json({ ...(await weekCheckins(me(req).id, childId)), points: user.points });
});

/** POST /api/checkins { childId, mood, note? } — tombol "Klaim madu hari ini!" */
checkinsRouter.post("/", async (req, res) => {
  const body = parse(
    z.object({
      childId: z.string(),
      mood: z.enum(["SENANG", "TENANG", "BIASA", "REWEL", "SEDIH"]),
      note: z.string().max(500).optional(),
    }),
    req.body,
  );
  const userId = me(req).id;
  await assertChildAccess(me(req), body.childId);

  const date = wibDate();
  const reward = CHECKIN_REWARDS[(date.getUTCDay() + 6) % 7]!;

  const exists = await prisma.moodCheckin.findUnique({
    where: { childId_userId_date: { childId: body.childId, userId, date } },
  });
  if (exists) throw new HttpError(409, "Kamu sudah check-in untuk anak ini hari ini");

  const { points } = await prisma.$transaction(async (tx) => {
    await tx.moodCheckin.create({
      data: { childId: body.childId, userId, date, mood: body.mood, note: body.note, pointsEarned: reward },
    });
    return addPoints(tx, userId, reward, "checkin");
  });

  res.status(201).json({ pointsEarned: reward, points, message: `Yeay! Kamu dapat +${reward} Madu 🍯` });
});
