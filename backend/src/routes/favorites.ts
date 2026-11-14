import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db.js";
import { me, requireAuth } from "../lib/auth.js";
import { notFound, param, parse } from "../lib/http.js";

// Favorit teacher & psikolog milik user (tersinkron antar-HP, tidak lagi hanya di perangkat)
export const favoritesRouter = Router();
favoritesRouter.use(requireAuth);

const kindParam = z.enum(["teachers", "psychologists"]);
const KIND = { teachers: "TEACHER", psychologists: "PSYCHOLOGIST" } as const;

/** GET /api/favorites → { teachers: [userId teacher], psychologists: [id psikolog] } */
favoritesRouter.get("/", async (req, res) => {
  const rows = await prisma.favorite.findMany({ where: { userId: me(req).id }, orderBy: { createdAt: "desc" } });
  res.json({
    teachers: rows.filter((r) => r.kind === "TEACHER").map((r) => r.targetId),
    psychologists: rows.filter((r) => r.kind === "PSYCHOLOGIST").map((r) => r.targetId),
  });
});

/** Pastikan teacher / psikolog yang difavoritkan benar-benar ada */
async function assertTarget(kind: "TEACHER" | "PSYCHOLOGIST", id: string) {
  const exists =
    kind === "TEACHER"
      ? await prisma.teacherProfile.findUnique({ where: { userId: id }, select: { userId: true } })
      : await prisma.psychologistProfile.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw notFound(kind === "TEACHER" ? "Shadow teacher" : "Psikolog");
}

/** PUT /api/favorites/:kind/:id — tambah favorit (kind = teachers | psychologists) */
favoritesRouter.put("/:kind/:id", async (req, res) => {
  const kind = KIND[parse(kindParam, param(req, "kind"))];
  const targetId = param(req, "id");
  await assertTarget(kind, targetId);
  await prisma.favorite.upsert({
    where: { userId_kind_targetId: { userId: me(req).id, kind, targetId } },
    create: { userId: me(req).id, kind, targetId },
    update: {},
  });
  res.json({ favorite: true });
});

/** DELETE /api/favorites/:kind/:id — hapus dari favorit */
favoritesRouter.delete("/:kind/:id", async (req, res) => {
  const kind = KIND[parse(kindParam, param(req, "kind"))];
  await prisma.favorite.deleteMany({ where: { userId: me(req).id, kind, targetId: param(req, "id") } });
  res.json({ favorite: false });
});
