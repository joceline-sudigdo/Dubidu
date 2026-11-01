import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";

import { config } from "../config.js";
import { prisma, type Prisma, type Skill } from "../db.js";
import { writeAudit } from "../lib/audit.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { CONTENT_DEFAULTS, getContentRow, getSettings, isContentKey, setContent } from "../lib/content.js";
import { HttpError, notFound, param, parse } from "../lib/http.js";
import { SKILL_KEY } from "../lib/matching.js";
import { notify } from "../lib/notify.js";
import { addPoints } from "../lib/points.js";
import { markPaid } from "./payments.js";
import { balanceOf } from "./payouts.js";
import { recomputeRating, skillLevelsSchema, toSkillLevels } from "./teachers.js";

// Semua endpoint web admin. Bentuk JSON mengikuti tipe di admin/src/types/*.
// Data anak, laporan perkembangan, hasil asesmen, dan isi chat sengaja TIDAK dikirim ke sini.
export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("ADMIN"));

const LIMIT = 200;
const ROLE_LABEL: Record<string, string> = { PARENT: "Orang Tua", TEACHER: "Shadow Teacher", PSYCHOLOGIST: "Psikolog", ADMIN: "Admin" };
/** Filter ?status= opsional yang hanya menerima nilai tertentu */
function optionalEnum<const T extends readonly [string, ...string[]]>(values: T, v: unknown): T[number] | undefined {
  return v ? (parse(z.enum(values), v) as T[number]) : undefined;
}

async function adminOf(req: Parameters<typeof me>[0]) {
  return prisma.user.findUniqueOrThrow({ where: { id: me(req).id }, select: { id: true, fullName: true } });
}

/** id → nama, untuk kolom "diproses oleh" */
async function namesOf(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (!unique.length) return new Map<string, string>();
  const rows = await prisma.user.findMany({ where: { id: { in: unique } }, select: { id: true, fullName: true } });
  return new Map(rows.map((u) => [u.id, u.fullName]));
}

// ---------------------------------------------------------------------------
//  Admin, statistik, audit log
// ---------------------------------------------------------------------------

/** GET /api/admin/me → AdminUser */
adminRouter.get("/me", async (req, res) => {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: me(req).id } });
  res.json({ id: u.id, role: "ADMIN", fullName: u.fullName, email: u.email, avatarUrl: u.avatarUrl, isActive: u.isActive, createdAt: u.createdAt });
});

/** GET /api/admin/stats?demo=true — angka agregat (default: user sungguhan saja) */
adminRouter.get("/stats", async (req, res) => {
  const isDemo = req.query.demo === "true";
  const now = new Date();
  const [parent, teacher, psychologist, suspended, plus, verification, payment, payout, report, paidByPurpose, fees, activeEngagements] =
    await Promise.all([
      prisma.user.count({ where: { role: "PARENT", isDemo } }),
      prisma.user.count({ where: { role: "TEACHER", isDemo } }),
      prisma.user.count({ where: { role: "PSYCHOLOGIST", isDemo } }),
      prisma.user.count({ where: { isActive: false, isDemo, role: { not: "ADMIN" } } }),
      prisma.user.count({ where: { isDemo, subscriptions: { some: { active: true, endsAt: { gt: now } } } } }),
      prisma.teacherProfile.count({ where: { verificationStatus: "PENDING", user: { isDemo } } }),
      prisma.payment.count({ where: { status: "VERIFYING", user: { isDemo } } }),
      prisma.payout.count({ where: { status: "PENDING", user: { isDemo } } }),
      prisma.contentReport.count({ where: { status: "OPEN", reporter: { isDemo } } }),
      prisma.payment.groupBy({ by: ["purpose"], where: { status: "PAID", user: { isDemo } }, _sum: { amount: true }, _count: true }),
      prisma.payment.aggregate({ where: { status: "PAID", user: { isDemo }, payeeUserId: { not: null } }, _sum: { amount: true, payeeAmount: true } }),
      prisma.engagement.count({ where: { status: "ACTIVE", parent: { isDemo } } }),
    ]);
  const sum = (purpose: string) => paidByPurpose.find((p) => p.purpose === purpose)?._sum.amount ?? 0;
  res.json({
    isDemo,
    users: { parent, teacher, psychologist, suspended, plus },
    queues: { verification, payment, payout, report },
    revenue: {
      paidTotal: paidByPurpose.reduce((s, p) => s + (p._sum.amount ?? 0), 0),
      paidCount: paidByPurpose.reduce((s, p) => s + p._count, 0),
      // biaya platform = selisih pembayaran dengan bagian teacher/psikolog
      platformFee: (fees._sum.amount ?? 0) - (fees._sum.payeeAmount ?? 0),
      subscription: sum("SUBSCRIPTION"),
    },
    activeEngagements,
  });
});

