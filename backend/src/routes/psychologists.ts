import { Router } from "express";
import { z } from "zod";

import { config } from "../config.js";
import { prisma, type Prisma } from "../db.js";
import { assertOwnChild, assertSameWorld, isDemoUser } from "../lib/access.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { getSettings, promoPercent } from "../lib/content.js";
import { dayShort, hhmm, isoDate, shortDate, wibDate } from "../lib/dates.js";
import { forbidden, HttpError, notFound, param, parse } from "../lib/http.js";
import { createMeetingRoom, joinUrl } from "../lib/meeting.js";
import { notify } from "../lib/notify.js";
import { displayName } from "../lib/present.js";
import { createPayment } from "./payments.js";

export const psychologistsRouter = Router();
psychologistsRouter.use(requireAuth);

type PsyRow = Prisma.PsychologistProfileGetPayload<{ include: { user: true } }>;

/** Bentuk "Psychologist" di frontend (src/data/parent.ts) */
function present(p: PsyRow) {
  return {
    id: p.id,
    userId: p.userId,
    name: p.user.fullName,
    avatarUrl: p.user.avatarUrl,
    title: p.title,
    badge: p.badge,
    rating: p.rating,
    reviews: p.reviewCount,
    experience: `${p.experienceYears} tahun pengalaman`,
    place: p.place,
    tags: p.tags,
    categories: p.categories,
    basePrice: p.basePrice,
    discountPercent: p.discountPercent,
    finalPrice: Math.round(p.basePrice * (1 - p.discountPercent / 100)),
    duration: p.durationMinutes,
  };
}

/** GET /api/psychologists?category=ADHD */
psychologistsRouter.get("/", async (req, res) => {
  const category = req.query.category ? String(req.query.category) : undefined;
  const isDemo = await isDemoUser(me(req).id);
  const rows = await prisma.psychologistProfile.findMany({
    where: { user: { isActive: true, isDemo }, ...(category ? { categories: { has: category } } : {}) },
    include: { user: true },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
  });
  res.json(rows.map(present));
});

