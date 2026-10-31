import { Router } from "express";
import { z } from "zod";

import { prisma, type Prisma } from "../db.js";
import { assertChildAccess, assertOwnChild } from "../lib/access.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { HttpError, param, parse } from "../lib/http.js";
import { warmMatchesForChild } from "../lib/aiMatching.js";
import { presentChild } from "../lib/present.js";

export const childrenRouter = Router();
childrenRouter.use(requireAuth);

const NEEDS_INCLUDE = { needs: { include: { needOption: true } } } as const;

/** Field anak (sama dengan layar child-data + child-needs di frontend). */
export const childInput = z.object({
  name: z.string().trim().min(1),
  fullName: z.string().trim().min(1).optional(),
  birthDate: z.iso.date().optional(), // "2016-05-21"
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  schoolLevel: z.enum(["TK", "SD", "SMP"]).optional(),
  grade: z.string().optional(),
  schoolName: z.string().optional(),
  domicile: z.string().optional(),
  diagnosis: z.string().optional(),
  homeNotes: z.string().optional(),
  medicalRecordUrl: z.string().url().optional(),
  avatarUrl: z.string().url().optional(),
  // label kebutuhan persis seperti di layar child-needs, contoh ["Speech delay", "Sensitif terhadap suara"]
  conditions: z.array(z.string()).default([]),
});
type ChildInput = z.infer<typeof childInput>;

/** Ubah label kebutuhan → id NeedOption. Label yang tidak dikenal ditolak supaya data tetap rapi. */
export async function needIdsFromLabels(tx: Prisma.TransactionClient, labels: string[]) {
  if (labels.length === 0) return [];
  const options = await tx.needOption.findMany();
  const byLabel = new Map(options.map((o) => [o.label.toLowerCase(), o.id]));
  const unknown = labels.filter((l) => !byLabel.has(l.toLowerCase()));
  if (unknown.length) {
    throw new HttpError(400, `Kebutuhan tidak dikenal: ${unknown.join(", ")}. Lihat GET /api/meta/needs`);
  }
  return [...new Set(labels.map((l) => byLabel.get(l.toLowerCase())!))];
}

export async function createChild(tx: Prisma.TransactionClient, parentId: string, input: ChildInput) {
  const needIds = await needIdsFromLabels(tx, input.conditions);
  const { conditions: _c, birthDate, ...fields } = input;
  return tx.child.create({
    data: {
      ...fields,
      fullName: fields.fullName ?? fields.name,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      parentId,
      needs: { create: needIds.map((needOptionId) => ({ needOptionId })) },
    },
    include: NEEDS_INCLUDE,
  });
}

/** GET /api/children — anak milik orang tua yang login */
childrenRouter.get("/", requireRole("PARENT"), async (req, res) => {
  const children = await prisma.child.findMany({
    where: { parentId: me(req).id },
    include: NEEDS_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  res.json(children.map(presentChild));
});

/** POST /api/children — tambah anak (tombol "+" di beranda). Akun gratis maksimal 1 anak. */
childrenRouter.post("/", requireRole("PARENT"), async (req, res) => {
  const body = parse(childInput, req.body);
  const userId = me(req).id;
  const [count, plus] = await Promise.all([
    prisma.child.count({ where: { parentId: userId } }),
    prisma.subscription.findFirst({ where: { userId, active: true, endsAt: { gt: new Date() } } }),
  ]);
  if (count >= 1 && !plus && process.env.FREE_CHILD_LIMIT !== "off") {
    throw new HttpError(402, "Akun gratis hanya bisa 1 profil anak. Upgrade ke Dubidu Plus untuk menambah anak.");
  }
  const child = await prisma.$transaction((tx) => createChild(tx, userId, body));
  warmMatchesForChild(child.id); // AI matching dihitung di belakang layar
  res.status(201).json(presentChild(child));
});

/** GET /api/children/:id — detail anak (orang tua, teacher/psikolog terkait) */
childrenRouter.get("/:id", async (req, res) => {
  await assertChildAccess(me(req), param(req, "id"));
  const child = await prisma.child.findUniqueOrThrow({ where: { id: param(req, "id") }, include: NEEDS_INCLUDE });
  res.json({ ...presentChild(child), medicalRecordUrl: child.medicalRecordUrl, homeNotes: child.homeNotes });
});

/** PATCH /api/children/:id — ubah data anak; kirim `conditions` untuk mengganti seluruh kebutuhan */
childrenRouter.patch("/:id", requireRole("PARENT"), async (req, res) => {
  await assertOwnChild(me(req), param(req, "id"));
  const body = parse(childInput.partial().extend({ conditions: z.array(z.string()).optional() }), req.body);
  const child = await prisma.$transaction(async (tx) => {
    const { conditions, birthDate, ...fields } = body;
    if (conditions) {
      const needIds = await needIdsFromLabels(tx, conditions);
      await tx.childNeed.deleteMany({ where: { childId: param(req, "id") } });
      await tx.childNeed.createMany({ data: needIds.map((needOptionId) => ({ childId: param(req, "id"), needOptionId })) });
    }
    return tx.child.update({
      where: { id: param(req, "id") },
      data: { ...fields, ...(birthDate ? { birthDate: new Date(birthDate) } : {}) },
      include: NEEDS_INCLUDE,
    });
  });
  warmMatchesForChild(child.id);
  res.json(presentChild(child));
});

/** DELETE /api/children/:id */
childrenRouter.delete("/:id", requireRole("PARENT"), async (req, res) => {
  await assertOwnChild(me(req), param(req, "id"));
  await prisma.child.delete({ where: { id: param(req, "id") } });
  res.status(204).end();
});