/** GET /api/admin/audit-logs?limit=50&q= */
adminRouter.get("/audit-logs", async (req, res) => {
  const { limit, q } = parse(z.object({ limit: z.coerce.number().int().min(1).max(500).default(50), q: z.string().trim().optional() }), req.query);
  const rows = await prisma.adminAuditLog.findMany({
    where: q
      ? { OR: [{ actorName: { contains: q, mode: "insensitive" } }, { targetLabel: { contains: q, mode: "insensitive" } }, { reason: { contains: q, mode: "insensitive" } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  res.json(rows);
});

/**
 * POST /api/admin/audit-logs { action, targetType, targetId?, targetLabel, reason?, ipAddress? }
 * Ditulis web admin setelah setiap aksi (ipAddress = IP browser admin, karena request datang dari server web admin).
 */
adminRouter.post("/audit-logs", async (req, res) => {
  const body = parse(
    z.object({
      action: z.string().regex(/^[A-Z_]{3,40}$/),
      targetType: z.string().regex(/^[A-Z_]{3,30}$/),
      targetId: z.string().max(100).nullable().optional(),
      targetLabel: z.string().max(300),
      reason: z.string().max(1000).nullable().optional(),
      ipAddress: z.string().max(60).nullable().optional(),
    }),
    req.body,
  );
  const admin = await adminOf(req);
  const log = await writeAudit(req, admin, body);
  if (body.ipAddress) await prisma.adminAuditLog.update({ where: { id: log.id }, data: { ipAddress: body.ipAddress } });
  res.status(201).json({ ...log, ipAddress: body.ipAddress ?? log.ipAddress });
});

// ---------------------------------------------------------------------------
//  Verifikasi shadow teacher (TeacherApplication)
// ---------------------------------------------------------------------------

const APPLICATION_INCLUDE = {
  user: true,
  documents: { orderBy: { createdAt: "asc" } },
  specializations: { include: { needOption: true } },
  skills: true,
  assessments: { where: { recommendation: { not: "pending" } }, include: { psychologist: true }, orderBy: { updatedAt: "desc" } },
} satisfies Prisma.TeacherProfileInclude;
type ApplicationRow = Prisma.TeacherProfileGetPayload<{ include: typeof APPLICATION_INCLUDE }>;

const DOC_LABEL: Record<string, string> = { KTP: "KTP", IJAZAH: "Ijazah", SERTIFIKAT: "Sertifikat", CV: "CV / Portofolio", LAINNYA: "Dokumen lain" };
const REQUIRED_DOCS = ["KTP", "IJAZAH", "SERTIFIKAT", "CV"] as const;

function presentApplication(t: ApplicationRow) {
  const review = t.assessments[0];
  const uploaded = t.documents.map((d) => ({ id: d.id, type: d.type, label: DOC_LABEL[d.type], url: d.url, status: d.status, note: d.note }));
  const missing = REQUIRED_DOCS.filter((type) => !t.documents.some((d) => d.type === type)).map((type) => ({
    id: `missing-${type}`,
    type,
    label: DOC_LABEL[type],
    url: null,
    status: "UNVERIFIED" as const,
    note: null,
  }));
  return {
    id: t.id,
    userId: t.userId,
    fullName: t.user.fullName,
    title: t.title,
    domicile: t.user.domicile ?? t.area ?? "-",
    education: t.education ?? "-",
    experienceYears: t.experienceYears,
    pricePerSession: t.pricePerSession,
    specializations: t.specializations.map((s) => s.needOption.label),
    bio: t.about ?? "",
    documents: [...uploaded, ...missing],
    // level keahlian: penilaian diri teacher vs nilai yang dipakai matching
    skillLevels: Object.fromEntries(t.skills.map((s) => [SKILL_KEY[s.skill], { self: s.selfLevel, level: s.level, adminAdjusted: s.adminAdjusted }])),
    psychologistReview: review
      ? {
          psychologistName: review.psychologist.fullName,
          recommendation: review.recommendation,
          issues: review.issues,
          note: review.note,
          interview: review.interview,
          reviewedAt: review.updatedAt,
        }
      : null,
    status: t.verificationStatus === "UNVERIFIED" ? "PENDING" : t.verificationStatus,
    decisionNote: t.decisionNote,
    decidedAt: t.decidedAt,
    submittedAt: t.submittedAt ?? t.createdAt,
    isDemo: t.user.isDemo,
  };
}

/** GET /api/admin/teacher-verifications?status=PENDING|REVISION|VERIFIED|REJECTED */
adminRouter.get("/teacher-verifications", async (req, res) => {
  const status = optionalEnum(["PENDING", "REVISION", "VERIFIED", "REJECTED"], req.query.status);
  const rows = await prisma.teacherProfile.findMany({
    // teacher yang belum mengunggah dokumen apa pun (UNVERIFIED) belum masuk antrian
    where: { verificationStatus: status ?? { not: "UNVERIFIED" } },
    include: APPLICATION_INCLUDE,
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
    take: LIMIT,
  });
  res.json(rows.map(presentApplication));
});

/** GET /api/admin/teacher-verifications/:id (id TeacherProfile) */
adminRouter.get("/teacher-verifications/:id", async (req, res) => {
  const row = await prisma.teacherProfile.findUnique({ where: { id: param(req, "id") }, include: APPLICATION_INCLUDE });
  if (!row) throw notFound("Pengajuan");
  res.json(presentApplication(row));
});

/** POST /api/admin/teacher-verifications/:id/decision { status: VERIFIED|REVISION|REJECTED, note } */
adminRouter.post("/teacher-verifications/:id/decision", async (req, res) => {
  const body = parse(z.object({ status: z.enum(["VERIFIED", "REVISION", "REJECTED"]), note: z.string().trim().max(1000).default("") }), req.body);
  const profile = await prisma.teacherProfile.findUnique({ where: { id: param(req, "id") }, include: { skills: true } });
  if (!profile) throw notFound("Pengajuan");
  if (body.status === "VERIFIED" && profile.skills.length === 0) {
    throw new HttpError(400, "Teacher belum mengisi level keahlian. Minta revisi agar teacher melengkapi profil dulu.");
  }
  if (body.status !== "VERIFIED" && body.note.length < 5) throw new HttpError(400, "Tulis catatan untuk teacher (minimal 5 karakter)");

  await prisma.teacherProfile.update({
    where: { id: profile.id },
    data: {
      verificationStatus: body.status,
      verifiedAt: body.status === "VERIFIED" ? new Date() : null,
      decisionNote: body.note || null,
      decidedAt: new Date(),
    },
  });
  await prisma.teacherDocument.updateMany({
    where: { teacherId: profile.id, status: { in: ["PENDING", "UNVERIFIED"] } },
    data: body.status === "VERIFIED" ? { status: "VERIFIED" } : { status: body.status === "REJECTED" ? "REJECTED" : "PENDING", note: body.note },
  });
  const copy = {
    VERIFIED: { icon: "check-decagram", tone: "green" as const, title: "Profilmu sudah terverifikasi ✅", body: "Selamat! Kamu sekarang bisa melihat dan mengajukan diri ke anak yang cocok." },
    REVISION: { icon: "file-document-edit", tone: "yellow" as const, title: "Data verifikasi perlu diperbaiki", body: `${body.note} Unggah ulang dokumen dari menu Profil.` },
    REJECTED: { icon: "alert-circle", tone: "red" as const, title: "Verifikasi profil ditolak", body: body.note },
  }[body.status];
  await notify({ userId: profile.userId, category: "LAINNYA", tag: "Verifikasi", ...copy });
  const row = await prisma.teacherProfile.findUniqueOrThrow({ where: { id: profile.id }, include: APPLICATION_INCLUDE });
  res.json(presentApplication(row));
});

/**
 * PATCH /api/admin/teachers/:userId/skills { skills: { speech: 80, ... } }
 * Admin menyesuaikan level keahlian setelah cek dokumen / interview. Nilai ini yang dipakai matching.
 */
adminRouter.patch("/teachers/:userId/skills", async (req, res) => {
  const { skills } = parse(z.object({ skills: skillLevelsSchema }), req.body);
  const profile = await prisma.teacherProfile.findUnique({ where: { userId: param(req, "userId") } });
  if (!profile) throw notFound("Profil teacher");
  for (const [skill, level] of Object.entries(toSkillLevels(skills))) {
    await prisma.teacherSkill.upsert({
      where: { teacherId_skill: { teacherId: profile.id, skill: skill as Skill } },
      create: { teacherId: profile.id, skill: skill as Skill, selfLevel: level, level, adminAdjusted: true },
      update: { level, adminAdjusted: true },
    });
  }
  const rows = await prisma.teacherSkill.findMany({ where: { teacherId: profile.id } });
  res.json(Object.fromEntries(rows.map((s) => [SKILL_KEY[s.skill], { self: s.selfLevel, level: s.level, adminAdjusted: s.adminAdjusted }])));
});

// ---------------------------------------------------------------------------
//  Pengguna (AppUser)
// ---------------------------------------------------------------------------

const USER_INCLUDE = {
  teacherProfile: true,
  psychologistProfile: true,
  subscriptions: { where: { active: true, endsAt: { gt: new Date(0) } }, select: { endsAt: true } },
  _count: { select: { engagementsAsParent: { where: { status: "ACTIVE" } }, engagementsAsTeacher: { where: { status: "ACTIVE" } } } },
} satisfies Prisma.UserInclude;
type UserRow = Prisma.UserGetPayload<{ include: typeof USER_INCLUDE }>;

function presentUser(u: UserRow) {
  const t = u.teacherProfile;
  const p = u.psychologistProfile;
  return {
    id: u.id,
    role: u.role,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    domicile: u.domicile,
    points: u.points,
    isActive: u.isActive,
    suspendedReason: u.suspendedReason,
    plusActive: u.subscriptions.some((s) => s.endsAt > new Date()),
    createdAt: u.createdAt,
    lastActiveAt: u.lastActiveAt,
    isDemo: u.isDemo,
    teacher: t
      ? { title: t.title, experienceYears: t.experienceYears, pricePerSession: t.pricePerSession, verificationStatus: t.verificationStatus, rating: t.rating, reviewCount: t.reviewCount }
      : undefined,
    psychologist: p
      ? {
          title: p.title,
          place: p.place,
          experienceYears: p.experienceYears,
          basePrice: p.basePrice,
          discountPercent: p.discountPercent,
          durationMinutes: p.durationMinutes,
          categories: p.categories,
          rating: p.rating,
          reviewCount: p.reviewCount,
        }
      : undefined,
    activeEngagements: u.role === "TEACHER" ? u._count.engagementsAsTeacher : u._count.engagementsAsParent,
  };
}

/** GET /api/admin/users?role=PARENT&q=devi&status=active|suspended&demo=true|false */
adminRouter.get("/users", async (req, res) => {
  const role = optionalEnum(["PARENT", "TEACHER", "PSYCHOLOGIST"], req.query.role);
  const status = optionalEnum(["active", "suspended"], req.query.status);
  const q = req.query.q ? String(req.query.q).trim() : undefined;
  const demo = req.query.demo === "true" ? true : req.query.demo === "false" ? false : undefined;
  const rows = await prisma.user.findMany({
    where: {
      role: role ?? { not: "ADMIN" },
      isDemo: demo,
      isActive: status ? status === "active" : undefined,
      ...(q
        ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }
        : {}),
    },
    include: USER_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: LIMIT,
  });
  res.json(rows.map(presentUser));
});

/** GET /api/admin/users/:id */
adminRouter.get("/users/:id", async (req, res) => {
  const row = await prisma.user.findFirst({ where: { id: param(req, "id"), role: { not: "ADMIN" } }, include: USER_INCLUDE });
  if (!row) throw notFound("Pengguna");
  res.json(presentUser(row));
});

/** PATCH /api/admin/users/:id/status { isActive, reason } — suspend / aktifkan akun */
adminRouter.patch("/users/:id/status", async (req, res) => {
  const body = parse(z.object({ isActive: z.boolean(), reason: z.string().trim().max(500).default("") }), req.body);
  if (!body.isActive && body.reason.length < 5) throw new HttpError(400, "Tulis alasan menonaktifkan akun (minimal 5 karakter)");
  const target = await prisma.user.findFirst({ where: { id: param(req, "id"), role: { not: "ADMIN" } } });
  if (!target) throw notFound("Pengguna");
  await prisma.user.update({
    where: { id: target.id },
    data: { isActive: body.isActive, suspendedReason: body.isActive ? null : body.reason },
  });
  // akun nonaktif tidak menerima push lagi
  if (!body.isActive) await prisma.deviceToken.deleteMany({ where: { userId: target.id } });
  const row = await prisma.user.findUniqueOrThrow({ where: { id: target.id }, include: USER_INCLUDE });
  res.json(presentUser(row));
});

const psySchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(9).optional(),
  // kosong = dibuatkan kata sandi sementara
  password: z.string().min(8).optional(),
  title: z.string().trim().min(2),
  place: z.string().trim().optional(),
  experienceYears: z.number().int().min(0).default(0),
  badge: z.string().optional(),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  basePrice: z.number().int().positive(),
  discountPercent: z.number().int().min(0).max(100).default(0),
  durationMinutes: z.number().int().positive().default(45),
});

/** POST /api/admin/psychologists → { user: AppUser, tempPassword } — psikolog tidak bisa daftar sendiri */
adminRouter.post("/psychologists", async (req, res) => {
  const { fullName, email, phone, password, ...profile } = parse(psySchema, req.body);
  const normalizedEmail = email.toLowerCase();
  const normalizedPhone = phone?.replace(/[^\d+]/g, "").replace(/^\+62/, "0");
  if (await prisma.user.findFirst({ where: { email: normalizedEmail } })) throw new HttpError(409, "Email sudah terdaftar.");
  if (normalizedPhone && (await prisma.user.findFirst({ where: { phone: normalizedPhone } }))) throw new HttpError(409, "Nomor HP sudah terdaftar.");
  const tempPassword = password ?? `Dbd-${randomBytes(4).toString("hex")}`;
  const user = await prisma.user.create({
    data: {
      role: "PSYCHOLOGIST",
      fullName,
      nickname: fullName.split(" ")[0],
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash: await bcrypt.hash(tempPassword, 10),
      psychologistProfile: { create: profile },
    },
    include: USER_INCLUDE,
  });
  res.status(201).json({ user: presentUser(user), tempPassword });
});

// ---------------------------------------------------------------------------
//  Pembayaran (bukti transfer manual) & tujuan transfer
// ---------------------------------------------------------------------------

const PAYMENT_INCLUDE = { user: { select: { fullName: true, isDemo: true } }, manualMethod: true } satisfies Prisma.PaymentInclude;
type PaymentRow = Prisma.PaymentGetPayload<{ include: typeof PAYMENT_INCLUDE }>;

/** Deskripsi pembayaran tanpa nama anak: "Konsultasi Amanda Putri", "Fee pendampingan Pras Karunia" */
async function presentPayments(rows: PaymentRow[]) {
  const consultIds = rows.filter((p) => p.purpose === "CONSULTATION").map((p) => p.referenceId);
  const subIds = rows.filter((p) => p.purpose === "SUBSCRIPTION").map((p) => p.referenceId);
  const [consults, subs, names] = await Promise.all([
    prisma.consultation.findMany({ where: { id: { in: consultIds } }, select: { id: true, psychologist: { select: { user: { select: { fullName: true } } } } } }),
    prisma.subscription.findMany({ where: { id: { in: subIds } }, select: { id: true, plan: true } }),
    namesOf(rows.flatMap((p) => [p.payeeUserId, p.verifiedById])),
  ]);
  return rows.map((p) => {
    let description = "Pembayaran DUBIDU";
    if (p.purpose === "CONSULTATION") description = `Konsultasi ${consults.find((c) => c.id === p.referenceId)?.psychologist.user.fullName ?? "psikolog"}`;
    if (p.purpose === "ENGAGEMENT") description = `Fee pendampingan ${names.get(p.payeeUserId ?? "") ?? "shadow teacher"}`;
    if (p.purpose === "SUBSCRIPTION") description = `Dubidu Plus ${subs.find((s) => s.id === p.referenceId)?.plan === "YEARLY" ? "Tahunan" : "Bulanan"}`;
    return {
      id: p.id,
      invoiceNo: p.invoiceNo,
      userId: p.userId,
      userName: p.user.fullName,
      purpose: p.purpose,
      description,
      amount: p.amount,
      uniqueCode: p.uniqueCode,
      amountDue: p.amountDue,
      status: p.status,
      method: p.method,
      manualMethodId: p.manualMethodId,
      manualMethodLabel: p.manualMethod?.label ?? null,
      proofUrl: p.proofUrl,
      proofSenderName: p.proofSenderName,
      proofNote: p.proofNote,
      proofSubmittedAt: p.proofSubmittedAt,
      verifiedByName: p.verifiedById ? (names.get(p.verifiedById) ?? null) : null,
      verifiedAt: p.verifiedAt,
      rejectReason: p.rejectReason,
      createdAt: p.createdAt,
      isDemo: p.user.isDemo,
    };
  });
}

/** GET /api/admin/payments?status=VERIFYING — bukti terbaru di atas */
adminRouter.get("/payments", async (req, res) => {
  const status = optionalEnum(["PENDING", "VERIFYING", "PAID", "FAILED", "EXPIRED"], req.query.status);
  const rows = await prisma.payment.findMany({
    where: { status },
    include: PAYMENT_INCLUDE,
    orderBy: [{ proofSubmittedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take: LIMIT,
  });
  res.json(await presentPayments(rows));
});

/** GET /api/admin/payments/:id */
adminRouter.get("/payments/:id", async (req, res) => {
  const row = await prisma.payment.findUnique({ where: { id: param(req, "id") }, include: PAYMENT_INCLUDE });
  if (!row) throw notFound("Pembayaran");
  res.json((await presentPayments([row]))[0]);
});

/**
 * POST /api/admin/payments/:id/confirm
 * Admin SUDAH mengecek mutasi GoPay/bank: ada dana masuk sebesar amountDue.
 * → status PAID + semua efek (konsultasi terkonfirmasi, Plus aktif, notifikasi).
 */
adminRouter.post("/payments/:id/confirm", async (req, res) => {
  const p = await prisma.payment.findUnique({ where: { id: param(req, "id") }, include: { manualMethod: true } });
  if (!p) throw notFound("Pembayaran");
  if (p.status === "PAID") throw new HttpError(409, "Pembayaran ini sudah lunas");
  if (p.status !== "VERIFYING" && p.status !== "PENDING") throw new HttpError(409, `Status ${p.status} tidak bisa dikonfirmasi`);
  await prisma.payment.update({ where: { id: p.id }, data: { verifiedById: me(req).id, verifiedAt: new Date(), rejectReason: null } });
  const method = p.manualMethod ? `manual-${p.manualMethod.type.toLowerCase()}` : "manual";
  await markPaid(p.id, method, { paymentType: p.manualMethod?.type.toLowerCase() });
  const row = await prisma.payment.findUniqueOrThrow({ where: { id: p.id }, include: PAYMENT_INCLUDE });
  res.json((await presentPayments([row]))[0]);
});

/** POST /api/admin/payments/:id/reject { reason } — bukti tidak sesuai → user diminta upload ulang */
adminRouter.post("/payments/:id/reject", async (req, res) => {
  const { reason } = parse(z.object({ reason: z.string().trim().min(5, "Tulis alasan penolakan").max(300) }), req.body);
  const p = await prisma.payment.findUnique({ where: { id: param(req, "id") } });
  if (!p) throw notFound("Pembayaran");
  if (p.status !== "VERIFYING") throw new HttpError(409, "Pembayaran ini tidak sedang menunggu konfirmasi.");
  await prisma.payment.update({
    where: { id: p.id },
    data: {
      status: "PENDING",
      rejectReason: reason,
      verifiedById: me(req).id,
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + config.manualPaymentExpiryMinutes * 60000), // waktu untuk upload ulang
    },
  });
  await notify({
    userId: p.userId,
    category: "BOOKING",
    icon: "alert-circle",
    tone: "red",
    title: "Bukti transfer perlu diperbaiki",
    body: `${reason}. Silakan upload ulang bukti transfer.`,
    tag: `Invoice #${p.invoiceNo}`,
    action: "Upload Ulang",
    link: `/pembayaran/${p.id}`,
  });
  const row = await prisma.payment.findUniqueOrThrow({ where: { id: p.id }, include: PAYMENT_INCLUDE });
  res.json((await presentPayments([row]))[0]);
});

const methodSchema = z
  .object({
    type: z.enum(["QRIS", "BANK_TRANSFER"]),
    label: z.string().trim().min(2).max(60),
    accountName: z.string().trim().min(2).max(100),
    bankName: z.string().trim().max(40).nullable().optional(),
    accountNumber: z.string().trim().regex(/^[0-9 -]{5,30}$/, "Nomor rekening hanya angka").nullable().optional(),
    // URL gambar QRIS (unggah dulu lewat POST /api/uploads?folder=qris)
    qrImageUrl: z.string().trim().min(1).nullable().optional(),
    instructions: z.string().max(500).nullable().optional(),
    active: z.boolean().default(true),
    order: z.number().int().optional(),
  })
  .refine((m) => (m.type === "QRIS" ? Boolean(m.qrImageUrl) : Boolean(m.bankName && m.accountNumber)), {
    message: "QRIS wajib gambar QR; transfer bank wajib nama bank & nomor rekening",
  });

/** GET /api/admin/payment-methods */
adminRouter.get("/payment-methods", async (_req, res) => {
  res.json(await prisma.paymentMethod.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }));
});

/** POST /api/admin/payment-methods — tambah QRIS GoPay / rekening bank */
adminRouter.post("/payment-methods", async (req, res) => {
  const data = parse(methodSchema, req.body);
  const order = data.order ?? (await prisma.paymentMethod.count()) + 1;
  res.status(201).json(await prisma.paymentMethod.create({ data: { ...data, order } }));
});

/** PATCH /api/admin/payment-methods/:id */
adminRouter.patch("/payment-methods/:id", async (req, res) => {
  const current = await prisma.paymentMethod.findUnique({ where: { id: param(req, "id") } });
  if (!current) throw notFound("Metode pembayaran");
  const { id: _id, createdAt: _c, ...base } = current;
  const merged = parse(methodSchema, { ...base, ...req.body });
  res.json(await prisma.paymentMethod.update({ where: { id: current.id }, data: merged }));
});

/** DELETE /api/admin/payment-methods/:id — dinonaktifkan (riwayat pembayaran tetap utuh) */
adminRouter.delete("/payment-methods/:id", async (req, res) => {
  await prisma.paymentMethod.update({ where: { id: param(req, "id") }, data: { active: false } });
  res.status(204).end();
});

// ---------------------------------------------------------------------------
//  Pencairan dana (Payout)
// ---------------------------------------------------------------------------

const PAYOUT_INCLUDE = { user: { select: { fullName: true, role: true, isDemo: true } } } satisfies Prisma.PayoutInclude;
type PayoutRow = Prisma.PayoutGetPayload<{ include: typeof PAYOUT_INCLUDE }>;

async function presentPayouts(rows: PayoutRow[]) {
  const names = await namesOf(rows.map((p) => p.processedById));
  return rows.map((p) => ({
    id: p.id,
    userId: p.userId,
    userName: p.user.fullName,
    role: p.user.role,
    amount: p.amount,
    fee: p.fee,
    bankName: p.bankName,
    // nomor lengkap dibutuhkan admin untuk mentransfer, versi tersamar untuk tabel
    accountNumber: p.accountNumber,
    accountNumberMasked: `•••• ${p.accountNumber.slice(-4)}`,
    accountName: p.accountName,
    status: p.status,
    availableBalance: p.availableBalance,
    transferRef: p.transferRef,
    rejectReason: p.rejectReason,
    processedByName: p.processedById ? (names.get(p.processedById) ?? null) : null,
    processedAt: p.processedAt,
    requestedAt: p.createdAt,
    isDemo: p.user.isDemo,
  }));
}

/** GET /api/admin/payouts?status=PENDING */
adminRouter.get("/payouts", async (req, res) => {
  const status = optionalEnum(["PENDING", "TRANSFERRED", "REJECTED"], req.query.status);
  const rows = await prisma.payout.findMany({ where: { status }, include: PAYOUT_INCLUDE, orderBy: { createdAt: "desc" }, take: LIMIT });
  res.json(await presentPayouts(rows));
});

/** POST /api/admin/payouts/:id/transfer { transferRef } — admin sudah mentransfer manual ke rekening user */
adminRouter.post("/payouts/:id/transfer", async (req, res) => {
  const { transferRef } = parse(z.object({ transferRef: z.string().trim().min(3, "Isi nomor referensi transfer").max(100) }), req.body);
  const p = await prisma.payout.findUnique({ where: { id: param(req, "id") } });
  if (!p) throw notFound("Pencairan");
  if (p.status !== "PENDING") throw new HttpError(409, "Pencairan ini sudah diproses.");
  // saldo saat ini sudah dikurangi pencairan ini sendiri (PENDING), jadi tidak boleh minus
  const balance = await balanceOf(p.userId);
  if (balance.available < 0) throw new HttpError(409, "Saldo pengguna tidak cukup untuk pencairan ini.");
  await prisma.payout.update({ where: { id: p.id }, data: { status: "TRANSFERRED", transferRef, processedById: me(req).id, processedAt: new Date() } });
  await notify({
    userId: p.userId,
    category: "LAINNYA",
    icon: "bank-check",
    tone: "green",
    title: "Pencairan dana berhasil",
    body: `Rp${(p.amount - p.fee).toLocaleString("id-ID")} sudah ditransfer ke ${p.bankName} •••• ${p.accountNumber.slice(-4)}.`,
    tag: "Pencairan",
  });
  const row = await prisma.payout.findUniqueOrThrow({ where: { id: p.id }, include: PAYOUT_INCLUDE });
  res.json((await presentPayouts([row]))[0]);
});

/** POST /api/admin/payouts/:id/reject { reason } — saldo otomatis kembali ke user */
adminRouter.post("/payouts/:id/reject", async (req, res) => {
  const { reason } = parse(z.object({ reason: z.string().trim().min(5, "Tulis alasan penolakan").max(300) }), req.body);
  const p = await prisma.payout.findUnique({ where: { id: param(req, "id") } });
  if (!p) throw notFound("Pencairan");
  if (p.status !== "PENDING") throw new HttpError(409, "Pencairan ini sudah diproses.");
  await prisma.payout.update({ where: { id: p.id }, data: { status: "REJECTED", rejectReason: reason, processedById: me(req).id, processedAt: new Date() } });
  await notify({
    userId: p.userId,
    category: "LAINNYA",
    icon: "bank-remove",
    tone: "red",
    title: "Pencairan dana ditolak",
    body: `${reason}. Saldo sudah dikembalikan, silakan ajukan ulang.`,
    tag: "Pencairan",
  });
  const row = await prisma.payout.findUniqueOrThrow({ where: { id: p.id }, include: PAYOUT_INCLUDE });
  res.json((await presentPayouts([row]))[0]);
});

// ---------------------------------------------------------------------------
//  Moderasi: laporan, postingan & komentar, ulasan
// ---------------------------------------------------------------------------

/** GET /api/admin/reports?status=OPEN */
adminRouter.get("/reports", async (req, res) => {
  const status = optionalEnum(["OPEN", "RESOLVED", "DISMISSED"], req.query.status);
  const rows = await prisma.contentReport.findMany({ where: { status }, include: { reporter: { select: { fullName: true } } }, orderBy: { createdAt: "desc" }, take: LIMIT });
  const names = await namesOf(rows.flatMap((r) => [r.targetUserId, r.handledById]));
  res.json(
    rows.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      targetLabel: r.targetLabel,
      targetUserId: r.targetUserId,
      targetUserName: r.targetUserId ? (names.get(r.targetUserId) ?? null) : null,
      reporterName: r.reporter.fullName,
      reason: r.reason,
      detail: r.detail,
      status: r.status,
      resolution: r.resolution,
      handledByName: r.handledById ? (names.get(r.handledById) ?? null) : null,
      handledAt: r.handledAt,
      createdAt: r.createdAt,
    })),
  );
});

