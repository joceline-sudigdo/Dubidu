import { prisma } from "../db.js";
import type { AuthUser } from "./auth.js";
import { forbidden, notFound } from "./http.js";

/**
 * Siapa yang boleh melihat data seorang anak?
 * - orang tuanya
 * - teacher yang punya pengajuan / kontrak dengan anak itu
 * - psikolog yang punya konsultasi dengan anak itu
 * - admin
 */
export async function assertChildAccess(user: AuthUser, childId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) throw notFound("Anak");
  if (user.role === "ADMIN" || child.parentId === user.id) return child;

  if (user.role === "TEACHER") {
    const link = await prisma.application.findFirst({
      where: { childId, teacherUserId: user.id, status: { in: ["PENDING", "ACCEPTED"] } },
      select: { id: true },
    });
    const engagement = await prisma.engagement.findFirst({
      where: { childId, teacherUserId: user.id },
      select: { id: true },
    });
    if (link || engagement) return child;
  }

  if (user.role === "PSYCHOLOGIST") {
    const consultation = await prisma.consultation.findFirst({
      where: { childId, psychologist: { userId: user.id } },
      select: { id: true },
    });
    if (consultation) return child;
  }

  throw forbidden();
}

/** Anak milik orang tua yang sedang login (untuk aksi tulis). */
export async function assertOwnChild(user: AuthUser, childId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) throw notFound("Anak");
  if (child.parentId !== user.id) throw forbidden();
  return child;
}

/** Cari atau buat percakapan antara dua user (opsional terkait satu anak). */
export async function ensureConversation(
  type: "TEACHER" | "PSYCHOLOGIST",
  userA: string,
  userB: string,
  childId?: string | null,
) {
  const existing = await prisma.conversation.findFirst({
    where: {
      type,
      childId: childId ?? null,
      AND: [{ participants: { some: { userId: userA } } }, { participants: { some: { userId: userB } } }],
    },
  });
  if (existing) return existing;
  return prisma.conversation.create({
    data: {
      type,
      childId: childId ?? null,
      participants: { create: [{ userId: userA }, { userId: userB }] },
    },
  });
}

/**
 * Akun demo (dari seed) dan akun sungguhan hidup di dunia terpisah:
 * akun demo hanya melihat sesama demo, user sungguhan hanya melihat user sungguhan.
 * Dipakai untuk rekomendasi matching, daftar psikolog, booking, profil teacher, dan komunitas.
 */
export async function isDemoUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isDemo: true } });
  return user?.isDemo ?? false;
}

/** Lempar 404 kalau `targetIsDemo` berbeda dunia dengan user yang sedang login (admin bebas). */
export async function assertSameWorld(viewer: AuthUser, targetIsDemo: boolean, what: string) {
  if (viewer.role === "ADMIN") return;
  if ((await isDemoUser(viewer.id)) !== targetIsDemo) throw notFound(what);
}
