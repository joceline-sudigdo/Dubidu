import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";

import { config } from "../config.js";
import { prisma, type Skill } from "../db.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { HttpError, notFound, param, parse } from "../lib/http.js";
import { notify } from "../lib/notify.js";
import { SKILL_KEY } from "../lib/matching.js";
import { publicUser } from "../lib/present.js";
import { markPaid } from "./payments.js";
import { skillLevelsSchema, toSkillLevels } from "./teachers.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("ADMIN"));

/** GET /api/admin/stats */
/** GET /api/admin/stats?demo=false — angka user sungguhan (default); demo=true untuk data demo */
adminRouter.get("/stats", async (req, res) => {
  const isDemo = req.query.demo === "true";
  const [parents, teachers, psychologists, children, pendingTeachers, engagements, consultations, demoUsers] = await Promise.all([
    prisma.user.count({ where: { role: "PARENT", isDemo } }),
    prisma.user.count({ where: { role: "TEACHER", isDemo } }),
    prisma.user.count({ where: { role: "PSYCHOLOGIST", isDemo } }),
    prisma.child.count({ where: { parent: { isDemo } } }),
    prisma.teacherProfile.count({ where: { verificationStatus: "PENDING", user: { isDemo } } }),
    prisma.engagement.count({ where: { status: "ACTIVE", parent: { isDemo } } }),
    prisma.consultation.count({ where: { parent: { isDemo } } }),
    prisma.user.count({ where: { isDemo: true } }),
  ]);
  res.json({ isDemo, parents, teachers, psychologists, children, pendingTeachers, engagements, consultations, demoUsers });
});

/** GET /api/admin/teachers?status=PENDING — antrian verifikasi */
adminRouter.get("/teachers", async (req, res) => {
  const status = req.query.status
    ? parse(z.enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"]), req.query.status)
    : undefined;
  const rows = await prisma.teacherProfile.findMany({
    where: { verificationStatus: status },
    include: { user: true, documents: true, specializations: { include: { needOption: true } }, skills: true },
    orderBy: { updatedAt: "desc" },
  });
  res.json(
    rows.map((t) => ({
      ...t,
      user: publicUser(t.user),
      // level dari teacher (self) vs yang dipakai matching (level) — untuk dicek admin
      skillLevels: Object.fromEntries(t.skills.map((s) => [SKILL_KEY[s.skill], { self: s.selfLevel, level: s.level, adminAdjusted: s.adminAdjusted }])),
    })),
  );
});

/** PATCH /api/admin/teachers/:userId/verification { status: VERIFIED|REJECTED, note? } */
adminRouter.patch("/teachers/:userId/verification", async (req, res) => {
  const body = parse(z.object({ status: z.enum(["VERIFIED", "REJECTED"]), note: z.string().optional() }), req.body);
  const profile = await prisma.teacherProfile.findUnique({ where: { userId: param(req, "userId") }, include: { skills: true } });
  if (!profile) throw notFound("Profil teacher");
  if (body.status === "VERIFIED" && profile.skills.length === 0) {
    throw new HttpError(400, "Teacher belum mengisi level keahlian. Minta teacher melengkapi profil dulu.");
  }
  const updated = await prisma.teacherProfile.update({
    where: { id: profile.id },
    data: { verificationStatus: body.status, verifiedAt: body.status === "VERIFIED" ? new Date() : null },
  });
  await prisma.teacherDocument.updateMany({
    where: { teacherId: profile.id, status: "PENDING" },
    data: { status: body.status, note: body.note },
  });
  await notify({
    userId: param(req, "userId"),
    category: "LAINNYA",
    icon: body.status === "VERIFIED" ? "check-decagram" : "alert-circle",
    tone: body.status === "VERIFIED" ? "green" : "red",
    title: body.status === "VERIFIED" ? "Profilmu sudah terverifikasi ✅" : "Verifikasi profil ditolak",
    body:
      body.status === "VERIFIED"
        ? "Selamat! Kamu sekarang bisa melihat dan mengajukan diri ke anak yang cocok."
        : `Dokumen perlu diperbaiki. ${body.note ?? "Silakan upload ulang dokumen pendukung."}`,
    tag: "Verifikasi",
  });
  res.json(updated);
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

const psySchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  title: z.string(),
  place: z.string().optional(),
  experienceYears: z.number().int().min(0).default(0),
  badge: z.string().optional(),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  basePrice: z.number().int().positive(),
  discountPercent: z.number().int().min(0).max(100).default(0),
  durationMinutes: z.number().int().positive().default(45),
});

/** POST /api/admin/psychologists — psikolog tidak bisa daftar sendiri, dibuatkan admin */
adminRouter.post("/psychologists", async (req, res) => {
  const { fullName, email, phone, password, ...profile } = parse(psySchema, req.body);
  const exists = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
  if (exists) throw new HttpError(409, "Email sudah dipakai");
  const user = await prisma.user.create({
    data: {
      role: "PSYCHOLOGIST",
      fullName,
      email: email.toLowerCase(),
      phone,
      passwordHash: await bcrypt.hash(password, 10),
      psychologistProfile: { create: profile },
    },
    include: { psychologistProfile: true },
  });
  res.status(201).json({ ...publicUser(user), psychologistProfile: user.psychologistProfile });
});

/** PATCH /api/admin/users/:id { isActive } — nonaktifkan / aktifkan akun */
adminRouter.patch("/users/:id", async (req, res) => {
  const { isActive } = parse(z.object({ isActive: z.boolean() }), req.body);
  const user = await prisma.user.update({ where: { id: param(req, "id") }, data: { isActive } });
  res.json(publicUser(user));
});

// ---------------------------------------------------------------------------
//  Daftar data untuk dashboard admin (web)
// ---------------------------------------------------------------------------

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
});