/** GET /api/psychologists/:id — profil + ulasan */
psychologistsRouter.get("/:id", async (req, res) => {
  const p = await prisma.psychologistProfile.findUnique({ where: { id: param(req, "id") }, include: { user: true } });
  if (!p) throw notFound("Psikolog");
  await assertSameWorld(me(req), p.user.isDemo, "Psikolog");
  const reviews = await prisma.review.findMany({
    where: { targetUserId: p.userId },
    include: { author: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  res.json({
    ...present(p),
    reviewsList: reviews.map((r) => ({ id: r.id, name: r.author.fullName, rating: r.rating, comment: r.comment, date: shortDate(r.createdAt) })),
  });
});

/**
 * GET /api/psychologists/:id/availability?days=7
 * → dates: [{ date, day, status: open|few|full }] dan times per tanggal.
 */
psychologistsRouter.get("/:id/availability", async (req, res) => {
  const owner = await prisma.psychologistProfile.findUnique({ where: { id: param(req, "id") }, include: { user: true } });
  if (!owner) throw notFound("Psikolog");
  await assertSameWorld(me(req), owner.user.isDemo, "Psikolog");
  const days = Math.min(Number(req.query.days ?? 7), 30);
  const from = new Date();
  const to = new Date(wibDate().getTime() - 7 * 3600000 + days * 86400000);
  const slots = await prisma.psychologistSlot.findMany({
    where: { psychologistId: param(req, "id"), startAt: { gte: from, lt: to } },
    orderBy: { startAt: "asc" },
  });

  const byDate = new Map<string, typeof slots>();
  for (const s of slots) {
    const key = isoDate(new Date(s.startAt.getTime() + 7 * 3600000));
    byDate.set(key, [...(byDate.get(key) ?? []), s]);
  }

  res.json(
    [...byDate.entries()].map(([date, list]) => {
      const free = list.filter((s) => !s.isBooked);
      return {
        id: date,
        date,
        day: dayShort(list[0]!.startAt),
        dayOfMonth: Number(date.slice(8, 10)),
        status: free.length === 0 ? "full" : free.length <= 2 ? "few" : "open",
        times: list.map((s) => ({
          slotId: s.id,
          time: hhmm(s.startAt),
          status: s.isBooked ? "full" : free.length === 1 ? "last" : "open",
        })),
      };
    }),
  );
});

/** POST /api/psychologists/me/slots { startAts: ["2026-11-02T09:00:00+07:00", ...] } — psikolog membuka jadwal */
psychologistsRouter.post("/me/slots", requireRole("PSYCHOLOGIST"), async (req, res) => {
  const { startAts } = parse(z.object({ startAts: z.array(z.iso.datetime({ offset: true })).min(1).max(100) }), req.body);
  const profile = await prisma.psychologistProfile.findUnique({ where: { userId: me(req).id } });
  if (!profile) throw forbidden();
  const result = await prisma.psychologistSlot.createMany({
    data: startAts.map((s) => ({ psychologistId: profile.id, startAt: new Date(s) })),
    skipDuplicates: true,
  });
  res.status(201).json({ created: result.count });
});

/** DELETE /api/psychologists/me/slots/:slotId — hapus slot yang belum dibooking */
psychologistsRouter.delete("/me/slots/:slotId", requireRole("PSYCHOLOGIST"), async (req, res) => {
  const slot = await prisma.psychologistSlot.findUnique({ where: { id: param(req, "slotId") }, include: { psychologist: true } });
  if (!slot) throw notFound("Slot");
  if (slot.psychologist.userId !== me(req).id) throw forbidden();
  if (slot.isBooked) throw new HttpError(409, "Slot sudah dibooking, batalkan konsultasinya dulu");
  await prisma.psychologistSlot.delete({ where: { id: slot.id } });
  res.status(204).end();
});

// ---------------------------------------------------------------------------
//  Tinjauan pendaftar shadow teacher (tab Verifikasi psikolog) → rekomendasi untuk admin
// ---------------------------------------------------------------------------

const DOC_LABEL: Record<string, string> = { KTP: "KTP", IJAZAH: "Ijazah", SERTIFIKAT: "Sertifikat pelatihan", CV: "CV / Portofolio", LAINNYA: "Dokumen lain" };

function registeredAgo(date: Date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "Daftar hari ini";
  if (days === 1) return "Daftar kemarin";
  if (days < 7) return `Daftar ${days} hari lalu`;
  return days < 14 ? "Daftar minggu lalu" : `Daftar ${shortDate(date)}`;
}

/** GET /api/psychologists/me/teacher-applicants — pendaftar teacher yang menunggu verifikasi (bentuk = Applicant di frontend) */
psychologistsRouter.get("/me/teacher-applicants", requireRole("PSYCHOLOGIST"), async (req, res) => {
  const userId = me(req).id;
  const rows = await prisma.teacherProfile.findMany({
    where: { verificationStatus: { in: ["PENDING", "REVISION"] }, user: { isDemo: await isDemoUser(userId), isActive: true } },
    include: {
      user: true,
      documents: true,
      specializations: { include: { needOption: true } },
      assessments: { where: { psychologistId: userId } },
    },
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
  });
  res.json(
    rows.map((t) => {
      const mine = t.assessments[0];
      const skills = t.specializations.map((s) => s.needOption.label);
      return {
        id: t.userId,
        name: displayName(t.user, t.title),
        education: t.education ?? "-",
        experience: `Pengalaman ${t.experienceYears} tahun`,
        registered: registeredAgo(t.submittedAt ?? t.createdAt),
        focus: t.headline ?? skills.slice(0, 2).join(" & "),
        skills,
        about: t.about ?? "",
        interview: mine?.interview ?? null,
        documents: (["KTP", "IJAZAH", "SERTIFIKAT", "CV"] as const).map((type) => {
          const doc = t.documents.find((d) => d.type === type);
          return { label: DOC_LABEL[type], uploaded: Boolean(doc), url: doc?.url ?? null };
        }),
        result: mine ? { status: mine.recommendation, issues: mine.issues, note: mine.note } : undefined,
      };
    }),
  );
});

/** PUT /api/psychologists/me/teacher-applicants/:teacherUserId { status?, issues?, note?, interview? } */
psychologistsRouter.put("/me/teacher-applicants/:teacherUserId", requireRole("PSYCHOLOGIST"), async (req, res) => {
  const body = parse(
    z.object({
      status: z.enum(["verified", "revision", "rejected"]).optional(),
      issues: z.array(z.string().max(120)).max(20).default([]),
      note: z.string().trim().max(1000).default(""),
      interview: z.string().trim().max(80).nullable().optional(), // "Kamis, 8 Okt · 13:00 (online)"
    }),
    req.body,
  );
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: param(req, "teacherUserId") }, include: { user: true } });
  if (!teacher) throw notFound("Pendaftar");
  await assertSameWorld(me(req), teacher.user.isDemo, "Pendaftar");
  const key = { teacherId_psychologistId: { teacherId: teacher.id, psychologistId: me(req).id } };
  const current = await prisma.teacherAssessment.findUnique({ where: key });
  const data = {
    recommendation: body.status ?? current?.recommendation ?? "pending",
    issues: body.status ? body.issues : (current?.issues ?? []),
    note: body.status ? body.note : (current?.note ?? ""),
    interview: body.interview === undefined ? (current?.interview ?? null) : body.interview,
  };
  const saved = await prisma.teacherAssessment.upsert({
    where: key,
    create: { teacherId: teacher.id, psychologistId: me(req).id, ...data },
    update: data,
  });
  if (body.interview && body.interview !== current?.interview) {
    await notify({
      userId: teacher.userId,
      category: "LAINNYA",
      icon: "account-voice",
      tone: "blue",
      title: "Jadwal interview verifikasi",
      body: `Psikolog DUBIDU menjadwalkan interview: ${body.interview}.`,
      tag: "Verifikasi",
    });
  }
  res.json({ status: saved.recommendation, issues: saved.issues, note: saved.note, interview: saved.interview });
});