/** POST /api/admin/reports/:id/resolve { status: RESOLVED|DISMISSED, resolution } */
adminRouter.post("/reports/:id/resolve", async (req, res) => {
  const body = parse(z.object({ status: z.enum(["RESOLVED", "DISMISSED"]), resolution: z.string().trim().max(1000).default("") }), req.body);
  const r = await prisma.contentReport.update({
    where: { id: param(req, "id") },
    data: { status: body.status, resolution: body.resolution || null, handledById: me(req).id, handledAt: new Date() },
  });
  res.json(r);
});

const POST_INCLUDE = {
  author: { select: { fullName: true, nickname: true, role: true } },
  comments: { include: { author: { select: { fullName: true, nickname: true, role: true } } }, orderBy: { createdAt: "asc" } },
  _count: { select: { likes: true } },
} satisfies Prisma.CommunityPostInclude;
type PostRow = Prisma.CommunityPostGetPayload<{ include: typeof POST_INCLUDE }>;

async function presentPosts(rows: PostRow[]) {
  const reports = await prisma.contentReport.groupBy({ by: ["targetId"], where: { targetType: "POST", targetId: { in: rows.map((p) => p.id) } }, _count: true });
  return rows.map((p) => ({
    id: p.id,
    authorId: p.authorId,
    authorName: p.author.fullName,
    authorRole: ROLE_LABEL[p.author.role],
    topic: p.topic,
    text: p.text,
    photoCount: p.photos.length,
    likeCount: p._count.likes,
    comments: p.comments.map((c) => ({ id: c.id, authorName: c.author.fullName, authorRole: ROLE_LABEL[c.author.role], text: c.text, status: c.status, createdAt: c.createdAt })),
    status: p.status,
    hiddenReason: p.hiddenReason,
    reportCount: reports.find((r) => r.targetId === p.id)?._count ?? 0,
    createdAt: p.createdAt,
  }));
}

