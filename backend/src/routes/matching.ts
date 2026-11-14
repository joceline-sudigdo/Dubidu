// Matching berbasis profil (tanpa swipe) — sesuai layar "Cari Teacher" & "Cari Anak" di frontend:
//   • 5 kandidat paling cocok
//   • "Lewati" → kandidat diganti yang berikutnya (gratis 5× per hari, Dubidu Plus tanpa batas)
//   • "Hubungkan" → pengajuan + chat langsung terbuka dengan pesan penawaran otomatis
//   • "Bandingkan" → dua kandidat berdampingan + rekomendasi
import { Router } from "express";
import { z } from "zod";

import { prisma, type Prisma } from "../db.js";
import { assertOwnChild, assertSameWorld, ensureConversation } from "../lib/access.js";
import { blendScore, getAiInsightsWithin, type AiInsight } from "../lib/aiMatching.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { todayRangeWib } from "../lib/dates.js";
import { forbidden, HttpError, notFound, param, parse } from "../lib/http.js";
import { childSkills, cityLabel, cityOf, distanceKm, matchReasons, matchScore, SKILL_KEY, SKILL_LABEL, skillMap, strongestDifference } from "../lib/matching.js";
import { notify } from "../lib/notify.js";
import { displayName, initials, presentChild } from "../lib/present.js";
import { sendMessage } from "./chat.js";

export const matchingRouter = Router();
matchingRouter.use(requireAuth);

const MATCH_COUNT = 5; // kandidat yang ditampilkan
const MAX_SKIPS = 5; // "Lewati" per hari untuk akun gratis
const AI_CANDIDATES = 10; // kandidat teratas (skor dasar) yang dinilai AI
const AI_WAIT_MS = 12000; // lebih dari ini → kirim skor dasar dulu, aiPending: true

const CHILD_INCLUDE = { needs: { include: { needOption: true } }, parent: true } as const;
type ChildRow = Prisma.ChildGetPayload<{ include: typeof CHILD_INCLUDE }>;
const TEACHER_INCLUDE = { user: true, skills: true } as const;
type TeacherRow = Prisma.TeacherProfileGetPayload<{ include: typeof TEACHER_INCLUDE }>;

async function hasPlus(userId: string) {
  return Boolean(await prisma.subscription.findFirst({ where: { userId, active: true, endsAt: { gt: new Date() } } }));
}

/** Sisa "Lewati" hari ini. `null` = tanpa batas (Dubidu Plus). */
async function skipsLeft(userId: string) {
  if (await hasPlus(userId)) return null;
  const { start, end } = todayRangeWib();
  const used = await prisma.matchSkip.count({ where: { actorId: userId, createdAt: { gte: start, lt: end } } });
  return Math.max(0, MAX_SKIPS - used);
}

async function useSkip(userId: string) {
  const left = await skipsLeft(userId);
  if (left === 0) {
    throw new HttpError(429, `Batas lewati hari ini (${MAX_SKIPS}×) sudah habis. Upgrade ke Dubidu Plus untuk melihat kandidat tanpa batas.`);
  }
}

/** Skor dasar satu pasangan anak–teacher */
function pairScore(child: ChildRow, teacher: TeacherRow) {
  const distance = distanceKm(child.parent, teacher.user);
  const childCity = cityOf(child.domicile ?? child.parent.domicile);
  const teacherCity = cityOf(teacher.user.domicile);
  const input = {
    childSkills: childSkills(child),
    teacherLevels: teacher.skills,
    rating: teacher.rating,
    reviewCount: teacher.reviewCount,
    sameCity: Boolean(childCity && childCity === teacherCity),
    distanceKm: distance,
  };
  return {
    distance,
    score: matchScore(input),
    why: matchReasons({ ...input, childName: child.name, teacherCity: cityLabel(teacher.user.domicile) }),
  };
}

