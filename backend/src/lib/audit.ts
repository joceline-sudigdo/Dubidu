import type { Request } from "express";

import { prisma } from "../db.js";

export type AuditEntry = {
  action: string;
  targetType: string;
  targetId?: string | null;
  targetLabel: string;
  reason?: string | null;
};

/** IP asli pengguna (di belakang proxy Vercel) */
export const clientIp = (req: Request) =>
  String(req.headers["x-forwarded-for"] ?? "").split(",")[0]!.trim() || req.ip || null;

/** Tulis satu baris audit log admin. actorId null = percobaan login yang gagal. */
export async function writeAudit(req: Request, actor: { id: string; fullName: string } | null, entry: AuditEntry) {
  return prisma.adminAuditLog.create({
    data: {
      actorId: actor?.id ?? null,
      actorName: actor?.fullName ?? "Tidak dikenal",
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      targetLabel: entry.targetLabel,
      reason: entry.reason?.trim() || null,
      ipAddress: clientIp(req),
    },
  });
}