/** GET /api/admin/community/posts?status=VISIBLE|HIDDEN */
adminRouter.get("/community/posts", async (req, res) => {
  const status = optionalEnum(["VISIBLE", "HIDDEN"], req.query.status);
  const rows = await prisma.communityPost.findMany({ where: { status }, include: POST_INCLUDE, orderBy: { createdAt: "desc" }, take: LIMIT });
  res.json(await presentPosts(rows));
});

/** GET /api/admin/community/posts/:id */
adminRouter.get("/community/posts/:id", async (req, res) => {
  const row = await prisma.communityPost.findUnique({ where: { id: param(req, "id") }, include: POST_INCLUDE });
  if (!row) throw notFound("Postingan");
  res.json((await presentPosts([row]))[0]);
});

/** PATCH /api/admin/community/posts/:id { status, reason } */
adminRouter.patch("/community/posts/:id", async (req, res) => {
  const body = parse(z.object({ status: z.enum(["VISIBLE", "HIDDEN"]), reason: z.string().trim().max(500).nullable().optional() }), req.body);
  const post = await prisma.communityPost.update({
    where: { id: param(req, "id") },
    data: { status: body.status, hiddenReason: body.status === "HIDDEN" ? (body.reason ?? null) : null },
    include: POST_INCLUDE,
  });
  if (body.status === "HIDDEN") {
    await notify({
      userId: post.authorId,
      category: "LAINNYA",
      icon: "eye-off",
      tone: "gray",
      title: "Postinganmu disembunyikan",
      body: `Postingan di komunitas ${post.topic} disembunyikan admin${body.reason ? `: ${body.reason}` : "."}`,
      tag: "Komunitas",
    });
  }
  res.json((await presentPosts([post]))[0]);
});

