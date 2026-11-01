import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db.js";
import { me, requireAuth } from "../lib/auth.js";
import { hhmm, shortDate, wibDate } from "../lib/dates.js";
import { param, parse } from "../lib/http.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

/** Kelompok & label waktu seperti di layar Notifikasi */
function timing(date: Date) {
  const today = wibDate().getTime();
  const day = wibDate(date).getTime();
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (day === today) {
    const time = minutes < 1 ? "Baru saja" : minutes < 60 ? `${minutes} mnt lalu` : `${Math.floor(minutes / 60)} jam lalu`;
    return { group: "today" as const, time };
  }
  if (day === today - 86400000) return { group: "yesterday" as const, time: `Kemarin, ${hhmm(date)}` };
  const days = Math.round((today - day) / 86400000);
  return { group: days <= 7 ? ("week" as const) : ("older" as const), time: days <= 7 ? `${days} hari lalu` : shortDate(date) };
}

/** GET /api/notifications?category=CHAT&limit=50 */
notificationsRouter.get("/", async (req, res) => {
  const userId = me(req).id;
  const category = req.query.category
    ? parse(z.enum(["CHAT", "BOOKING", "LAPORAN", "LAINNYA"]), req.query.category)
    : undefined;
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId, category }, orderBy: { createdAt: "desc" }, take: limit }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  res.json({
    unread,
    items: rows.map((n) => ({
      id: n.id,
      ...timing(n.createdAt),
      category: n.category.toLowerCase(),
      icon: n.icon,
      tone: n.tone,
      title: n.title,
      body: n.body,
      tag: n.tag,
      action: n.action,
      link: n.link,
      unread: n.readAt === null,
      createdAt: n.createdAt,
    })),
  });
});

/** POST /api/notifications/:id/read */
notificationsRouter.post("/:id/read", async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: param(req, "id"), userId: me(req).id, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ ok: true });
});

/** POST /api/notifications/read-all */
notificationsRouter.post("/read-all", async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: { userId: me(req).id, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ updated: result.count });
});