/** Statistik teacher untuk kartu: jumlah sesi selesai & tingkat respons chat */
/** Sesi selesai & tingkat respons chat per teacher (dipakai juga oleh GET /auth/me) */
export async function teacherStats(teacherUserIds: string[]) {
  const [sessions, participations] = await Promise.all([
    prisma.session.findMany({
      where: { status: "DONE", engagement: { teacherUserId: { in: teacherUserIds } } },
      select: { engagement: { select: { teacherUserId: true } } },
    }),
    prisma.conversationParticipant.findMany({
      where: { userId: { in: teacherUserIds }, conversation: { type: "TEACHER" } },
      select: { userId: true, conversation: { select: { messages: { select: { senderId: true } } } } },
    }),
  ]);
  const stats = new Map(teacherUserIds.map((id) => [id, { sessions: 0, chats: 0, replied: 0 }]));
  for (const s of sessions) stats.get(s.engagement.teacherUserId)!.sessions++;
  for (const p of participations) {
    const st = stats.get(p.userId)!;
    st.chats++;
    if (p.conversation.messages.some((m) => m.senderId === p.userId)) st.replied++;
  }
  return new Map(
    [...stats].map(([id, s]) => [id, { sessions: s.sessions, responseRate: s.chats ? Math.round((s.replied / s.chats) * 100) : null }]),
  );
}

function aiView(ai?: AiInsight) {
  return ai ? { score: ai.aiScore, reasons: ai.reasons, caution: ai.caution } : null;
}

// ===========================================================================
//  ORANG TUA → mencari shadow teacher untuk anaknya
// ===========================================================================

async function loadOwnChild(req: Parameters<typeof me>[0], childId: string) {
  await assertOwnChild(me(req), childId);
  return prisma.child.findUniqueOrThrow({ where: { id: childId }, include: CHILD_INCLUDE });
}

/** Semua kartu teacher untuk anak ini, urut kecocokan (AI dipakai untuk kandidat teratas). */
async function rankTeachers(child: ChildRow, opts: { onlyIds?: string[]; waitAi?: number } = {}) {
  // teacher yang pernah dilewati ditaruh paling belakang (yang paling lama dilewati muncul lebih dulu),
  // jadi daftar tidak pernah habis walau jumlah teacher sedikit (mis. akun demo)
  const skips = await prisma.matchSkip.findMany({
    where: { actorId: child.parentId, childId: child.id },
    select: { teacherUserId: true, createdAt: true },
  });
  const skippedAt = new Map(skips.map((s) => [s.teacherUserId, s.createdAt.getTime()]));
  const recycledOrder = (id: string) => skippedAt.get(id) ?? -Infinity;
  const applications = await prisma.application.findMany({ where: { childId: child.id }, select: { teacherUserId: true, status: true } });
  const appByTeacher = new Map(applications.map((a) => [a.teacherUserId, a.status]));

  const teachers = await prisma.teacherProfile.findMany({
    where: {
      verificationStatus: "VERIFIED",
      // hanya teacher dari "dunia" yang sama (demo ↔ demo, nyata ↔ nyata)
      user: { isActive: true, isDemo: child.parent.isDemo },
      ...(opts.onlyIds ? { userId: { in: opts.onlyIds } } : {}),
    },
    include: TEACHER_INCLUDE,
  });

  const scored = teachers
    .map((t) => ({ t, ...pairScore(child, t) }))
    .sort((a, b) => recycledOrder(a.t.userId) - recycledOrder(b.t.userId) || b.score - a.score || b.t.rating - a.t.rating);

  const top = opts.onlyIds ? scored : scored.slice(0, AI_CANDIDATES);
  const { insights, pending } = await getAiInsightsWithin(
    top.map((s) => ({ childId: child.id, teacherUserId: s.t.userId })),
    opts.waitAi ?? AI_WAIT_MS,
  );
  const stats = await teacherStats(top.map((s) => s.t.userId));

  const cards = top
    .map(({ t, score, distance, why }) => {
      const ai = insights.get(`${child.id}:${t.userId}`);
      const st = stats.get(t.userId)!;
      return {
        id: t.userId,
        name: displayName(t.user, t.title),
        avatarUrl: t.user.avatarUrl,
        headline: t.headline,
        about: t.about,
        city: cityLabel(t.user.domicile),
        area: t.area,
        distanceKm: distance,
        price: t.pricePerSession,
        rating: t.rating,
        reviews: t.reviewCount,
        experience: t.experienceYears,
        education: t.education,
        availability: t.availability,
        sessions: st.sessions,
        responseRate: st.responseRate,
        skills: skillMap(t.skills), // { speech: 90, communication: 80, ... } = Teacher.skills di frontend
        ruleScore: score,
        matchPercent: Math.min(99, blendScore(score, ai)),
        ai: aiView(ai),
        // alasan kecocokan yang bisa dijelaskan (dari rumus skor); alasan AI dipakai bila tersedia
        reasons: ai?.reasons.length ? ai.reasons : why.reasons,
        caution: ai?.caution ?? why.caution,
        connected: appByTeacher.has(t.userId),
        applicationStatus: appByTeacher.get(t.userId) ?? null,
      };
    })
    .sort((a, b) => recycledOrder(a.id) - recycledOrder(b.id) || b.matchPercent - a.matchPercent || b.rating - a.rating);

  return { cards, aiPending: pending };
}