// ---------------------------------------------------------------------------
//  Konsultasi
// ---------------------------------------------------------------------------

export const consultationsRouter = Router();
consultationsRouter.use(requireAuth);

const CONSULT_INCLUDE = { psychologist: { include: { user: true } }, child: true, parent: true } as const;
type ConsultRow = Prisma.ConsultationGetPayload<{ include: typeof CONSULT_INCLUDE }>;

function presentConsultation(c: ConsultRow) {
  return {
    id: c.id,
    status: c.status,
    type: c.type,
    scheduledAt: c.scheduledAt,
    date: shortDate(c.scheduledAt),
    time: hhmm(c.scheduledAt),
    durationMin: c.durationMin,
    psychologist: { id: c.psychologistId, name: c.psychologist.user.fullName, title: c.psychologist.title, avatarUrl: c.psychologist.user.avatarUrl },
    parent: { id: c.parentId, name: c.parent.fullName },
    child: c.child && { id: c.child.id, name: c.child.name },
    basePrice: c.basePrice,
    discount: c.discount,
    finalPrice: c.finalPrice,
    promoCode: c.promoCode,
    complaint: c.complaint,
    meeting: c.type === "CHAT" ? null : { provider: c.meetingProvider, ready: Boolean(c.meetingUrl) },
    result: c.observation || c.recommendation || c.followUp
      ? { observation: c.observation, recommendation: c.recommendation, followUp: c.followUp }
      : null,
  };
}

/** POST /api/consultations/quote { psychologistId, promoCode? } — hitung harga sebelum booking */
async function quote(userId: string, psychologistId: string, promoCode?: string) {
  const p = await prisma.psychologistProfile.findUnique({ where: { id: psychologistId }, include: { user: true } });
  if (!p) throw notFound("Psikolog");
  // user sungguhan tidak bisa memesan psikolog demo (dan sebaliknya)
  if ((await isDemoUser(userId)) !== p.user.isDemo) throw notFound("Psikolog");
  const plus = await prisma.subscription.findFirst({ where: { userId, active: true, endsAt: { gt: new Date() } } });
  const code = promoCode?.trim().toUpperCase();
  const promo = code ? await promoPercent(code, "CONSULTATION") : 0;
  if (code && promo === null) throw new HttpError(400, "Kode promo tidak valid atau sudah tidak berlaku");
  const percent = Math.min(50, p.discountPercent + (promo ?? 0) + (plus ? 20 : 0));
  const discount = Math.round((p.basePrice * percent) / 100);
  return { profile: p, basePrice: p.basePrice, discount, finalPrice: p.basePrice - discount, percent, promoCode: code };
}

