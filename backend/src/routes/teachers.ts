import { Router } from "express";
import { z } from "zod";

import { prisma, type Skill } from "../db.js";
import { assertSameWorld } from "../lib/access.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { shortDate } from "../lib/dates.js";
import { HttpError, notFound, param, parse } from "../lib/http.js";
import { skillFromKey, skillMap, SKILL_KEY } from "../lib/matching.js";
import { CATEGORY_TONE, displayName } from "../lib/present.js";
import { needIdsFromLabels } from "./children.js";

/** { speech: 90, adhd: 70 } — kunci bidang (lihat GET /api/meta/app → skills), nilai 0–100 */
export const skillLevelsSchema = z
  .record(z.string(), z.number().int().min(0).max(100))
  .refine((obj) => Object.keys(obj).every((k) => skillFromKey(k)), {
    message: `Bidang keahlian harus salah satu dari: ${Object.values(SKILL_KEY).join(", ")}`,
  });

export function toSkillLevels(obj: Record<string, number>) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [skillFromKey(k)!, v])) as Partial<Record<Skill, number>>;
}

export const teachersRouter = Router();
teachersRouter.use(requireAuth);

const profileSchema = z.object({
  title: z.string().max(30).optional(),
  headline: z.string().max(80).optional(),
  about: z.string().max(2000).optional(),
  education: z.string().max(200).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  childAgeMin: z.number().int().min(0).max(25).optional(),
  childAgeMax: z.number().int().min(0).max(25).optional(),
  pricePerSession: z.number().int().min(0).optional(),
  availability: z.string().max(120).optional(),
  area: z.string().max(80).optional(),
  radiusKm: z.number().int().min(1).max(100).optional(),
  sessionTarget: z.number().int().min(1).max(200).optional(),
  // label kebutuhan yang dikuasai (sama dengan daftar di GET /api/meta/needs)
  specializations: z.array(z.string()).optional(),
  // level keahlian 0–100 per bidang, contoh { speech: 90, adhd: 70, ... } (penilaian diri teacher)
  skills: skillLevelsSchema.optional(),
});

/** PATCH /api/teachers/me — lengkapi profil terstandar */
teachersRouter.patch("/me", requireRole("TEACHER"), async (req, res) => {
  const { specializations, skills, ...data } = parse(profileSchema, req.body);
  const userId = me(req).id;
  const profile = await prisma.$transaction(async (tx) => {
    const p = await tx.teacherProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    if (specializations) {
      const ids = await needIdsFromLabels(tx, specializations);
      await tx.teacherSpecialization.deleteMany({ where: { teacherId: p.id } });
      await tx.teacherSpecialization.createMany({ data: ids.map((needOptionId) => ({ teacherId: p.id, needOptionId })) });
    }
    if (skills) {
      for (const [skill, value] of Object.entries(toSkillLevels(skills))) {
        const current = await tx.teacherSkill.findUnique({ where: { teacherId_skill: { teacherId: p.id, skill: skill as Skill } } });
        await tx.teacherSkill.upsert({
          where: { teacherId_skill: { teacherId: p.id, skill: skill as Skill } },
          create: { teacherId: p.id, skill: skill as Skill, selfLevel: value, level: value },
          // nilai yang sudah disesuaikan admin tidak tertimpa penilaian diri
          update: { selfLevel: value, ...(current?.adminAdjusted ? {} : { level: value }) },
        });
      }
    }
    return tx.teacherProfile.findUniqueOrThrow({
      where: { id: p.id },
      include: { specializations: { include: { needOption: true } }, documents: true, skills: true },
    });
  });
  res.json({ ...profile, skillLevels: skillMap(profile.skills) });
});

