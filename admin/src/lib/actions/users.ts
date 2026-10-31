"use server";

import { revalidatePath } from "next/cache";

import { createAuditLog, createPsychologist, getUser, setUserActive } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { ROLE } from "@/lib/labels";

import { adminAction, clientIp, num, requireText, text, type ActionState } from "./helpers";

// nonaktifkan / aktifkan akun (alasan wajib, tercatat di audit log)
export async function setUserStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id");
  const activate = text(fd, "activate") === "true";
  return adminAction(async () => {
    const reason = requireText(text(fd, "reason"), "Alasan", 5);
    const user = await getUser(id);
    if (!user) throw new Error("Pengguna tidak ditemukan.");
    await setUserActive(id, activate, reason);
    revalidatePath("/pengguna");
    revalidatePath(`/pengguna/${id}`);
    revalidatePath("/");
    return {
      action: activate ? "USER_ACTIVATED" : "USER_SUSPENDED",
      targetType: "USER",
      targetId: id,
      targetLabel: `${user.fullName} (${ROLE[user.role]})`,
      reason,
    };
  });
}

export type CreatePsychologistState =
  | { ok: true; userId: string; email: string; tempPassword: string }
  | { ok?: false; error: string }
  | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// buat akun psikolog mitra (psikolog tidak bisa daftar sendiri)
export async function createPsychologistAction(_: CreatePsychologistState, fd: FormData): Promise<CreatePsychologistState> {
  const admin = await getCurrentAdmin();
  try {
    const email = text(fd, "email").toLowerCase();
    if (!EMAIL_RE.test(email)) throw new Error("Format email belum benar.");
    const phone = text(fd, "phone").replace(/\D/g, "");
    if (phone.length < 10) throw new Error("Nomor HP minimal 10 digit.");
    const basePrice = num(fd, "basePrice");
    if (basePrice < 50000) throw new Error("Tarif konsultasi minimal Rp50.000.");
    const discountPercent = num(fd, "discountPercent");
    if (discountPercent < 0 || discountPercent > 50) throw new Error("Diskon antara 0–50%.");
    const categories = fd.getAll("categories").map(String);
    if (categories.length === 0) throw new Error("Pilih minimal satu kategori keahlian.");

    const { user, tempPassword } = await createPsychologist({
      fullName: requireText(text(fd, "fullName"), "Nama lengkap", 3),
      email,
      phone,
      title: requireText(text(fd, "title"), "Gelar / jabatan"),
      place: text(fd, "place"),
      experienceYears: num(fd, "experienceYears"),
      basePrice,
      discountPercent,
      durationMinutes: num(fd, "durationMinutes") || 45,
      categories,
    });

    await createAuditLog({
      actorId: admin.id,
      actorName: admin.fullName,
      action: "PSYCHOLOGIST_CREATED",
      targetType: "USER",
      targetId: user.id,
      targetLabel: `${user.fullName} (${email})`,
      reason: null,
      ipAddress: await clientIp(),
    });
    revalidatePath("/pengguna");
    return { ok: true, userId: user.id, email, tempPassword };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal membuat akun." };
  }
}
