import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db.js";
import { me, requireAuth } from "../lib/auth.js";
import { notFound, parse } from "../lib/http.js";
import { notifyAdmins } from "../lib/notify.js";

// Tombol "Laporkan" di aplikasi (postingan, komentar, akun, percakapan) → antrian moderasi web admin.
export const contentReportsRouter = Router();
contentReportsRouter.use(requireAuth);

const clip = (text: string, n = 80) => (text.length > n ? `${text.slice(0, n - 1)}…` : text);

/** POST /api/content-reports { targetType, targetId, reason, detail? } */
contentReportsRouter.post("/", async (req, res) => {
  const body = parse(
    z.object({
      targetType: z.enum(["POST", "COMMENT", "USER", "CONVERSATION"]),
      targetId: z.string().min(1),
      reason: z.string().trim().min(3).max(100),
      detail: z.string().trim().max(1000).optional(),
    }),
    req.body,
  );
  const userId = me(req).id;

  // ringkasan target untuk admin — untuk percakapan, isi chat TIDAK ikut disimpan
  let targetLabel: string;
  let targetUserId: string | null = null;
  if (body.targetType === "POST") {
    const post = await prisma.communityPost.findUnique({ where: { id: body.targetId } });
    if (!post) throw notFound("Postingan");
    targetLabel = clip(post.text);
    targetUserId = post.authorId;
  } else if (body.targetType === "COMMENT") {
    const comment = await prisma.postComment.findUnique({ where: { id: body.targetId } });
    if (!comment) throw notFound("Komentar");
    targetLabel = clip(comment.text);
    targetUserId = comment.authorId;
  } else if (body.targetType === "USER") {
    const user = await prisma.user.findUnique({ where: { id: body.targetId } });
    if (!user) throw notFound("Akun");
    targetLabel = user.fullName;
    targetUserId = user.id;
  } else {
    const convo = await prisma.conversation.findFirst({
      where: { id: body.targetId, participants: { some: { userId } } },
      include: { participants: { include: { user: true } } },
    });
    if (!convo) throw notFound("Percakapan");
    const other = convo.participants.find((p) => p.userId !== userId)?.user;
    targetLabel = `Percakapan dengan ${other?.fullName ?? "pengguna"}`;
    targetUserId = other?.id ?? null;
  }

  const report = await prisma.contentReport.create({
    data: { reporterId: userId, ...body, targetLabel, targetUserId },
  });
  await notifyAdmins({
    category: "LAINNYA",
    icon: "flag",
    tone: "red",
    title: "Laporan konten baru",
    body: `${body.reason}: ${targetLabel}`,
    tag: "Moderasi",
  });
  res.status(201).json({ id: report.id, status: report.status });
});