/** POST /api/teachers/me/documents { type, url } — upload dokumen verifikasi (URL dari /api/uploads) */
teachersRouter.post("/me/documents", requireRole("TEACHER"), async (req, res) => {
  const body = parse(
    z.object({ type: z.enum(["KTP", "IJAZAH", "SERTIFIKAT", "CV", "LAINNYA"]), url: z.string().url() }),
    req.body,
  );
  const profile = await prisma.teacherProfile.findUnique({ where: { userId: me(req).id } });
  if (!profile) throw notFound("Profil teacher");
  const doc = await prisma.teacherDocument.create({ data: { ...body, teacherId: profile.id } });
  if (profile.verificationStatus === "UNVERIFIED" || profile.verificationStatus === "REJECTED") {
    await prisma.teacherProfile.update({ where: { id: profile.id }, data: { verificationStatus: "PENDING" } });
  }
  res.status(201).json(doc);
});

/** GET /api/teachers/:userId — profil publik shadow teacher + ulasan */
teachersRouter.get("/:userId", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: param(req, "userId") },
    include: { teacherProfile: { include: { specializations: { include: { needOption: true } }, skills: true } } },
  });
  if (!user?.teacherProfile) throw notFound("Shadow teacher");
  await assertSameWorld(me(req), user.isDemo, "Shadow teacher");
  const t = user.teacherProfile;
  const [reviews, sessionsDone] = await Promise.all([
    prisma.review.findMany({ where: { targetUserId: user.id }, include: { author: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.session.count({ where: { status: "DONE", engagement: { teacherUserId: user.id } } }),
  ]);
  res.json({
    id: user.id,
    fullName: displayName(user, t.title),
    firstName: user.nickname ?? user.fullName.split(" ")[0],
    avatarUrl: user.avatarUrl,
    verified: t.verificationStatus === "VERIFIED",
    specialty: t.headline,
    about: t.about,
    education: t.education,
    experienceYears: t.experienceYears,
    childAge: t.childAgeMin != null && t.childAgeMax != null ? `${t.childAgeMin}–${t.childAgeMax} tahun` : null,
    rating: t.rating,
    reviewCount: t.reviewCount,
    sessionsDone,
    joinedLabel: shortDate(user.createdAt),
    pricePerSession: t.pricePerSession,
    availability: t.availability,
    area: t.area ?? user.domicile,
    specializations: t.specializations.map((s) => ({ label: s.needOption.label, tone: CATEGORY_TONE[s.needOption.category] })),
    skills: skillMap(t.skills), // { speech: 90, ... } untuk grafik keahlian
    reviews: reviews.map((r) => ({ id: r.id, name: r.author.fullName, avatarUrl: r.author.avatarUrl, rating: r.rating, quote: r.comment })),
  });
});

// ---------------------------------------------------------------------------
//  Ulasan
// ---------------------------------------------------------------------------

export const reviewsRouter = Router();
reviewsRouter.use(requireAuth, requireRole("PARENT"));

/** POST /api/reviews { targetUserId, rating, comment? } — hanya setelah pernah dilayani */
reviewsRouter.post("/", async (req, res) => {
  const userId = me(req).id;
  const body = parse(
    z.object({ targetUserId: z.string(), rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() }),
    req.body,
  );
  const [engagement, consultation] = await Promise.all([
    prisma.engagement.findFirst({ where: { parentId: userId, teacherUserId: body.targetUserId } }),
    prisma.consultation.findFirst({
      where: { parentId: userId, status: "COMPLETED", psychologist: { userId: body.targetUserId } },
    }),
  ]);
  if (!engagement && !consultation) throw new HttpError(403, "Kamu hanya bisa memberi ulasan setelah pernah didampingi");

  const review = await prisma.review.upsert({
    where: { authorId_targetUserId: { authorId: userId, targetUserId: body.targetUserId } },
    create: { authorId: userId, ...body },
    update: { rating: body.rating, comment: body.comment },
  });

  // hitung ulang rata-rata rating di profil
  const agg = await prisma.review.aggregate({
    where: { targetUserId: body.targetUserId },
    _avg: { rating: true },
    _count: true,
  });
  const stats = { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count };
  await prisma.teacherProfile.updateMany({ where: { userId: body.targetUserId }, data: stats });
  await prisma.psychologistProfile.updateMany({ where: { userId: body.targetUserId }, data: stats });

  res.status(201).json(review);
});
