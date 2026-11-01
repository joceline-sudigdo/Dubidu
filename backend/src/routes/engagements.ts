import { Router } from "express";
import { z } from "zod";

import { config } from "../config.js";
import { prisma, type Prisma } from "../db.js";
import { ensureConversation } from "../lib/access.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { getSettings } from "../lib/content.js";
import { dayTime, hhmm, isoDate } from "../lib/dates.js";
import { forbidden, HttpError, notFound, param, parse } from "../lib/http.js";
import { notify } from "../lib/notify.js";
import { CATEGORY_TONE, displayName } from "../lib/present.js";
import { createPayment } from "./payments.js";

export const engagementsRouter = Router();
engagementsRouter.use(requireAuth);

const INCLUDE = {
  child: { include: { needs: { include: { needOption: true } } } },
  teacher: { include: { teacherProfile: true } },
  parent: true,
  sessions: { orderBy: { number: "asc" } },
} as const;
type EngagementRow = Prisma.EngagementGetPayload<{ include: typeof INCLUDE }>;

async function loadEngagement(id: string, userId: string) {
  const e = await prisma.engagement.findUnique({ where: { id }, include: INCLUDE });
  if (!e) throw notFound("Kontrak pendampingan");
  if (e.parentId !== userId && e.teacherUserId !== userId) throw forbidden();
  return e;
}

/** Bentuk "activeMatches" di frontend */
async function present(e: EngagementRow, viewerId: string) {
  const convo = await prisma.conversation.findFirst({
    where: {
      type: "TEACHER",
      childId: e.childId,
      AND: [{ participants: { some: { userId: e.parentId } } }, { participants: { some: { userId: e.teacherUserId } } }],
    },
    select: { id: true },
  });
  const next = e.sessions.find((s) => s.status === "SCHEDULED" && s.startAt >= new Date());
  return {
    id: e.id,
    status: e.status,
    teacher: { id: e.teacherUserId, name: displayName(e.teacher, e.teacher.teacherProfile?.title), avatarUrl: e.teacher.avatarUrl },
    parent: { id: e.parentId, name: e.parent.fullName, avatarUrl: e.parent.avatarUrl },
    child: { id: e.childId, name: e.child.name, fullName: e.child.fullName },
    chatId: convo?.id ?? null,
    tags: e.child.needs.slice(0, 2).map((n) => ({ label: n.needOption.label, tone: CATEGORY_TONE[n.needOption.category] })),
    nextSession: next ? dayTime(next.startAt) : null,
    done: e.sessions.filter((s) => s.status === "DONE").length,
    total: e.totalSessions,
    phase: e.phase,
    ratePerSession: e.ratePerSession,
    frequency: e.frequency,
    location: e.location,
    startDate: e.startDate ? isoDate(e.startDate) : null,
    endDate: e.endDate ? isoDate(e.endDate) : null,
    isTeacher: viewerId === e.teacherUserId,
  };
}

/** GET /api/engagements?status=ACTIVE */
engagementsRouter.get("/", async (req, res) => {
  const user = me(req);
  const status = req.query.status ? parse(z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]), req.query.status) : undefined;
  const rows = await prisma.engagement.findMany({
    where: { status, OR: [{ parentId: user.id }, { teacherUserId: user.id }] },
    include: INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  res.json(await Promise.all(rows.map((e) => present(e, user.id))));
});

/** GET /api/engagements/:id — detail kontrak + daftar sesi + pembayaran */
engagementsRouter.get("/:id", async (req, res) => {
  const user = me(req);
  const e = await loadEngagement(param(req, "id"), user.id);
  const payments = await prisma.payment.findMany({
    where: { purpose: "ENGAGEMENT", referenceId: e.id },
    orderBy: { createdAt: "asc" },
  });
  res.json({
    ...(await present(e, user.id)),
    sessions: e.sessions.map((s) => ({
      id: s.id,
      number: s.number,
      date: isoDate(s.startAt),
      time: `${hhmm(s.startAt)} - ${hhmm(s.endAt)}`,
      startAt: s.startAt,
      endAt: s.endAt,
      location: s.location ?? e.location,
      status: s.status,
    })),
    payments,
  });
});