async function teacherListResponse(child: ChildRow, userId: string) {
  const { cards, aiPending } = await rankTeachers(child);
  return {
    child: { id: child.id, name: child.name, skills: childSkills(child).map((s) => SKILL_KEY[s]) },
    matchCount: MATCH_COUNT,
    skipsLeft: await skipsLeft(userId),
    aiPending, // true → panggil ulang beberapa detik lagi untuk alasan AI yang lengkap
    cards: cards.slice(0, MATCH_COUNT),
  };
}

/** GET /api/matching/teachers?childId=... — 5 shadow teacher paling cocok */
matchingRouter.get("/teachers", requireRole("PARENT"), async (req, res) => {
  const childId = parse(z.string().min(1), req.query.childId);
  const child = await loadOwnChild(req, childId);
  res.json(await teacherListResponse(child, me(req).id));
});

async function loadVerifiedTeacher(req: Parameters<typeof me>[0], teacherUserId: string) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: teacherUserId }, include: TEACHER_INCLUDE });
  if (!teacher || teacher.verificationStatus !== "VERIFIED") throw notFound("Shadow teacher");
  await assertSameWorld(me(req), teacher.user.isDemo, "Shadow teacher");
  return teacher;
}

/** POST /api/matching/teachers/:teacherId/skip { childId } — "Lewati" → daftar baru (kandidat berikutnya masuk) */
matchingRouter.post("/teachers/:teacherId/skip", requireRole("PARENT"), async (req, res) => {
  const { childId } = parse(z.object({ childId: z.string() }), req.body);
  const child = await loadOwnChild(req, childId);
  const teacher = await loadVerifiedTeacher(req, param(req, "teacherId"));
  await useSkip(me(req).id);
  await prisma.matchSkip.upsert({
    where: { actorId_childId_teacherUserId: { actorId: me(req).id, childId, teacherUserId: teacher.userId } },
    create: { actorId: me(req).id, childId, teacherUserId: teacher.userId },
    update: { createdAt: new Date() }, // dilewati lagi → tetap dihitung sebagai skip hari ini
  });
  res.json(await teacherListResponse(child, me(req).id));
});

/**
 * POST /api/matching/teachers/:teacherId/connect { childId, message? } — "Hubungkan"
 * → pengajuan (Riwayat Pengajuan) + chat langsung terbuka dengan pesan penawaran.
 * Balikan: { application, conversationId } → buka layar chat.
 */
