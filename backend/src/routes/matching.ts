import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db.js";
import { assertOwnChild, assertSameWorld } from "../lib/access.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { todayRangeWib } from "../lib/dates.js";
import { forbidden, HttpError, notFound, param, parse } from "../lib/http.js";
import { blendScore, getAiInsightsWithin } from "../lib/aiMatching.js";
import { distanceKm, matchScore } from "../lib/matching.js";
import { notify } from "../lib/notify.js";
import { CATEGORY_TONE, displayName, initials, presentChild } from "../lib/present.js";

export const matchingRouter = Router();
matchingRouter.use(requireAuth);

const DAILY_SWIPE_LIMIT = 5; // akun gratis; Dubidu Plus = tanpa batas
const AI_CANDIDATES = 15; // kandidat teratas (skor aturan) yang dinilai AI
const AI_WAIT_MS = 12000; // lebih dari ini → kirim skor aturan dulu, aiPending: true

async function swipesLeftToday(userId: string) {
  const plus = await prisma.subscription.findFirst({ where: { userId, active: true, endsAt: { gt: new Date() } } });
  if (plus) return null; // tanpa batas
  const { start, end } = todayRangeWib();
  const used = await prisma.swipe.count({ where: { actorId: userId, createdAt: { gte: start, lt: end } } });
  return Math.max(0, DAILY_SWIPE_LIMIT - used);
}

const swipeBody = z.object({ direction: z.enum(["LIKE", "PASS"]) });

// ---------------------------------------------------------------------------
//  ORANG TUA: swipe kartu shadow teacher
// ---------------------------------------------------------------------------

/** GET /api/matching/teachers?childId=...&limit=20 — dek kartu teacher, urut skor kecocokan */
matchingRouter.get("/teachers", requireRole("PARENT"), async (req, res) => {
  const userId = me(req).id;
  const childId = parse(z.string().min(1), req.query.childId);
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const child = await assertOwnChild(me(req), childId);

  const [parent, childNeeds, swiped, applied] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.childNeed.findMany({ where: { childId } }),
    prisma.swipe.findMany({ where: { actorId: userId, childId }, select: { teacherUserId: true } }),
    prisma.application.findMany({ where: { childId }, select: { teacherUserId: true } }),
  ]);
  const exclude = [...swiped, ...applied].map((s) => s.teacherUserId);

  const teachers = await prisma.teacherProfile.findMany({
    // hanya teacher dari "dunia" yang sama (demo ↔ demo, nyata ↔ nyata)
    where: { verificationStatus: "VERIFIED", userId: { notIn: exclude }, user: { isActive: true, isDemo: parent.isDemo } },
    include: { user: true, specializations: { include: { needOption: true } } },
  });

  const cards = teachers
    .map((t) => {
      const distance = distanceKm(parent, t.user);
      const { score } = matchScore({
        childNeedIds: childNeeds.map((n) => n.needOptionId),
        teacherNeedIds: t.specializations.map((s) => s.needOptionId),
        distanceKm: distance,
        radiusKm: t.radiusKm,
        rating: t.rating,
        reviewCount: t.reviewCount,
        verified: true,
      });
      return {
        id: t.userId,
        fullName: displayName(t.user, t.title),
        avatarUrl: t.user.avatarUrl,
        verified: true,
        specialty: t.headline,
        about: t.about,
        education: t.education,
        experienceYears: t.experienceYears,
        rating: t.rating,
        reviewCount: t.reviewCount,
        pricePerSession: t.pricePerSession,
        availability: t.availability,
        area: t.area ?? t.user.domicile,
        distanceKm: distance,
        ruleScore: score,
        matchPercent: score,
        ai: null as null | { score: number; reasons: string[]; caution: string | null },
        specialties: t.specializations.map((s) => ({ label: s.needOption.label, tone: CATEGORY_TONE[s.needOption.category] })),
      };
    })
    .sort((a, b) => b.ruleScore - a.ruleScore);

  // AI menilai kandidat teratas, lalu skor digabung & diurutkan ulang
  const top = cards.slice(0, Math.max(limit, AI_CANDIDATES));
  const { insights, pending } = await getAiInsightsWithin(
    top.map((c) => ({ childId: child.id, teacherUserId: c.id })),
    AI_WAIT_MS,
  );
  for (const c of top) {
    const ai = insights.get(`${child.id}:${c.id}`);
    c.matchPercent = blendScore(c.ruleScore, ai);
    c.ai = ai ? { score: ai.aiScore, reasons: ai.reasons, caution: ai.caution } : null;
  }
  top.sort((a, b) => b.matchPercent - a.matchPercent);

  res.json({
    child: { id: child.id, name: child.name },
    swipesLeft: await swipesLeftToday(userId),
    aiPending: pending, // true → panggil ulang beberapa detik lagi untuk alasan AI yang lengkap
    cards: top.slice(0, limit),
  });
});

