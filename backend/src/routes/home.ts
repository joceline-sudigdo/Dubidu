import { Router } from "express";

import { prisma } from "../db.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { dayTime, hhmm, shortDate, startOfWeekWib, todayRangeWib, wibDate } from "../lib/dates.js";
import { displayName, initials, presentChild } from "../lib/present.js";
import { weekCheckins } from "./checkins.js";

export const homeRouter = Router();
homeRouter.use(requireAuth);

const NEEDS_INCLUDE = { needs: { include: { needOption: true } } } as const;

/** Sesi berikutnya (SCHEDULED, mulai dari sekarang) per kontrak */
async function nextSessions(engagementIds: string[]) {
  const sessions = await prisma.session.findMany({
    where: { engagementId: { in: engagementIds }, status: "SCHEDULED", startAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
  });
  const map = new Map<string, Date>();
  for (const s of sessions) if (!map.has(s.engagementId)) map.set(s.engagementId, s.startAt);
  return map;
}

/**
 * GET /api/home/parent?childId=...
 * Semua data untuk layar Beranda orang tua (gambar 1) dalam satu request.
 */
homeRouter.get("/parent", requireRole("PARENT"), async (req, res) => {
  const userId = me(req).id;
  const [user, children] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.child.findMany({ where: { parentId: userId }, include: NEEDS_INCLUDE, orderBy: { createdAt: "asc" } }),
  ]);
  const selected = children.find((c) => c.id === req.query.childId) ?? children[0] ?? null;

  const [question, engagements, unreadNotifications, checkin] = await Promise.all([
    prisma.quickQuestion.findFirst({
      where: { parentId: userId, answer: null },
      orderBy: { createdAt: "desc" },
      include: { teacher: true, child: true },
    }),
    prisma.engagement.findMany({
      where: { parentId: userId, status: "ACTIVE" },
      include: { teacher: { include: { teacherProfile: true } }, child: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    selected ? weekCheckins(userId, selected.id) : null,
  ]);
  const next = await nextSessions(engagements.map((e) => e.id));

  res.json({
    greeting: { name: user.nickname ?? user.fullName, avatarUrl: user.avatarUrl },
    points: user.points,
    unreadNotifications,
    children: children.map(presentChild),
    selectedChildId: selected?.id ?? null,
    quickQuestion: question && {
      id: question.id,
      from: question.teacher.fullName,
      fromAvatarUrl: question.teacher.avatarUrl,
      childName: question.child.name,
      text: question.text,
    },
    activeTeachers: engagements.map((e) => ({
      engagementId: e.id,
      teacherId: e.teacherUserId,
      name: e.teacher.nickname ?? e.teacher.fullName,
      avatarUrl: e.teacher.avatarUrl,
      verified: e.teacher.teacherProfile?.verificationStatus === "VERIFIED",
      childName: e.child.name,
      next: next.has(e.id) ? dayTime(next.get(e.id)!) : "Belum dijadwalkan",
    })),
    checkin,
  });
});

/**
 * GET /api/home/teacher?childId=...
 * Semua data untuk layar Beranda shadow teacher (gambar 2).
 */
homeRouter.get("/teacher", requireRole("TEACHER"), async (req, res) => {
  const userId = me(req).id;
  const { start, end } = todayRangeWib();
  const monthStart = new Date(Date.UTC(wibDate().getUTCFullYear(), wibDate().getUTCMonth(), 1) - 7 * 3600000);
  const weekStart = new Date(startOfWeekWib().getTime() - 7 * 3600000);
  const lastWeekStart = new Date(weekStart.getTime() - 7 * 86400000);

  const [user, engagements, todaySessions, applications, monthPaid, weekPaid, lastWeekPaid, doneThisMonth, unread] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { teacherProfile: true } }),
      prisma.engagement.findMany({
        where: { teacherUserId: userId, status: "ACTIVE" },
        include: { child: { include: NEEDS_INCLUDE } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.session.findMany({
        where: { engagement: { teacherUserId: userId }, startAt: { gte: start, lt: end }, status: { not: "CANCELLED" } },
        include: { engagement: { include: { child: true } } },
        orderBy: { startAt: "asc" },
      }),
      prisma.application.findMany({
        where: { teacherUserId: userId, status: { in: ["PENDING", "ACCEPTED", "REJECTED"] } },
        include: { child: { include: NEEDS_INCLUDE } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.payment.aggregate({
        _sum: { payeeAmount: true },
        where: { payeeUserId: userId, status: "PAID", paidAt: { gte: monthStart } },
      }),
      prisma.payment.aggregate({
        _sum: { payeeAmount: true },
        where: { payeeUserId: userId, status: "PAID", paidAt: { gte: weekStart } },
      }),
      prisma.payment.aggregate({
        _sum: { payeeAmount: true },
        where: { payeeUserId: userId, status: "PAID", paidAt: { gte: lastWeekStart, lt: weekStart } },
      }),
      prisma.session.count({
        where: { engagement: { teacherUserId: userId }, status: "DONE", startAt: { gte: monthStart } },
      }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

  const children = engagements.map((e) => presentChild(e.child));
  const selected = children.find((c) => c.id === req.query.childId) ?? children[0] ?? null;
  const target = user.teacherProfile?.sessionTarget ?? 16;
  const thisWeek = weekPaid._sum.payeeAmount ?? 0;
  const lastWeek = lastWeekPaid._sum.payeeAmount ?? 0;

  res.json({
    greeting: { name: user.nickname ?? user.fullName, avatarUrl: user.avatarUrl },
    verified: user.teacherProfile?.verificationStatus === "VERIFIED",
    verificationStatus: user.teacherProfile?.verificationStatus ?? "UNVERIFIED",
    points: user.points,
    unreadNotifications: unread,
    children,
    selectedChildId: selected?.id ?? null,
    todaySchedule: todaySessions.map((s) => ({
      sessionId: s.id,
      time: hhmm(s.startAt),
      childName: s.engagement.child.name,
      location: s.location ?? s.engagement.location,
    })),
    applications: applications.map((a) => {
      const child = presentChild(a.child);
      return {
        id: a.id,
        childId: a.childId,
        name: initials(a.child.fullName),
        grade: child.grade,
        condition: child.needs[0]?.label ?? child.condition,
        status: a.status,
        date: shortDate(a.createdAt),
      };
    }),
    earnings: {
      month: monthPaid._sum.payeeAmount ?? 0,
      weekGrowthPercent: lastWeek === 0 ? (thisWeek > 0 ? 100 : 0) : Math.round(((thisWeek - lastWeek) / lastWeek) * 100),
    },
    sessions: { doneThisMonth, target, percent: Math.min(100, Math.round((doneThisMonth / target) * 100)) },
    checkin: selected ? await weekCheckins(userId, selected.id) : null,
    profileName: displayName(user, user.teacherProfile?.title),
  });
});