matchingRouter.post("/teachers/:teacherId/connect", requireRole("PARENT"), async (req, res) => {
  const body = parse(z.object({ childId: z.string(), message: z.string().trim().min(3).max(1000).optional() }), req.body);
  const child = await loadOwnChild(req, body.childId);
  const teacher = await loadVerifiedTeacher(req, param(req, "teacherId"));

  const existing = await prisma.application.findUnique({
    where: { childId_teacherUserId: { childId: child.id, teacherUserId: teacher.userId } },
  });
  const convo = await ensureConversation("TEACHER", child.parentId, teacher.userId, child.id);
  if (existing && existing.status !== "REJECTED" && existing.status !== "CANCELLED") {
    return res.json({ application: existing, conversationId: convo.id, alreadyConnected: true });
  }

  const { score } = pairScore(child, teacher);
  const application = existing
    ? await prisma.application.update({
        where: { id: existing.id },
        data: { status: "PENDING", initiatedBy: "PARENT", respondedAt: null, matchScore: score, createdAt: new Date() },
      })
    : await prisma.application.create({
        data: { childId: child.id, teacherUserId: teacher.userId, initiatedBy: "PARENT", matchScore: score },
      });

  const parentName = child.parent.nickname ?? child.parent.fullName;
  const condition = presentChild(child).condition;
  const city = cityLabel(child.domicile ?? child.parent.domicile);
  const text =
    body.message ??
    `Halo Kak ${teacher.user.nickname ?? teacher.user.fullName.split(" ")[0]}! Saya ${parentName}, orang tua dari ${child.name}${condition ? ` (${condition})` : ""}. Saya tertarik dengan pendampingan Kakak. Apakah Kakak bersedia untuk sesi observasi/trial${city ? ` di ${city}` : ""}?`;
  await sendMessage(convo.id, child.parentId, { type: "TEXT", text });
  await notify({
    userId: teacher.userId,
    category: "LAINNYA",
    icon: "account-heart",
    tone: "blue",
    title: "Permintaan pendampingan baru",
    body: `Orang tua ${initials(child.fullName)} ingin kamu mendampingi anaknya. Cek profil anak dan balas lewat chat.`,
    tag: "Permintaan",
    action: "Lihat Permintaan",
    link: `/teacher/permintaan/${application.id}`,
  });
  res.status(201).json({ application, conversationId: convo.id, alreadyConnected: false });
});

/** GET /api/matching/teachers/compare?childId=...&teacherIds=a,b — layar "Bandingkan Teacher" */
matchingRouter.get("/teachers/compare", requireRole("PARENT"), async (req, res) => {
  const q = parse(z.object({ childId: z.string(), teacherIds: z.string() }), req.query);
  const ids = q.teacherIds.split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length !== 2) throw new HttpError(400, "Pilih tepat 2 teacher untuk dibandingkan");
  const child = await loadOwnChild(req, q.childId);
  for (const id of ids) await loadVerifiedTeacher(req, id);

  const { cards } = await rankTeachers(child, { onlyIds: ids, waitAi: 8000 });
  const [a, b] = ids.map((id) => cards.find((c) => c.id === id)!);
  const best = a!.matchPercent === b!.matchPercent ? (a!.rating >= b!.rating ? a! : b!) : a!.matchPercent > b!.matchPercent ? a! : b!;
  const other = best === a ? b! : a!;
  const skills = childSkills(child);
  const edge = strongestDifference(skills, best.skills, other.skills);
  res.json({
    child: { id: child.id, name: child.name, skills: skills.map((s) => SKILL_KEY[s]) },
    teachers: [a, b],
    recommendedId: best.id,
    reason: `${best.name.split(",")[0]} lebih cocok untuk ${child.name} dengan kecocokan ${best.matchPercent}%, terutama di ${SKILL_LABEL[edge]}.`,
  });
});

// ===========================================================================
//  SHADOW TEACHER → mencari anak yang butuh pendamping
// ===========================================================================