/** GET /api/admin/community/comments/:id → { postId } (dipakai dari halaman laporan) */
adminRouter.get("/community/comments/:id", async (req, res) => {
  const c = await prisma.postComment.findUnique({ where: { id: param(req, "id") }, select: { id: true, postId: true } });
  if (!c) throw notFound("Komentar");
  res.json(c);
});

/** PATCH /api/admin/community/comments/:id { status } */
adminRouter.patch("/community/comments/:id", async (req, res) => {
  const { status } = parse(z.object({ status: z.enum(["VISIBLE", "HIDDEN"]) }), req.body);
  const c = await prisma.postComment.update({ where: { id: param(req, "id") }, data: { status }, include: { author: { select: { fullName: true, role: true } } } });
  res.json({ id: c.id, authorName: c.author.fullName, authorRole: ROLE_LABEL[c.author.role], text: c.text, status: c.status, createdAt: c.createdAt });
});

const REVIEW_INCLUDE = { author: { select: { fullName: true } }, target: { select: { fullName: true, role: true } } } satisfies Prisma.ReviewInclude;
const presentReview = (r: Prisma.ReviewGetPayload<{ include: typeof REVIEW_INCLUDE }>) => ({
  id: r.id,
  authorName: r.author.fullName,
  targetUserId: r.targetUserId,
  targetName: r.target.fullName,
  targetRole: r.target.role,
  rating: r.rating,
  comment: r.comment,
  status: r.status,
  hiddenReason: r.hiddenReason,
  createdAt: r.createdAt,
});