const createSchema = z.object({
  applicationId: z.string(),
  ratePerSession: z.number().int().positive(),
  totalSessions: z.number().int().positive(),
  frequency: z.string().optional(),
  location: z.string().optional(),
  phase: z.string().optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
});

/** POST /api/engagements — "Deal": buat kontrak dari pengajuan yang sudah ACCEPTED */
engagementsRouter.post("/", requireRole("PARENT", "TEACHER"), async (req, res) => {
  const user = me(req);
  const body = parse(createSchema, req.body);
  const app = await prisma.application.findUnique({ where: { id: body.applicationId }, include: { child: true } });
  if (!app) throw notFound("Pengajuan");
  if (app.teacherUserId !== user.id && app.child.parentId !== user.id) throw forbidden();
  if (app.status !== "ACCEPTED") throw new HttpError(409, "Pengajuan harus diterima dulu sebelum membuat kontrak");

  const existing = await prisma.engagement.findUnique({ where: { applicationId: app.id } });
  if (existing) throw new HttpError(409, "Kontrak untuk pengajuan ini sudah ada");

  const e = await prisma.engagement.create({
    data: {
      applicationId: app.id,
      childId: app.childId,
      teacherUserId: app.teacherUserId,
      parentId: app.child.parentId,
      ratePerSession: body.ratePerSession,
      totalSessions: body.totalSessions,
      frequency: body.frequency,
      location: body.location,
      phase: body.phase ?? "Fase Adaptasi",
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    },
    include: INCLUDE,
  });
  await ensureConversation("TEACHER", e.parentId, e.teacherUserId, e.childId);
  const other = user.id === e.parentId ? e.teacherUserId : e.parentId;
  await notify({
    userId: other,
    category: "BOOKING",
    icon: "handshake",
    tone: "green",
    title: "Kontrak pendampingan dibuat",
    body: `Kontrak pendampingan untuk ${e.child.name} (${e.totalSessions} sesi) sudah aktif.`,
    tag: "Kontrak",
    action: "Lihat Detail",
    link: `/kontrak/${e.id}`,
  });
  res.status(201).json(await present(e, user.id));
});

/** PATCH /api/engagements/:id { status?, phase?, location?, frequency? } */
engagementsRouter.patch("/:id", async (req, res) => {
  const user = me(req);
  await loadEngagement(param(req, "id"), user.id);
  const body = parse(
    z.object({
      status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
      phase: z.string().optional(),
      location: z.string().optional(),
      frequency: z.string().optional(),
    }),
    req.body,
  );
  const e = await prisma.engagement.update({ where: { id: param(req, "id") }, data: body, include: INCLUDE });
  res.json(await present(e, user.id));
});

/** POST /api/engagements/:id/sessions { sessions: [{ startAt, endAt, location? }] } — jadwalkan sesi */
engagementsRouter.post("/:id/sessions", async (req, res) => {
  const user = me(req);
  const e = await loadEngagement(param(req, "id"), user.id);
  const body = parse(
    z.object({
      sessions: z
        .array(z.object({ startAt: z.iso.datetime({ offset: true }), endAt: z.iso.datetime({ offset: true }), location: z.string().optional() }))
        .min(1),
    }),
    req.body,
  );
  let number = e.sessions.reduce((max, s) => Math.max(max, s.number), 0);
  if (number + body.sessions.length > e.totalSessions) {
    throw new HttpError(400, `Kontrak ini hanya ${e.totalSessions} sesi`);
  }
  const created = await prisma.$transaction(
    body.sessions.map((s) =>
      prisma.session.create({
        data: { engagementId: e.id, number: ++number, startAt: new Date(s.startAt), endAt: new Date(s.endAt), location: s.location },
      }),
    ),
  );
  res.status(201).json(created);
});