async function loadVerifiedSelf(userId: string) {
  const profile = await prisma.teacherProfile.findUnique({ where: { userId }, include: TEACHER_INCLUDE });
  if (!profile) throw forbidden();
  if (profile.verificationStatus !== "VERIFIED") {
    throw new HttpError(403, "Profilmu belum terverifikasi. Lengkapi profil & dokumen, lalu tunggu verifikasi admin.");
  }
  return profile;
}

async function rankChildren(teacher: TeacherRow, opts: { onlyIds?: string[]; waitAi?: number } = {}) {
  const skipped = await prisma.matchSkip.findMany({ where: { actorId: teacher.userId }, select: { childId: true } });
  const applications = await prisma.application.findMany({
    where: { teacherUserId: teacher.userId },
    select: { childId: true, status: true, initiatedBy: true, id: true },
  });
  const appByChild = new Map(applications.map((a) => [a.childId, a]));

  const children = await prisma.child.findMany({
    where: {
      needs: { some: {} },
      parent: { isDemo: teacher.user.isDemo, isActive: true },
      ...(opts.onlyIds ? { id: { in: opts.onlyIds } } : { id: { notIn: skipped.map((s) => s.childId) } }),
    },
    include: CHILD_INCLUDE,
    take: 300,
  });

  const scored = children.map((c) => ({ c, ...pairScore(c, teacher) })).sort((a, b) => b.score - a.score);
  const top = opts.onlyIds ? scored : scored.slice(0, AI_CANDIDATES);
  const { insights, pending } = await getAiInsightsWithin(
    top.map((s) => ({ childId: s.c.id, teacherUserId: teacher.userId })),
    opts.waitAi ?? AI_WAIT_MS,
  );

  const cards = top
    .map(({ c, score, distance }) => {
      const child = presentChild(c);
      const ai = insights.get(`${c.id}:${teacher.userId}`);
      const app = appByChild.get(c.id);
      return {
        id: c.id,
        initials: initials(c.fullName), // nama lengkap disembunyikan sampai pengajuan diterima
        age: child.age,
        gender: c.gender,
        schoolLevel: c.schoolLevel,
        grade: child.grade,
        city: cityLabel(c.domicile ?? c.parent.domicile),
        distanceKm: distance,
        parent: c.parent.nickname ?? c.parent.fullName.split(" ")[0],
        needs: childSkills(c).map((s) => SKILL_KEY[s]), // = SeekingChild.needs di frontend
        needLabels: child.needs.map((n) => n.label),
        ruleScore: score,
        matchPercent: Math.min(99, blendScore(score, ai)),
        ai: aiView(ai),
        connected: Boolean(app),
        // permintaan dari orang tua yang menunggu jawaban teacher (layar "Permintaan")
        requestId: app && app.initiatedBy === "PARENT" && app.status === "PENDING" ? app.id : null,
      };
    })
    .sort((a, b) => b.matchPercent - a.matchPercent);
  return { cards, aiPending: pending };
}

async function childListResponse(teacher: TeacherRow) {
  const { cards, aiPending } = await rankChildren(teacher);
  return { matchCount: MATCH_COUNT, skipsLeft: await skipsLeft(teacher.userId), aiPending, cards: cards.slice(0, MATCH_COUNT) };
}

/** GET /api/matching/children — 5 anak paling cocok untuk teacher (data anak dianonimkan) */
matchingRouter.get("/children", requireRole("TEACHER"), async (req, res) => {
  res.json(await childListResponse(await loadVerifiedSelf(me(req).id)));
});

async function loadSeekingChild(req: Parameters<typeof me>[0], childId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId }, include: CHILD_INCLUDE });
  if (!child) throw notFound("Anak");
  await assertSameWorld(me(req), child.parent.isDemo, "Anak");
  return child;
}