/** GET /api/admin/reviews?status=VISIBLE|HIDDEN */
adminRouter.get("/reviews", async (req, res) => {
  const status = optionalEnum(["VISIBLE", "HIDDEN"], req.query.status);
  const rows = await prisma.review.findMany({ where: { status }, include: REVIEW_INCLUDE, orderBy: { createdAt: "desc" }, take: LIMIT });
  res.json(rows.map(presentReview));
});

/** PATCH /api/admin/reviews/:id { status, reason } — rating teacher/psikolog dihitung ulang */
adminRouter.patch("/reviews/:id", async (req, res) => {
  const body = parse(z.object({ status: z.enum(["VISIBLE", "HIDDEN"]), reason: z.string().trim().max(500).nullable().optional() }), req.body);
  const r = await prisma.review.update({
    where: { id: param(req, "id") },
    data: { status: body.status, hiddenReason: body.status === "HIDDEN" ? (body.reason ?? null) : null },
    include: REVIEW_INCLUDE,
  });
  await recomputeRating(r.targetUserId);
  res.json(presentReview(r));
});

// ---------------------------------------------------------------------------
//  Konten (legal, FAQ, Doobie, rewards, paket Plus, promo, pengaturan) & voucher
// ---------------------------------------------------------------------------

/** GET /api/admin/content/:key → { key, value, version, updatedAt, updatedByName } */
adminRouter.get("/content/:key", async (req, res) => {
  const key = param(req, "key");
  if (!isContentKey(key)) throw notFound("Konten");
  const row = await getContentRow(key);
  const names = await namesOf([row.updatedById]);
  res.json({ ...row, updatedByName: row.updatedById ? (names.get(row.updatedById) ?? null) : null });
});