consultationsRouter.post("/quote", requireRole("PARENT"), async (req, res) => {
  const body = parse(z.object({ psychologistId: z.string(), promoCode: z.string().optional() }), req.body);
  const { profile: _p, ...q } = await quote(me(req).id, body.psychologistId, body.promoCode);
  res.json(q);
});

/** POST /api/consultations { psychologistId, slotId, type, childId?, promoCode?, complaint? } → { consultation, payment } */
consultationsRouter.post("/", requireRole("PARENT"), async (req, res) => {
  const userId = me(req).id;
  const body = parse(
    z.object({
      psychologistId: z.string(),
      slotId: z.string(),
      type: z.enum(["VIDEO", "CALL", "CHAT"]),
      childId: z.string().optional(),
      promoCode: z.string().optional(),
      complaint: z.string().max(1000).optional(),
    }),
    req.body,
  );
  if (body.childId) await assertOwnChild(me(req), body.childId);
  const price = await quote(userId, body.psychologistId, body.promoCode);

  const consultation = await prisma.$transaction(async (tx) => {
    // updateMany + kondisi isBooked=false mencegah 2 orang tua membooking slot yang sama bersamaan
    const locked = await tx.psychologistSlot.updateMany({
      where: { id: body.slotId, psychologistId: body.psychologistId, isBooked: false, startAt: { gt: new Date() } },
      data: { isBooked: true },
    });
    if (locked.count === 0) throw new HttpError(409, "Slot ini sudah tidak tersedia, pilih jam lain");
    const slot = await tx.psychologistSlot.findUniqueOrThrow({ where: { id: body.slotId } });
    return tx.consultation.create({
      data: {
        parentId: userId,
        psychologistId: body.psychologistId,
        childId: body.childId,
        slotId: slot.id,
        type: body.type,
        scheduledAt: slot.startAt,
        durationMin: price.profile.durationMinutes,
        basePrice: price.basePrice,
        discount: price.discount,
        promoCode: price.promoCode,
        finalPrice: price.finalPrice,
        complaint: body.complaint,
      },
      include: CONSULT_INCLUDE,
    });
  });

  const payment = await createPayment({
    userId,
    purpose: "CONSULTATION",
    referenceId: consultation.id,
    amount: consultation.finalPrice,
    // pendapatan psikolog (setelah biaya platform) → bisa dicairkan setelah lunas
    payeeUserId: consultation.psychologist.userId,
    payeeAmount: Math.round(consultation.finalPrice * (1 - (await getSettings()).platformFeePercent / 100)),
  });
  await notify({
    userId,
    category: "BOOKING",
    icon: "timer-sand",
    tone: "red",
    title: "Selesaikan Pembayaran Sesi",
    body: `Slot konsultasi ${consultation.psychologist.user.fullName} ${shortDate(consultation.scheduledAt)} pukul ${hhmm(consultation.scheduledAt)} akan dilepas jika belum dibayar dalam 1 jam.`,
    tag: "Batas Waktu Sesi",
    action: "Bayar Sekarang",
    link: `/pembayaran/${payment.id}`,
  });
  res.status(201).json({ consultation: presentConsultation(consultation), payment });
});

/** GET /api/consultations?status=CONFIRMED — orang tua: miliknya; psikolog: sesi yang dibooking ke dia */
consultationsRouter.get("/", async (req, res) => {
  const user = me(req);
  const status = req.query.status
    ? parse(z.enum(["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED"]), req.query.status)
    : undefined;
  const rows = await prisma.consultation.findMany({
    where: { status, ...(user.role === "PSYCHOLOGIST" ? { psychologist: { userId: user.id } } : { parentId: user.id }) },
    include: CONSULT_INCLUDE,
    orderBy: { scheduledAt: "desc" },
  });
  res.json(rows.map(presentConsultation));
});

async function loadConsultation(id: string, userId: string) {
  const c = await prisma.consultation.findUnique({ where: { id }, include: CONSULT_INCLUDE });
  if (!c) throw notFound("Konsultasi");
  if (c.parentId !== userId && c.psychologist.userId !== userId) throw forbidden();
  return c;
}

/** GET /api/consultations/:id */
consultationsRouter.get("/:id", async (req, res) => {
  const c = await loadConsultation(param(req, "id"), me(req).id);
  const payment = await prisma.payment.findFirst({ where: { purpose: "CONSULTATION", referenceId: c.id }, orderBy: { createdAt: "desc" } });
  res.json({ ...presentConsultation(c), payment });
});