/** GET /api/admin/users?role=PARENT&q=devi&page=1 */
adminRouter.get("/users", async (req, res) => {
  const { page, pageSize, q } = parse(pageQuery, req.query);
  const role = req.query.role ? parse(z.enum(["PARENT", "TEACHER", "PSYCHOLOGIST", "ADMIN"]), req.query.role) : undefined;
  // ?demo=true → hanya akun demo, ?demo=false → hanya user sungguhan, kosong → semua (lihat kolom isDemo)
  const demo = req.query.demo === "true" ? true : req.query.demo === "false" ? false : undefined;
  const where = {
    role,
    isDemo: demo,
    ...(q
      ? { OR: [{ fullName: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q } }] }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { teacherProfile: { select: { verificationStatus: true } }, _count: { select: { children: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  res.json({ total, page, pageSize, items: rows.map((u) => ({ ...publicUser(u), teacherProfile: u.teacherProfile, childrenCount: u._count.children })) });
});

/** GET /api/admin/payments?status=PAID&page=1 */
adminRouter.get("/payments", async (req, res) => {
  const { page, pageSize } = parse(pageQuery, req.query);
  const status = req.query.status
    ? parse(z.enum(["PENDING", "VERIFYING", "PAID", "FAILED", "EXPIRED"]), req.query.status)
    : undefined;
  const [total, rows, revenue] = await Promise.all([
    prisma.payment.count({ where: { status } }),
    prisma.payment.findMany({
      where: { status },
      include: { user: { select: { fullName: true, email: true, phone: true, isDemo: true } }, manualMethod: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true, payeeAmount: true } }),
  ]);
  res.json({
    total,
    page,
    pageSize,
    summary: {
      paidTotal: revenue._sum.amount ?? 0,
      paidToTeachers: revenue._sum.payeeAmount ?? 0,
    },
    items: rows.map(({ gatewayPayload: _g, ...p }) => p),
  });
});

/** GET /api/admin/consultations?status=CONFIRMED&page=1 */
adminRouter.get("/consultations", async (req, res) => {
  const { page, pageSize } = parse(pageQuery, req.query);
  const status = req.query.status
    ? parse(z.enum(["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED"]), req.query.status)
    : undefined;
  const [total, rows] = await Promise.all([
    prisma.consultation.count({ where: { status } }),
    prisma.consultation.findMany({
      where: { status },
      include: { parent: { select: { fullName: true } }, psychologist: { include: { user: { select: { fullName: true } } } }, child: { select: { name: true } } },
      orderBy: { scheduledAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  res.json({ total, page, pageSize, items: rows });
});

/** GET /api/admin/engagements?status=ACTIVE&page=1 */
adminRouter.get("/engagements", async (req, res) => {
  const { page, pageSize } = parse(pageQuery, req.query);
  const status = req.query.status ? parse(z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]), req.query.status) : undefined;
  const [total, rows] = await Promise.all([
    prisma.engagement.count({ where: { status } }),
    prisma.engagement.findMany({
      where: { status },
      include: {
        child: { select: { name: true } },
        teacher: { select: { fullName: true } },
        parent: { select: { fullName: true } },
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  res.json({ total, page, pageSize, items: rows });
});

// ---------------------------------------------------------------------------
//  Transfer manual: konfirmasi / tolak bukti, kelola QRIS & rekening tujuan
// ---------------------------------------------------------------------------

/**
 * POST /api/admin/payments/:id/confirm
 * Admin SUDAH mengecek mutasi GoPay/bank: ada dana masuk sebesar amountDue.
 * → status PAID + semua efek (konsultasi terkonfirmasi, Plus aktif, notifikasi).
 */
adminRouter.post("/payments/:id/confirm", async (req, res) => {
  const p = await prisma.payment.findUnique({ where: { id: param(req, "id") }, include: { manualMethod: true } });
  if (!p) throw notFound("Pembayaran");
  if (p.status === "PAID") throw new HttpError(409, "Pembayaran ini sudah lunas");
  if (p.status !== "VERIFYING" && p.status !== "PENDING") {
    throw new HttpError(409, `Status ${p.status} tidak bisa dikonfirmasi`);
  }
  await prisma.payment.update({ where: { id: p.id }, data: { verifiedById: me(req).id, verifiedAt: new Date() } });
  const method = p.manualMethod ? `manual-${p.manualMethod.type.toLowerCase()}` : "manual";
  const { gatewayPayload: _g, ...paid } = await markPaid(p.id, method, { paymentType: p.manualMethod?.type.toLowerCase() });
  res.json(paid);
});

/** POST /api/admin/payments/:id/reject { reason } — bukti tidak sesuai → user diminta upload ulang */
adminRouter.post("/payments/:id/reject", async (req, res) => {
  const { reason } = parse(z.object({ reason: z.string().trim().min(5, "Tulis alasan penolakan").max(300) }), req.body);
  const p = await prisma.payment.findUnique({ where: { id: param(req, "id") } });
  if (!p) throw notFound("Pembayaran");
  if (p.status !== "VERIFYING") throw new HttpError(409, "Hanya pembayaran yang menunggu verifikasi yang bisa ditolak");
  const updated = await prisma.payment.update({
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
  const { gatewayPayload: _g, ...rest } = updated;
  res.json(rest);
});

const methodSchema = z
  .object({
    type: z.enum(["QRIS", "BANK_TRANSFER"]),
    label: z.string().trim().min(2).max(60),
    accountName: z.string().trim().min(2).max(100),
    bankName: z.string().trim().max(40).optional(),
    accountNumber: z.string().trim().regex(/^[0-9 -]{5,30}$/, "Nomor rekening hanya angka").optional(),
    qrImageUrl: z.string().url().optional(),
    instructions: z.string().max(500).optional(),
    active: z.boolean().default(true),
    order: z.number().int().default(0),
  })
  .refine((m) => (m.type === "QRIS" ? Boolean(m.qrImageUrl) : Boolean(m.bankName && m.accountNumber)), {
    message: "QRIS wajib qrImageUrl; transfer bank wajib bankName & accountNumber",
  });

/** GET /api/admin/payment-methods */
adminRouter.get("/payment-methods", async (_req, res) => {
  res.json(await prisma.paymentMethod.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }));
});

/** POST /api/admin/payment-methods — tambah QRIS GoPay / rekening bank (gambar QR via POST /api/uploads?folder=qris) */
adminRouter.post("/payment-methods", async (req, res) => {
  const data = parse(methodSchema, req.body);
  res.status(201).json(await prisma.paymentMethod.create({ data }));
});

/** PATCH /api/admin/payment-methods/:id */
adminRouter.patch("/payment-methods/:id", async (req, res) => {
  const current = await prisma.paymentMethod.findUnique({ where: { id: param(req, "id") } });
  if (!current) throw notFound("Metode pembayaran");
  const { id: _id, createdAt: _c, ...base } = current;
  const merged = parse(methodSchema, {
    ...Object.fromEntries(Object.entries(base).filter(([, v]) => v !== null)),
    ...req.body,
  });
  res.json(await prisma.paymentMethod.update({ where: { id: current.id }, data: merged }));
});

/** DELETE /api/admin/payment-methods/:id — dinonaktifkan (riwayat pembayaran tetap utuh) */
adminRouter.delete("/payment-methods/:id", async (req, res) => {
  await prisma.paymentMethod.update({ where: { id: param(req, "id") }, data: { active: false } });
  res.status(204).end();
});
