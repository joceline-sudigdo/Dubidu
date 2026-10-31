import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { hhmm, shortDate, wibDate } from "../lib/dates.js";
import { forbidden, HttpError, notFound, param, parse } from "../lib/http.js";
import { notify } from "../lib/notify.js";
import { displayName, initials } from "../lib/present.js";
import { emitToUser } from "../lib/realtime.js";

export const chatRouter = Router();
chatRouter.use(requireAuth);

const ROLE_LABEL = { TEACHER: "Shadow Teacher", PSYCHOLOGIST: "Psikolog Anak", PARENT: "Orang Tua", ADMIN: "Admin Dubidu" };

/** "09:42" kalau hari ini, "Kemarin", atau "10 Agu 2026" */
function chatTime(date: Date) {
  const today = wibDate().getTime();
  const day = wibDate(date).getTime();
  if (day === today) return hhmm(date);
  if (day === today - 86400000) return "Kemarin";
  return shortDate(date);
}

async function loadConversation(id: string, userId: string) {
  const convo = await prisma.conversation.findUnique({
    where: { id },
    include: { participants: true },
  });
  if (!convo) throw notFound("Percakapan");
  if (!convo.participants.some((p) => p.userId === userId)) throw forbidden();
  return convo;
}

/** Teacher hanya melihat inisial anak sampai pengajuan diterima / ada kontrak (privasi anak). */
async function childLabel(child: { id: string; name: string; fullName: string }, viewerId: string, role: string) {
  if (role !== "TEACHER") return child.name;
  const allowed = await prisma.application.findFirst({
    where: { childId: child.id, teacherUserId: viewerId, status: "ACCEPTED" },
    select: { id: true },
  });
  return allowed ? child.name : initials(child.fullName);
}

/** GET /api/conversations — daftar chat (tab Chat) */
chatRouter.get("/", async (req, res) => {
  const userId = me(req).id;
  const convos = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      child: true,
      participants: { include: { user: { include: { teacherProfile: true, psychologistProfile: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = await Promise.all(
    convos.map(async (c) => {
      const mine = c.participants.find((p) => p.userId === userId)!;
      const partner = c.participants.find((p) => p.userId !== userId)?.user;
      const last = c.messages[0];
      const unread = await prisma.message.count({
        where: { conversationId: c.id, senderId: { not: userId }, createdAt: { gt: mine.lastReadAt } },
      });
      return {
        id: c.id,
        type: c.type,
        partner: partner && {
          id: partner.id,
          name: displayName(partner, partner.teacherProfile?.title),
          role: ROLE_LABEL[partner.role],
          avatarUrl: partner.avatarUrl,
          verified:
            partner.teacherProfile?.verificationStatus === "VERIFIED" || partner.role === "PSYCHOLOGIST",
        },
        child: c.child ? await childLabel(c.child, userId, me(req).role) : null,
        preview: last ? (last.type === "TEXT" ? last.text : last.type === "IMAGE" ? "📷 Foto" : "📅 Jadwal sesi") : "",
        time: last ? chatTime(last.createdAt) : chatTime(c.createdAt),
        unread,
      };
    }),
  );
  res.json(result);
});

/** GET /api/conversations/:id/messages?before=<ISO>&limit=50 */
chatRouter.get("/:id/messages", async (req, res) => {
  const userId = me(req).id;
  await loadConversation(param(req, "id"), userId);
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const before = req.query.before ? new Date(String(req.query.before)) : undefined;

  const rows = await prisma.message.findMany({
    where: { conversationId: param(req, "id"), createdAt: before ? { lt: before } : undefined },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const partner = await prisma.conversationParticipant.findFirst({
    where: { conversationId: param(req, "id"), userId: { not: userId } },
  });

  res.json(
    rows.reverse().map((m) => ({
      id: m.id,
      from: m.senderId === userId ? "me" : "them",
      type: m.type.toLowerCase(),
      text: m.text,
      uri: m.imageUrl,
      ...(m.schedule as object | null),
      time: hhmm(m.createdAt),
      createdAt: m.createdAt,
      read: m.senderId === userId && partner ? partner.lastReadAt >= m.createdAt : undefined,
    })),
  );
});

const messageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("TEXT"), text: z.string().trim().min(1).max(4000) }),
  z.object({ type: z.literal("IMAGE"), imageUrl: z.string().url() }),
  z.object({
    type: z.literal("SCHEDULE"),
    schedule: z.object({ title: z.string(), date: z.string(), hours: z.string(), place: z.string() }),
  }),
]);

/** POST /api/conversations/:id/messages { type: "TEXT", text } */
chatRouter.post("/:id/messages", async (req, res) => {
  const sender = me(req);
  const convo = await loadConversation(param(req, "id"), sender.id);
  const body = parse(messageSchema, req.body);
  const message = await sendMessage(convo.id, sender.id, body);
  res.status(201).json({ ...message, from: "me", time: hhmm(message.createdAt) });
});

type OutgoingMessage = z.infer<typeof messageSchema>;

/**
 * Kirim pesan ke percakapan: simpan, kirim realtime, dan beri notifikasi ke peserta lain.
 * Dipakai juga oleh tombol "Hubungkan" (pesan penawaran) dan "Terima Tawaran" (pesan balasan).
 */
export async function sendMessage(conversationId: string, senderId: string, body: OutgoingMessage) {
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      type: body.type,
      text: body.type === "TEXT" ? body.text : null,
      imageUrl: body.type === "IMAGE" ? body.imageUrl : null,
      schedule: body.type === "SCHEDULE" ? body.schedule : undefined,
    },
  });
  await prisma.$transaction([
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: senderId } },
      data: { lastReadAt: message.createdAt },
    }),
  ]);

  const [senderUser, participants] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: senderId } }),
    prisma.conversationParticipant.findMany({ where: { conversationId } }),
  ]);
  for (const p of participants) {
    if (p.userId === senderId) continue;
    emitToUser(p.userId, "message:new", { conversationId, message });
    await notify({
      userId: p.userId,
      category: "CHAT",
      icon: "message-text",
      tone: "blue",
      title: `${senderUser.fullName} membalas`,
      body: body.type === "TEXT" ? body.text.slice(0, 140) : body.type === "IMAGE" ? "Mengirim foto" : "Mengirim jadwal sesi",
      tag: "Pesan",
      action: "Balas Pesan",
      link: `/chat/${conversationId}`,
    });
  }
  return message;
}