/**
 * GET /api/consultations/:id/join → { url, provider, opensAt, closesAt }
 * Link video/voice call pribadi untuk orang tua / psikolog. Bisa dibuka 15 menit sebelum jadwal.
 * Frontend: buka `url` dengan expo-web-browser (WebBrowser.openBrowserAsync).
 */
consultationsRouter.get("/:id/join", async (req, res) => {
  const user = me(req);
  let c = await loadConsultation(param(req, "id"), user.id);
  if (c.type === "CHAT") throw new HttpError(400, "Konsultasi tipe chat berlangsung di menu Chat");
  if (c.status !== "CONFIRMED") throw new HttpError(409, "Konsultasi belum terkonfirmasi (selesaikan pembayaran dulu)");

  const opensAt = new Date(c.scheduledAt.getTime() - 15 * 60000);
  const closesAt = new Date(c.scheduledAt.getTime() + (c.durationMin + 30) * 60000);
  const now = new Date();
  if (now < opensAt) throw new HttpError(425, `Ruang konsultasi dibuka pukul ${hhmm(opensAt)} WIB`);
  if (now > closesAt) throw new HttpError(410, "Waktu konsultasi sudah berakhir");

  if (!c.meetingUrl) {
    const meeting = await createMeetingRoom(c);
    c = await prisma.consultation.update({
      where: { id: c.id },
      data: { meetingProvider: meeting.provider, meetingRoom: meeting.room, meetingUrl: meeting.url },
      include: CONSULT_INCLUDE,
    });
  }
  const isPsychologist = c.psychologist.userId === user.id;
  const url = await joinUrl(
    { provider: c.meetingProvider, room: c.meetingRoom, url: c.meetingUrl },
    { name: isPsychologist ? c.psychologist.user.fullName : c.parent.fullName, isOwner: isPsychologist, type: c.type },
    closesAt,
  );
  res.json({ url, provider: c.meetingProvider, type: c.type, opensAt, closesAt });
});

/** POST /api/consultations/:id/cancel — slot dibuka lagi */
consultationsRouter.post("/:id/cancel", async (req, res) => {
  const c = await loadConsultation(param(req, "id"), me(req).id);
  if (c.status === "COMPLETED" || c.status === "CANCELLED") throw new HttpError(409, "Konsultasi ini tidak bisa dibatalkan");
  await prisma.$transaction([
    prisma.consultation.update({ where: { id: c.id }, data: { status: "CANCELLED", slotId: null } }),
    ...(c.slotId ? [prisma.psychologistSlot.update({ where: { id: c.slotId }, data: { isBooked: false } })] : []),
    prisma.payment.updateMany({ where: { purpose: "CONSULTATION", referenceId: c.id, status: "PENDING" }, data: { status: "FAILED" } }),
  ]);
  res.json({ ok: true });
});

/** PATCH /api/consultations/:id/result { observation, recommendation, followUp } — psikolog kirim hasil sesi */
consultationsRouter.patch("/:id/result", requireRole("PSYCHOLOGIST"), async (req, res) => {
  const c = await loadConsultation(param(req, "id"), me(req).id);
  if (c.status !== "CONFIRMED" && c.status !== "COMPLETED") throw new HttpError(409, "Konsultasi belum terkonfirmasi");
  const body = parse(
    z.object({ observation: z.string().min(5), recommendation: z.string().min(5), followUp: z.string().optional() }),
    req.body,
  );
  const updated = await prisma.consultation.update({
    where: { id: c.id },
    data: { ...body, status: "COMPLETED" },
    include: CONSULT_INCLUDE,
  });
  await notify({
    userId: c.parentId,
    category: "LAPORAN",
    icon: "file-document",
    tone: "green",
    title: "Hasil konsultasi sudah tersedia",
    body: `${c.psychologist.user.fullName} mengirim catatan observasi & rekomendasi${c.child ? ` untuk ${c.child.name}` : ""}.`,
    tag: "Hasil Konsultasi",
    action: "Buka Hasil",
    link: `/konsultasi/${c.id}`,
  });
  res.json(presentConsultation(updated));
});
