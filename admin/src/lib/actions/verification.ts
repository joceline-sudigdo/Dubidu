"use server";

import { revalidatePath } from "next/cache";

import { decideApplication, getApplication } from "@/lib/api";

import { adminAction, requireText, text, type ActionState } from "./helpers";

const ACTION = {
  VERIFIED: "TEACHER_VERIFIED",
  REVISION: "TEACHER_REVISION_REQUESTED",
  REJECTED: "TEACHER_REJECTED",
} as const;

// keputusan akhir admin atas pengajuan shadow teacher (rekomendasi psikolog hanya bahan pertimbangan)
export async function decideTeacher(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id");
  const decision = text(fd, "decision") as keyof typeof ACTION;
  const issues = fd.getAll("issues").map(String);

  return adminAction(async () => {
    if (!(decision in ACTION)) throw new Error("Keputusan tidak dikenal.");
    const app = await getApplication(id);
    if (!app) throw new Error("Pengajuan tidak ditemukan.");
    if (app.status === "VERIFIED" || app.status === "REJECTED") throw new Error("Pengajuan ini sudah diputuskan.");

    let reason = text(fd, "reason");
    if (decision === "REVISION") {
      if (issues.length === 0 && !reason) throw new Error("Pilih minimal satu catatan revisi atau tulis alasannya.");
      reason = [issues.join("; "), reason].filter(Boolean).join(" — ");
    }
    if (decision === "REJECTED") requireText(reason, "Alasan penolakan", 5);

    await decideApplication(id, decision, reason);
    revalidatePath("/verifikasi");
    revalidatePath(`/verifikasi/${id}`);
    revalidatePath("/");
    return { action: ACTION[decision], targetType: "TEACHER", targetId: app.userId, targetLabel: app.fullName, reason };
  });
}