// validasi ringan per jenis konten (bentuk lengkap mengikuti admin/src/types/content.ts)
const contentSchemas = {
  "legal.terms": z.object({ type: z.literal("terms"), title: z.string().min(2), sections: z.array(z.object({ h: z.string().min(1), p: z.string().min(1) })).min(1) }),
  "legal.privacy": z.object({ type: z.literal("privacy"), title: z.string().min(2), sections: z.array(z.object({ h: z.string().min(1), p: z.string().min(1) })).min(1) }),
  faqs: z.array(z.object({ id: z.string(), question: z.string().min(3), answer: z.string().min(3), category: z.string(), order: z.number().int(), published: z.boolean() })),
  doobieTopics: z.array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), role: z.enum(["parent", "teacher"]), label: z.string().min(2), question: z.string().min(3), answer: z.array(z.string()).min(1), order: z.number().int() })),
  rewards: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["parent", "teacher"]),
      title: z.string().min(2),
      subtitle: z.string(),
      cost: z.number().int().positive(),
      category: z.enum(["Voucher", "Cashback", "Kesehatan"]),
      icon: z.string(),
      minLevel: z.number().int().nullable(),
      stock: z.number().int().min(0).nullable(),
      active: z.boolean(),
    }),
  ),
  missions: z.array(z.object({ id: z.string(), role: z.enum(["parent", "teacher"]), title: z.string().min(2), subtitle: z.string(), reward: z.number().int().min(0), actionLabel: z.string(), active: z.boolean() })),
  levels: z.array(z.object({ level: z.number().int().min(1), name: z.string().min(1), min: z.number().int().min(0), perk: z.string().nullable() })).min(1),
  plans: z.array(z.object({ role: z.enum(["parent", "teacher"]), key: z.enum(["bulanan", "tahunan"]), title: z.string(), price: z.number().int().positive(), note: z.string(), badge: z.string().nullable() })),
  promos: z.array(
    z.object({
      code: z.string().regex(/^[A-Z0-9]{3,20}$/, "Kode promo hanya huruf besar & angka"),
      discountPercent: z.number().int().min(1).max(100),
      appliesTo: z.enum(["CONSULTATION", "SUBSCRIPTION", "ALL"]),
      active: z.boolean(),
      usageCount: z.number().int().min(0),
      expiresAt: z.string().nullable(),
    }),
  ),
  settings: z.object({
    platformFeePercent: z.number().min(0).max(50),
    plusPlatformFeePercent: z.number().min(0).max(50),
    payoutFee: z.number().int().min(0),
    minPayout: z.number().int().min(0),
  }),
} satisfies Record<keyof typeof CONTENT_DEFAULTS, z.ZodType>;

