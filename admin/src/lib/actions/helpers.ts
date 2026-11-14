import "server-only";

import { headers } from "next/headers";

import { createAuditLog, NotFoundError } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import type { AuditAction, AuditTargetType } from "@/types/audit";

// hasil Server Action untuk form di client (useActionState)
export type ActionState = { ok?: boolean; error?: string; message?: string } | undefined;

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? null;
}

type AuditInput = {
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string | null;
  targetLabel: string;
  reason?: string | null;
};

// jalankan aksi admin: cek sesi → kerjakan → tulis audit log. Error jadi pesan untuk form.
export async function adminAction(
  run: (admin: Awaited<ReturnType<typeof getCurrentAdmin>>) => Promise<AuditInput & { message?: string }>
): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  try {
    const { message, ...entry } = await run(admin);
    await createAuditLog({
      ...entry,
      reason: entry.reason?.trim() || null,
      actorId: admin.id,
      actorName: admin.fullName,
      ipAddress: await clientIp(),
    });
    return { ok: true, message };
  } catch (e) {
    if (e instanceof NotFoundError || e instanceof Error) return { error: e.message };
    return { error: "Terjadi kesalahan. Coba lagi." };
  }
}

// pembaca FormData yang aman
export const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
export const num = (fd: FormData, key: string) => Number(text(fd, key).replace(/[^\d.-]/g, "")) || 0;
export const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "true";

export function requireText(value: string, label: string, min = 1) {
  if (value.length < min) throw new Error(min > 1 ? `${label} minimal ${min} karakter.` : `${label} wajib diisi.`);
  return value;
}