/** POST /api/matching/teachers/:teacherId/swipe { childId, direction } — LIKE = kirim pengajuan */
matchingRouter.post("/teachers/:teacherId/swipe", requireRole("PARENT"), async (req, res) => {
  const userId = me(req).id;
  const body = parse(swipeBody.extend({ childId: z.string() }), req.body);
  const child = await assertOwnChild(me(req), body.childId);
  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: param(req, "teacherId") },
    include: { user: true },
  });
  if (!teacher || teacher.verificationStatus !== "VERIFIED") throw notFound("Shadow teacher");
  await assertSameWorld(me(req), teacher.user.isDemo, "Shadow teacher");

  const left = await swipesLeftToday(userId);
  if (left === 0) throw new HttpError(429, "Kuota swipe hari ini habis. Upgrade ke Dubidu Plus untuk swipe tanpa batas.");

  await prisma.swipe.upsert({
    where: { actorId_childId_teacherUserId: { actorId: userId, childId: child.id, teacherUserId: teacher.userId } },
    create: { actorId: userId, childId: child.id, teacherUserId: teacher.userId, direction: body.direction },
    update: { direction: body.direction },
  });

  if (body.direction === "PASS") return res.json({ ok: true, application: null });

  const application = await prisma.application.upsert({
    where: { childId_teacherUserId: { childId: child.id, teacherUserId: teacher.userId } },
    create: { childId: child.id, teacherUserId: teacher.userId, initiatedBy: "PARENT" },
    update: {},
  });
  await notify({
    userId: teacher.userId,
    category: "LAINNYA",
    icon: "account-heart",
    tone: "blue",
    title: "Ada orang tua yang tertarik denganmu!",
    body: `Orang tua ${child.name} ingin kamu mendampingi anaknya. Lihat profil anak dan beri jawaban.`,
    tag: "Pengajuan Baru",
    action: "Lihat Pengajuan",
    link: `/pengajuan/${application.id}`,
  });
  res.status(201).json({ ok: true, application });
});

// ---------------------------------------------------------------------------
//  SHADOW TEACHER: swipe kartu anak (data anak dianonimkan)
// ---------------------------------------------------------------------------

async function assertVerifiedTeacher(userId: string) {
  const profile = await prisma.teacherProfile.findUnique({ where: { userId }, include: { user: true, specializations: true } });
  if (!profile) throw forbidden();
  if (profile.verificationStatus !== "VERIFIED") {
    throw new HttpError(403, "Profilmu belum terverifikasi. Lengkapi dokumen dan tunggu verifikasi admin.");
  }
  return profile;
}

