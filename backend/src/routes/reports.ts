import { Router } from "express";
import { z } from "zod";

import { prisma, type Prisma } from "../db.js";
import { assertChildAccess } from "../lib/access.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { hhmm, isoDate } from "../lib/dates.js";
import { forbidden, HttpError, notFound, param, parse } from "../lib/http.js";
import { notify } from "../lib/notify.js";
import { displayName, scoreStatus } from "../lib/present.js";

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

const INCLUDE = {
  scores: true,
  photos: true,
  session: true,
  teacher: { include: { teacherProfile: true } },
  child: true,
} as const;
type ReportRow = Prisma.SessionReportGetPayload<{ include: typeof INCLUDE }>;

/** Bentuk "SessionReport" di frontend (kalender report card) */
function presentSummary(r: ReportRow) {
  return {
    id: r.id,
    sessionId: r.sessionId,
    date: isoDate(new Date(r.session.startAt.getTime() + 7 * 3600000)),
    number: r.session.number,
    teacher: displayName(r.teacher, r.teacher.teacherProfile?.title),
    time: `${hhmm(r.session.startAt)} - ${hhmm(r.session.endAt)}`,
    scores: r.scores.map((s) => ({ label: s.aspect, value: s.value, ...scoreStatus(s.value) })),
    dailyNote: r.dailyNote.split("\n\n")[0],
    achievement: r.achievement,
    sensoryNote: r.sensoryNote,
    needsAttention: r.needsAttention,
  };
}

/** GET /api/children/:childId/reports?month=2026-09 */
reportsRouter.get("/children/:childId/reports", async (req, res) => {
  await assertChildAccess(me(req), param(req, "childId"));
  const month = req.query.month ? parse(z.string().regex(/^\d{4}-\d{2}$/), req.query.month) : null;
  const range = month
    ? { gte: new Date(`${month}-01T00:00:00+07:00`), lt: nextMonth(month) }
    : undefined;
  const rows = await prisma.sessionReport.findMany({
    where: { childId: param(req, "childId"), session: range ? { startAt: range } : undefined },
    include: INCLUDE,
    orderBy: { session: { startAt: "desc" } },
  });
  res.json(rows.map(presentSummary));
});

function nextMonth(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return new Date(`${ny}-${String(nm).padStart(2, "0")}-01T00:00:00+07:00`);
}

/** GET /api/reports/:id — detail report card + tren dibanding laporan sebelumnya */
reportsRouter.get("/reports/:id", async (req, res) => {
  const r = await prisma.sessionReport.findUnique({ where: { id: param(req, "id") }, include: INCLUDE });
  if (!r) throw notFound("Report card");
  await assertChildAccess(me(req), r.childId);

  const previous = await prisma.sessionReport.findFirst({
    where: { childId: r.childId, session: { startAt: { lt: r.session.startAt } } },
    include: { scores: true },
    orderBy: { session: { startAt: "desc" } },
  });
  const prevScores = new Map(previous?.scores.map((s) => [s.aspect, s.value]) ?? []);

  const aspects = r.scores.map((s) => {
    const before = prevScores.get(s.aspect);
    const diff = before == null ? 0 : s.value - before;
    const deltaPercent = before ? Math.round((diff / before) * 1000) / 10 : 0;
    return {
      label: s.aspect,
      value: s.value,
      trend: s.value < 3 ? "Perlu Perhatian" : diff > 0 ? "Meningkat" : diff < 0 ? "Menurun" : "Stabil",
      delta: deltaPercent ? `${deltaPercent > 0 ? "+" : ""}${deltaPercent}%` : "",
      tone: s.value < 3 ? "red" : diff > 0 ? "green" : "blue",
    };
  });
  const avg = (vals: number[]) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
  const growthScore = Math.round(avg(r.scores.map((s) => s.value)) * 10) / 10;
  const prevAvg = avg([...prevScores.values()]);

  res.json({
    ...presentSummary(r),
    childName: r.child.name,
    verifiedAt: r.createdAt,
    teacherNote: r.dailyNote.split("\n\n"),
    improved: r.improved,
    attention: r.attention,
    homeTip: r.homeTip,
    aspects,
    growthScore,
    growthDelta: prevAvg ? `${growthScore >= prevAvg ? "+" : ""}${Math.round(((growthScore - prevAvg) / prevAvg) * 100)}%` : "",
    photos: r.photos.map((p) => ({ url: p.url, caption: p.caption })),
  });
});

const reportSchema = z.object({
  dailyNote: z.string().min(10, "Catatan harian minimal 10 karakter"),
  achievement: z.string().optional(),
  sensoryNote: z.string().optional(),
  homeTip: z.string().optional(),
  improved: z.array(z.string()).default([]),
  attention: z.array(z.string()).default([]),
  needsAttention: z.boolean().default(false),
  scores: z.array(z.object({ aspect: z.string(), value: z.number().min(1).max(5) })).min(1),
  photos: z.array(z.object({ url: z.string().url(), caption: z.string().optional() })).default([]),
});

/** POST /api/sessions/:sessionId/report — teacher mengisi report card setelah sesi */
reportsRouter.post("/sessions/:sessionId/report", requireRole("TEACHER"), async (req, res) => {
  const body = parse(reportSchema, req.body);
  const session = await prisma.session.findUnique({
    where: { id: param(req, "sessionId") },
    include: { engagement: { include: { child: true } }, report: true },
  });
  if (!session) throw notFound("Sesi");
  if (session.engagement.teacherUserId !== me(req).id) throw forbidden();
  if (session.report) throw new HttpError(409, "Report card sesi ini sudah dikirim");
  if (session.status === "CANCELLED") throw new HttpError(409, "Sesi ini dibatalkan, jadi tidak perlu laporan");

  const report = await prisma.$transaction(async (tx) => {
    await tx.session.update({ where: { id: session.id }, data: { status: "DONE" } });
    return tx.sessionReport.create({
      data: {
        sessionId: session.id,
        childId: session.engagement.childId,
        teacherUserId: me(req).id,
        dailyNote: body.dailyNote,
        achievement: body.achievement,
        sensoryNote: body.sensoryNote,
        homeTip: body.homeTip,
        improved: body.improved,
        attention: body.attention,
        needsAttention: body.needsAttention,
        scores: { create: body.scores },
        photos: { create: body.photos },
      },
      include: INCLUDE,
    });
  });

  await notify({
    userId: session.engagement.parentId,
    category: "LAPORAN",
    icon: "clipboard-check",
    tone: "green",
    title: "Laporan Perkembangan Baru",
    body: `Report Card Sesi ke-${session.number} untuk ${session.engagement.child.name} sudah dikirim.`,
    tag: `Sesi #${session.number}`,
    action: "Buka Laporan",
    link: `/report-card/${report.id}`,
  });

  res.status(201).json(presentSummary(report));
});