/** POST /api/engagements/:id/payments { sessions } — orang tua membayar fee untuk N sesi */
engagementsRouter.post("/:id/payments", requireRole("PARENT"), async (req, res) => {
  const user = me(req);
  const e = await loadEngagement(param(req, "id"), user.id);
  const { sessions } = parse(z.object({ sessions: z.number().int().positive() }), req.body);
  const amount = e.ratePerSession * sessions;
  const plus = await prisma.subscription.findFirst({
    where: { userId: e.teacherUserId, active: true, endsAt: { gt: new Date() } },
  });
  const settings = await getSettings();
  const feePercent = plus ? settings.plusPlatformFeePercent : settings.platformFeePercent;
  const payment = await createPayment({
    userId: user.id,
    purpose: "ENGAGEMENT",
    referenceId: e.id,
    amount,
    payeeUserId: e.teacherUserId,
    payeeAmount: Math.round(amount * (1 - feePercent / 100)),
  });
  res.status(201).json(payment);
});

// ---------------------------------------------------------------------------
//  Sesi & jadwal
// ---------------------------------------------------------------------------

export const sessionsRouter = Router();
sessionsRouter.use(requireAuth);

/** PATCH /api/sessions/:id { status?, startAt?, endAt?, location? } */
sessionsRouter.patch("/:id", async (req, res) => {
  const user = me(req);
  const s = await prisma.session.findUnique({ where: { id: param(req, "id") }, include: { engagement: true } });
  if (!s) throw notFound("Sesi");
  if (s.engagement.parentId !== user.id && s.engagement.teacherUserId !== user.id) throw forbidden();
  const body = parse(
    z.object({
      status: z.enum(["SCHEDULED", "DONE", "CANCELLED"]).optional(),
      startAt: z.iso.datetime({ offset: true }).optional(),
      endAt: z.iso.datetime({ offset: true }).optional(),
      location: z.string().optional(),
    }),
    req.body,
  );
  const updated = await prisma.session.update({
    where: { id: s.id },
    data: {
      ...body,
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt ? new Date(body.endAt) : undefined,
    },
  });
  res.json(updated);
});

/**
 * GET /api/schedule?from=2026-10-01&to=2026-10-31 — tab "Jadwal"
 * Gabungan sesi pendampingan + konsultasi psikolog milik user.
 */
export const scheduleRouter = Router();
scheduleRouter.use(requireAuth);

scheduleRouter.get("/", async (req, res) => {
  const user = me(req);
  const q = parse(z.object({ from: z.iso.date(), to: z.iso.date() }), req.query);
  const from = new Date(`${q.from}T00:00:00+07:00`);
  const to = new Date(`${q.to}T23:59:59+07:00`);

  const [sessions, consultations] = await Promise.all([
    prisma.session.findMany({
      where: {
        startAt: { gte: from, lte: to },
        engagement: { OR: [{ parentId: user.id }, { teacherUserId: user.id }] },
      },
      include: { engagement: { include: { child: true, teacher: true } }, report: { select: { id: true } } },
      orderBy: { startAt: "asc" },
    }),
    prisma.consultation.findMany({
      where: {
        scheduledAt: { gte: from, lte: to },
        status: { in: ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED"] },
        OR: [{ parentId: user.id }, { psychologist: { userId: user.id } }],
      },
      include: { psychologist: { include: { user: true } }, child: true },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  const items = [
    ...sessions.map((s) => ({
      kind: "SESSION" as const,
      id: s.id,
      title: `Sesi #${s.number} • ${s.engagement.child.name}`,
      with: s.engagement.teacher.fullName,
      date: isoDate(new Date(s.startAt.getTime() + 7 * 3600000)),
      time: `${hhmm(s.startAt)} - ${hhmm(s.endAt)}`,
      startAt: s.startAt,
      location: s.location ?? s.engagement.location,
      status: s.status,
      reportId: s.report?.id ?? null,
    })),
    ...consultations.map((c) => ({
      kind: "CONSULTATION" as const,
      id: c.id,
      title: `Konsultasi ${c.type === "VIDEO" ? "Video Call" : c.type === "CALL" ? "Panggilan" : "Chat"}${c.child ? ` • ${c.child.name}` : ""}`,
      with: c.psychologist.user.fullName,
      date: isoDate(new Date(c.scheduledAt.getTime() + 7 * 3600000)),
      time: hhmm(c.scheduledAt),
      startAt: c.scheduledAt,
      location: "Online",
      status: c.status,
      reportId: null,
    })),
  ].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  res.json(items);
});
