import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db.js";
import { isDemoUser } from "../lib/access.js";
import { me, requireAuth } from "../lib/auth.js";
import { forbidden, notFound, param, parse } from "../lib/http.js";
import { notify } from "../lib/notify.js";

export const communityRouter = Router();
communityRouter.use(requireAuth);

const ROLE_LABEL = { PARENT: "Orang Tua", TEACHER: "Shadow Teacher", PSYCHOLOGIST: "Psikolog", ADMIN: "Admin Dubidu" } as const;

/** "Diposting 3 menit lalu" */
function postedAgo(date: Date) {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Diposting baru saja";
  if (minutes < 60) return `Diposting ${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Diposting ${hours} jam lalu`;
  return `Diposting ${Math.floor(hours / 24)} hari lalu`;
}

/** 3200 → "3,2rb" */
function compact(n: number) {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(1).replace(".", ",").replace(",0", "")}rb`;
}

/** GET /api/posts?topic=ADHD&cursor=<postId> — 20 post per halaman */
communityRouter.get("/", async (req, res) => {
  const userId = me(req).id;
  const topic = req.query.topic ? String(req.query.topic) : undefined;
  const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
  const posts = await prisma.communityPost.findMany({
    // feed hanya berisi post dari "dunia" yang sama (demo ↔ demo, nyata ↔ nyata)
    where: { topic, status: "VISIBLE", author: { isDemo: await isDemoUser(userId) } },
    include: {
      author: true,
      _count: { select: { likes: true, comments: { where: { status: "VISIBLE" } } } },
      likes: { where: { userId }, select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  res.json({
    nextCursor: posts.length === 20 ? posts[posts.length - 1]!.id : null,
    posts: posts.map((p) => ({
      id: p.id,
      author: p.author.nickname ?? p.author.fullName,
      authorRole: ROLE_LABEL[p.author.role],
      authorAvatarUrl: p.author.avatarUrl,
      isMine: p.authorId === userId,
      time: postedAgo(p.createdAt),
      createdAt: p.createdAt,
      text: p.text,
      photos: p.photos,
      likes: compact(p._count.likes),
      likeCount: p._count.likes,
      comments: compact(p._count.comments),
      commentCount: p._count.comments,
      likedByMe: p.likes.length > 0,
      topic: p.topic,
    })),
  });
});

/** POST /api/posts { text, topic, photos? } */
communityRouter.post("/", async (req, res) => {
  const body = parse(
    z.object({
      text: z.string().trim().min(3).max(3000),
      topic: z.string().min(1).max(40),
      photos: z.array(z.string().url()).max(6).default([]),
    }),
    req.body,
  );
  const post = await prisma.communityPost.create({ data: { ...body, authorId: me(req).id } });
  res.status(201).json(post);
});

/** DELETE /api/posts/:id — penulis atau admin */
communityRouter.delete("/:id", async (req, res) => {
  const post = await prisma.communityPost.findUnique({ where: { id: param(req, "id") } });
  if (!post) throw notFound("Post");
  if (post.authorId !== me(req).id && me(req).role !== "ADMIN") throw forbidden();
  await prisma.communityPost.delete({ where: { id: post.id } });
  res.status(204).end();
});

/** POST /api/posts/:id/like — toggle suka */
communityRouter.post("/:id/like", async (req, res) => {
  const userId = me(req).id;
  const key = { postId_userId: { postId: param(req, "id"), userId } };
  const existing = await prisma.postLike.findUnique({ where: key });
  if (existing) await prisma.postLike.delete({ where: key });
  else await prisma.postLike.create({ data: { postId: param(req, "id"), userId } });
  const likeCount = await prisma.postLike.count({ where: { postId: param(req, "id") } });
  res.json({ likedByMe: !existing, likeCount });
});

/** GET /api/posts/:id/comments */
communityRouter.get("/:id/comments", async (req, res) => {
  const rows = await prisma.postComment.findMany({
    where: { postId: param(req, "id"), status: "VISIBLE" },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(rows.map((c) => ({ id: c.id, author: c.author.nickname ?? c.author.fullName, authorRole: ROLE_LABEL[c.author.role], authorAvatarUrl: c.author.avatarUrl, isMine: c.authorId === me(req).id, text: c.text, time: postedAgo(c.createdAt) })));
});

/** POST /api/posts/:id/comments { text } */
communityRouter.post("/:id/comments", async (req, res) => {
  const { text } = parse(z.object({ text: z.string().trim().min(1).max(1000) }), req.body);
  const post = await prisma.communityPost.findUnique({ where: { id: param(req, "id") } });
  if (!post) throw notFound("Post");
  const comment = await prisma.postComment.create({ data: { postId: post.id, authorId: me(req).id, text } });
  if (post.authorId !== me(req).id) {
    const author = await prisma.user.findUniqueOrThrow({ where: { id: me(req).id } });
    await notify({
      userId: post.authorId,
      category: "LAINNYA",
      icon: "heart",
      tone: "red",
      title: "Dukungan Hangat di Komunitas",
      body: `${author.nickname ?? author.fullName} membalas ceritamu: "${text.slice(0, 80)}"`,
      tag: `Komunitas ${post.topic}`,
      action: "Buka Thread",
      link: `/postingan/${post.id}`,
    });
  }
  res.status(201).json(comment);
});
