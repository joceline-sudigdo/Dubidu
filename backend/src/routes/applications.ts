import { Router } from "express";
import { z } from "zod";

import { prisma, type Prisma } from "../db.js";
import { ensureConversation } from "../lib/access.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { shortDate } from "../lib/dates.js";
import { forbidden, HttpError, notFound, param, parse } from "../lib/http.js";
import { notify } from "../lib/notify.js";
import { sendMessage } from "./chat.js";
import { displayName, initials, presentChild } from "../lib/present.js";

export const applicationsRouter = Router();
applicationsRouter.use(requireAuth, requireRole("PARENT", "TEACHER"));

const INCLUDE = {
  child: { include: { needs: { include: { needOption: true } } } },
  teacher: { include: { teacherProfile: true } },
} as const;

type AppRow = Prisma.ApplicationGetPayload<{ include: typeof INCLUDE }>;

function present(a: AppRow, viewerRole: string) {
  const child = presentChild(a.child);
  // teacher hanya melihat inisial anak sampai pengajuan diterima
  const hideChild = viewerRole === "TEACHER" && a.status !== "ACCEPTED";
  return {
    id: a.id,
    status: a.status,
    initiatedBy: a.initiatedBy,
    message: a.message,
    date: shortDate(a.createdAt),
    createdAt: a.createdAt,
    child: {
      id: child.id,
      name: hideChild ? initials(a.child.fullName) : child.name,
      grade: child.grade,
      age: child.age,
      gender: child.gender,
      condition: child.condition,
      needs: child.needs,
    },
    teacher: {
      id: a.teacherUserId,
      name: displayName(a.teacher, a.teacher.teacherProfile?.title),
      avatarUrl: a.teacher.avatarUrl,
      specialty: a.teacher.teacherProfile?.headline ?? null,
      verified: a.teacher.teacherProfile?.verificationStatus === "VERIFIED",
    },
  };
}

/** GET /api/applications?status=PENDING — riwayat pengajuan (tab Riwayat / Pengajuan Aktif) */
applicationsRouter.get("/", async (req, res) => {
  const user = me(req);
  const status = req.query.status ? parse(z.enum(["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"]), req.query.status) : undefined;
  const rows = await prisma.application.findMany({
    where: {
      status,
      ...(user.role === "TEACHER" ? { teacherUserId: user.id } : { child: { parentId: user.id } }),
    },
    include: INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  res.json(rows.map((a) => present(a, user.role)));
});

/** GET /api/applications/:id */
applicationsRouter.get("/:id", async (req, res) => {
  const user = me(req);
  const a = await prisma.application.findUnique({ where: { id: param(req, "id") }, include: INCLUDE });
  if (!a) throw notFound("Pengajuan");
  if (a.teacherUserId !== user.id && a.child.parentId !== user.id) throw forbidden();
  res.json(present(a, user.role));
});

/**
 * PATCH /api/applications/:id { status }
 * - pihak penerima: ACCEPTED / REJECTED
 * - pihak pengaju: CANCELLED
 * Saat ACCEPTED → room chat otomatis dibuat.
 */
applicationsRouter.patch("/:id", async (req, res) => {
  const user = me(req);
  const { status } = parse(z.object({ status: z.enum(["ACCEPTED", "REJECTED", "CANCELLED"]) }), req.body);
  const a = await prisma.application.findUnique({ where: { id: param(req, "id") }, include: INCLUDE });
  if (!a) throw notFound("Pengajuan");

  const isTeacher = a.teacherUserId === user.id;
  const isParent = a.child.parentId === user.id;
  if (!isTeacher && !isParent) throw forbidden();
  if (a.status !== "PENDING") throw new HttpError(409, "Pengajuan ini sudah diproses");

  const isInitiator = (a.initiatedBy === "TEACHER" && isTeacher) || (a.initiatedBy === "PARENT" && isParent);
  if (status === "CANCELLED" && !isInitiator) throw new HttpError(400, "Hanya pengaju yang bisa membatalkan");
  if (status !== "CANCELLED" && isInitiator) throw new HttpError(400, "Tunggu jawaban dari pihak lain");

  const updated = await prisma.application.update({
    where: { id: a.id },
    data: { status, respondedAt: new Date() },
    include: INCLUDE,
  });

  let conversationId: string | null = null;
  if (status === "ACCEPTED") {
    const convo = await ensureConversation("TEACHER", a.child.parentId, a.teacherUserId, a.childId);
    conversationId = convo.id;
    // pesan balasan otomatis (tombol "Terima Tawaran")
    const parent = await prisma.user.findUniqueOrThrow({ where: { id: a.child.parentId } });
    const text = isTeacher
      ? `Halo ${parent.nickname ?? parent.fullName.split(" ")[0]}! Saya ${displayName(a.teacher, a.teacher.teacherProfile?.title)}, saya menerima tawaran pendampingan untuk ${a.child.name}. Kapan kita bisa atur jadwal observasi pertama?`
      : `Halo Kak ${a.teacher.nickname ?? a.teacher.fullName.split(" ")[0]}! Terima kasih sudah menawarkan diri untuk ${a.child.name}. Yuk kita atur jadwal observasi pertama.`;
    await sendMessage(convo.id, user.id, { type: "TEXT", text });
  }

  const otherUserId = isTeacher ? a.child.parentId : a.teacherUserId;
  if (status !== "CANCELLED") {
    await notify({
      userId: otherUserId,
      category: "LAINNYA",
      icon: status === "ACCEPTED" ? "check-circle" : "close-circle",
      tone: status === "ACCEPTED" ? "green" : "red",
      title: status === "ACCEPTED" ? "Pengajuan diterima 🎉" : "Pengajuan ditolak",
      body:
        status === "ACCEPTED"
          ? `Pengajuan untuk ${a.child.name} diterima. Yuk mulai diskusi jadwal & kesepakatan lewat chat.`
          : `Pengajuan untuk ${a.child.name} belum bisa diterima. Tetap semangat mencari kecocokan lain!`,
      tag: "Pengajuan",
      action: status === "ACCEPTED" ? "Buka Chat" : undefined,
      link: conversationId ? `/chat/${conversationId}` : undefined,
    });
  }

  res.json({ ...present(updated, user.role), conversationId });
});
