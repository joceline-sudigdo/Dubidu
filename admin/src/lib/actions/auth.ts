"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createAuditLog, verifyAdminCredentials } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { clearLoginAttempts, loginBlockedFor, recordFailedLogin } from "@/lib/rate-limit";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error?: string; email?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? null;
}

// hanya izinkan redirect ke path internal (cegah open redirect)
const safeNext = (value: FormDataEntryValue | null) =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "Format email belum benar.", email };
  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter.", email };

  const blocked = loginBlockedFor(email);
  if (blocked) return { error: `Terlalu banyak percobaan. Coba lagi dalam ${blocked} menit.`, email };

  const ip = await clientIp();
  const admin = await verifyAdminCredentials(email, password);
  if (!admin) {
    recordFailedLogin(email);
    await createAuditLog({
      actorId: null,
      actorName: "Tidak dikenal",
      action: "AUTH_LOGIN_FAILED",
      targetType: "ADMIN",
      targetId: null,
      targetLabel: email,
      reason: "Email atau kata sandi salah",
      ipAddress: ip,
    });
    return { error: "Email atau kata sandi salah.", email };
  }

  clearLoginAttempts(email);
  await createSession(admin.id);
  await createAuditLog({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "AUTH_LOGIN",
    targetType: "ADMIN",
    targetId: admin.id,
    targetLabel: admin.email,
    reason: null,
    ipAddress: ip,
  });
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  const admin = await getCurrentAdmin();
  await createAuditLog({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "AUTH_LOGOUT",
    targetType: "ADMIN",
    targetId: admin.id,
    targetLabel: admin.email,
    reason: null,
    ipAddress: await clientIp(),
  });
  await deleteSession();
  redirect("/login");
}