/** POST /api/matching/children/:childId/skip — "Lewati" */
matchingRouter.post("/children/:childId/skip", requireRole("TEACHER"), async (req, res) => {
  const teacher = await loadVerifiedSelf(me(req).id);
  const child = await loadSeekingChild(req, param(req, "childId"));
  await useSkip(teacher.userId);
  await prisma.matchSkip.upsert({
    where: { actorId_childId_teacherUserId: { actorId: teacher.userId, childId: child.id, teacherUserId: teacher.userId } },
    create: { actorId: teacher.userId, childId: child.id, teacherUserId: teacher.userId },
    update: {},
  });
  res.json(await childListResponse(teacher));
});

/** POST /api/matching/children/:childId/connect { message? } — teacher menawarkan diri → chat terbuka */
matchingRouter.post("/children/:childId/connect", requireRole("TEACHER"), async (req, res) => {
  const body = parse(z.object({ message: z.string().trim().min(3).max(1000).optional() }), req.body ?? {});
  const teacher = await loadVerifiedSelf(me(req).id);
  const child = await loadSeekingChild(req, param(req, "childId"));

  const existing = await prisma.application.findUnique({
    where: { childId_teacherUserId: { childId: child.id, teacherUserId: teacher.userId } },
  });
  const convo = await ensureConversation("TEACHER", child.parentId, teacher.userId, child.id);
  if (existing && existing.status !== "REJECTED" && existing.status !== "CANCELLED") {
    return res.json({ application: existing, conversationId: convo.id, alreadyConnected: true });
  }

  const { score } = pairScore(child, teacher);
  const application = existing
    ? await prisma.application.update({
        where: { id: existing.id },
        data: { status: "PENDING", initiatedBy: "TEACHER", respondedAt: null, matchScore: score, createdAt: new Date() },
      })
    : await prisma.application.create({
        data: { childId: child.id, teacherUserId: teacher.userId, initiatedBy: "TEACHER", matchScore: score },
      });

  const c = presentChild(child);
  const parentName = child.parent.nickname ?? child.parent.fullName.split(" ")[0];
  const text =
    body.message ??
    `Halo ${parentName}! Saya ${displayName(teacher.user, teacher.title)}, shadow teacher ${(teacher.headline ?? "").toLowerCase() || "DUBIDU"}. Saya melihat profil ${initials(child.fullName)} (${c.age ?? "-"} tahun, ${c.needs.slice(0, 2).map((n) => n.label).join(" & ")}) dan tertarik untuk mendampingi. Boleh kita diskusi lebih lanjut?`;
  await sendMessage(convo.id, teacher.userId, { type: "TEXT", text });
  await notify({
    userId: child.parentId,
    category: "LAINNYA",
    icon: "star-four-points",
    tone: "yellow",
    title: "Shadow teacher menawarkan diri",
    body: `${displayName(teacher.user, teacher.title)} tertarik mendampingi ${child.name}. Cek profilnya dan balas lewat chat.`,
    tag: "Penawaran",
    action: "Buka Chat",
    link: `/chat/${convo.id}`,
  });
  res.status(201).json({ application, conversationId: convo.id, alreadyConnected: false });
});

/** GET /api/matching/children/compare?childIds=a,b — layar "Bandingkan Anak" */
matchingRouter.get("/children/compare", requireRole("TEACHER"), async (req, res) => {
  const q = parse(z.object({ childIds: z.string() }), req.query);
  const ids = q.childIds.split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length !== 2) throw new HttpError(400, "Pilih tepat 2 anak untuk dibandingkan");
  const teacher = await loadVerifiedSelf(me(req).id);
  for (const id of ids) await loadSeekingChild(req, id);
  const { cards } = await rankChildren(teacher, { onlyIds: ids, waitAi: 8000 });
  const [a, b] = ids.map((id) => cards.find((c) => c.id === id)!);
  const best = a!.matchPercent >= b!.matchPercent ? a! : b!;
  res.json({
    children: [a, b],
    recommendedId: best.id,
    reason: `${best.initials} paling sesuai dengan keahlianmu (kecocokan ${best.matchPercent}%).`,
  });
});