/** PUT /api/admin/content/:key { value } — ganti seluruh isi konten (versi naik 1) */
adminRouter.put("/content/:key", async (req, res) => {
  const key = param(req, "key");
  if (!isContentKey(key)) throw notFound("Konten");
  const { value } = parse(z.object({ value: contentSchemas[key] }), req.body);
  await setContent(key, value as never, me(req).id);
  const row = await getContentRow(key);
  res.json({ ...row, updatedByName: (await adminOf(req)).fullName });
});

/** GET /api/admin/redemptions — voucher yang sudah ditukar */
adminRouter.get("/redemptions", async (_req, res) => {
  const rows = await prisma.redemption.findMany({ include: { user: { select: { fullName: true, role: true } } }, orderBy: { createdAt: "desc" }, take: LIMIT });
  res.json(
    rows.map((r) => ({
      id: r.id,
      rewardId: r.rewardId,
      rewardTitle: r.rewardTitle,
      userName: r.user.fullName,
      role: r.user.role === "TEACHER" ? "teacher" : "parent",
      code: r.code,
      cost: r.cost,
      status: r.status,
      redeemedAt: r.createdAt,
      expiresAt: r.expiresAt,
    })),
  );
});

/** POST /api/admin/redemptions/:id/cancel — batalkan voucher aktif, Madu dikembalikan */
adminRouter.post("/redemptions/:id/cancel", async (req, res) => {
  const r = await prisma.redemption.findUnique({ where: { id: param(req, "id") } });
  if (!r) throw notFound("Voucher");
  if (r.status !== "ACTIVE") throw new HttpError(409, "Voucher ini sudah tidak aktif.");
  const updated = await prisma.$transaction(async (tx) => {
    await addPoints(tx, r.userId, r.cost, `redeem-cancel:${r.rewardId}`);
    return tx.redemption.update({ where: { id: r.id }, data: { status: "CANCELLED" } });
  });
  res.json(updated);
});

// ---------------------------------------------------------------------------
//  Daftar operasional lain (konsultasi & kontrak), tanpa isi laporan anak
// ---------------------------------------------------------------------------

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** GET /api/admin/consultations?status=CONFIRMED&page=1 */
adminRouter.get("/consultations", async (req, res) => {
  const { page, pageSize } = parse(pageQuery, req.query);
  const status = optionalEnum(["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED"], req.query.status);
  const [total, rows] = await Promise.all([
    prisma.consultation.count({ where: { status } }),
    prisma.consultation.findMany({
      where: { status },
      include: { parent: { select: { fullName: true } }, psychologist: { include: { user: { select: { fullName: true } } } } },
      orderBy: { scheduledAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  res.json({
    total,
    page,
    pageSize,
    items: rows.map((c) => ({
      id: c.id,
      status: c.status,
      type: c.type,
      scheduledAt: c.scheduledAt,
      parentName: c.parent.fullName,
      psychologistName: c.psychologist.user.fullName,
      finalPrice: c.finalPrice,
    })),
  });
});

/** GET /api/admin/engagements?status=ACTIVE&page=1 */
adminRouter.get("/engagements", async (req, res) => {
  const { page, pageSize } = parse(pageQuery, req.query);
  const status = optionalEnum(["ACTIVE", "COMPLETED", "CANCELLED"], req.query.status);
  const [total, rows] = await Promise.all([
    prisma.engagement.count({ where: { status } }),
    prisma.engagement.findMany({
      where: { status },
      include: { teacher: { select: { fullName: true } }, parent: { select: { fullName: true } }, _count: { select: { sessions: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  res.json({
    total,
    page,
    pageSize,
    items: rows.map((e) => ({
      id: e.id,
      status: e.status,
      parentName: e.parent.fullName,
      teacherName: e.teacher.fullName,
      ratePerSession: e.ratePerSession,
      sessions: e._count.sessions,
      createdAt: e.createdAt,
    })),
  });
});

/** Biaya platform & minimal pencairan yang berlaku (ringkasan untuk header halaman) */
adminRouter.get("/settings", async (_req, res) => {
  res.json(await getSettings());
});