/** POST /api/conversations/:id/read — tandai sudah dibaca */
chatRouter.post("/:id/read", async (req, res) => {
  const userId = me(req).id;
  const convo = await loadConversation(param(req, "id"), userId);
  const now = new Date();
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: convo.id, userId } },
    data: { lastReadAt: now },
  });
  for (const p of convo.participants) {
    if (p.userId !== userId) emitToUser(p.userId, "message:read", { conversationId: convo.id, readAt: now });
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
//  Respon cepat (pertanyaan Ya/Tidak dari teacher ke orang tua)
// ---------------------------------------------------------------------------

export const quickQuestionsRouter = Router();
quickQuestionsRouter.use(requireAuth);

/** GET /api/quick-questions?pending=true */
quickQuestionsRouter.get("/", async (req, res) => {
  const user = me(req);
  const rows = await prisma.quickQuestion.findMany({
    where: {
      ...(user.role === "TEACHER" ? { teacherId: user.id } : { parentId: user.id }),
      ...(req.query.pending === "true" ? { answer: null } : {}),
    },
    include: { teacher: true, child: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  res.json(
    rows.map((q) => ({
      id: q.id,
      from: q.teacher.fullName,
      childName: q.child.name,
      text: q.text,
      answer: q.answer,
      answeredAt: q.answeredAt,
      createdAt: q.createdAt,
    })),
  );
});

/** POST /api/quick-questions { childId, text } — teacher bertanya ke orang tua */
quickQuestionsRouter.post("/", requireRole("TEACHER"), async (req, res) => {
  const body = parse(z.object({ childId: z.string(), text: z.string().trim().min(3).max(300) }), req.body);
  const engagement = await prisma.engagement.findFirst({
    where: { childId: body.childId, teacherUserId: me(req).id, status: "ACTIVE" },
    include: { child: true },
  });
  if (!engagement) throw new HttpError(403, "Kamu belum punya kontrak aktif dengan anak ini");
  const q = await prisma.quickQuestion.create({
    data: { teacherId: me(req).id, parentId: engagement.parentId, childId: body.childId, text: body.text },
  });
  await notify({
    userId: engagement.parentId,
    category: "CHAT",
    icon: "help-circle",
    tone: "yellow",
    title: "Pertanyaan cepat dari teacher",
    body: body.text,
    tag: engagement.child.name,
    action: "Jawab",
    link: "/beranda",
  });
  res.status(201).json(q);
});

/** POST /api/quick-questions/:id/answer { answer: "YES" | "NO" } — tombol "Ya, boleh!" / "Tidak hari ini" */
quickQuestionsRouter.post("/:id/answer", requireRole("PARENT"), async (req, res) => {
  const { answer } = parse(z.object({ answer: z.enum(["YES", "NO"]) }), req.body);
  const q = await prisma.quickQuestion.findUnique({ where: { id: param(req, "id") }, include: { child: true } });
  if (!q) throw notFound("Pertanyaan");
  if (q.parentId !== me(req).id) throw forbidden();
  if (q.answer) throw new HttpError(409, "Pertanyaan ini sudah dijawab");

  const updated = await prisma.quickQuestion.update({
    where: { id: q.id },
    data: { answer, answeredAt: new Date() },
  });
  await notify({
    userId: q.teacherId,
    category: "CHAT",
    icon: answer === "YES" ? "check-circle" : "close-circle",
    tone: answer === "YES" ? "green" : "red",
    title: answer === "YES" ? "Orang tua menjawab: Ya, boleh!" : "Orang tua menjawab: Tidak hari ini",
    body: `"${q.text}"`,
    tag: q.child.name,
  });
  res.json(updated);
});