/** GET /api/matching/children?limit=20 — dek kartu anak untuk teacher */
matchingRouter.get("/children", requireRole("TEACHER"), async (req, res) => {
  const userId = me(req).id;
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const profile = await assertVerifiedTeacher(userId);

  const [swiped, applied] = await Promise.all([
    prisma.swipe.findMany({ where: { actorId: userId }, select: { childId: true } }),
    prisma.application.findMany({ where: { teacherUserId: userId }, select: { childId: true } }),
  ]);

  const children = await prisma.child.findMany({
    where: {
      id: { notIn: [...swiped, ...applied].map((s) => s.childId) },
      needs: { some: {} },
      parent: { isDemo: profile.user.isDemo },
    },
    include: { parent: true, needs: { include: { needOption: true } } },
    take: 200,
  });

  const cards = children
    .map((c) => {
      const distance = distanceKm(profile.user, c.parent);
      const { score } = matchScore({
        childNeedIds: c.needs.map((n) => n.needOptionId),
        teacherNeedIds: profile.specializations.map((s) => s.needOptionId),
        distanceKm: distance,
        radiusKm: profile.radiusKm,
        rating: 0,
        reviewCount: 0,
        verified: true,
      });
      const child = presentChild(c);
      return {
        id: c.id,
        initials: initials(c.fullName), // nama lengkap disembunyikan sampai pengajuan diterima
        age: child.age,
        gender: c.gender,
        schoolLevel: c.schoolLevel,
        grade: child.grade,
        area: c.domicile ?? c.parent.domicile,
        distanceKm: distance,
        ruleScore: score,
        matchPercent: score,
        ai: null as null | { score: number; reasons: string[]; caution: string | null },
        needs: child.needs.map((n) => ({ label: n.label, tone: n.tone })),
      };
    })
    .sort((a, b) => b.ruleScore - a.ruleScore);

  const top = cards.slice(0, Math.max(limit, AI_CANDIDATES));
  const { insights, pending } = await getAiInsightsWithin(
    top.map((c) => ({ childId: c.id, teacherUserId: userId })),
    AI_WAIT_MS,
  );
  for (const c of top) {
    const ai = insights.get(`${c.id}:${userId}`);
    c.matchPercent = blendScore(c.ruleScore, ai);
    c.ai = ai ? { score: ai.aiScore, reasons: ai.reasons, caution: ai.caution } : null;
  }
  top.sort((a, b) => b.matchPercent - a.matchPercent);

  res.json({ swipesLeft: await swipesLeftToday(userId), aiPending: pending, cards: top.slice(0, limit) });
});

/** POST /api/matching/children/:childId/swipe { direction } — LIKE = ajukan diri */
matchingRouter.post("/children/:childId/swipe", requireRole("TEACHER"), async (req, res) => {
  const userId = me(req).id;
  const body = parse(swipeBody.extend({ message: z.string().max(500).optional() }), req.body);
  await assertVerifiedTeacher(userId);
  const child = await prisma.child.findUnique({ where: { id: param(req, "childId") }, include: { parent: { select: { isDemo: true } } } });
  if (!child) throw notFound("Anak");
  await assertSameWorld(me(req), child.parent.isDemo, "Anak");

  const left = await swipesLeftToday(userId);
  if (left === 0) throw new HttpError(429, "Kuota swipe hari ini habis. Upgrade ke Dubidu Plus untuk swipe tanpa batas.");

  await prisma.swipe.upsert({
    where: { actorId_childId_teacherUserId: { actorId: userId, childId: child.id, teacherUserId: userId } },
    create: { actorId: userId, childId: child.id, teacherUserId: userId, direction: body.direction },
    update: { direction: body.direction },
  });
  if (body.direction === "PASS") return res.json({ ok: true, application: null });

  const application = await prisma.application.upsert({
    where: { childId_teacherUserId: { childId: child.id, teacherUserId: userId } },
    create: { childId: child.id, teacherUserId: userId, initiatedBy: "TEACHER", message: body.message },
    update: {},
  });
  await notify({
    userId: child.parentId,
    category: "LAINNYA",
    icon: "star-four-points",
    tone: "yellow",
    title: "Shadow teacher mengajukan diri",
    body: `Ada shadow teacher terverifikasi yang ingin mendampingi ${child.name}. Cek profilnya sekarang.`,
    tag: "Pengajuan Baru",
    action: "Lihat Profil",
    link: `/pengajuan/${application.id}`,
  });
  res.status(201).json({ ok: true, application });
});
