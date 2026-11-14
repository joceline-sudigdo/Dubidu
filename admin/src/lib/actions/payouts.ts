"use server";

import { revalidatePath } from "next/cache";

import { listPayouts, markPayoutTransferred, rejectPayout } from "@/lib/api";
import { formatRupiah } from "@/lib/format";

import { adminAction, requireText, text, type ActionState } from "./helpers";

async function findPayout(id: string) {
  const p = (await listPayouts()).find((x) => x.id === id);
  if (!p) throw new Error("Pengajuan pencairan tidak ditemukan.");
  return p;
}

function refresh() {
  revalidatePath("/pencairan");
  revalidatePath("/");
}

// admin sudah mentransfer dana ke rekening pengguna → catat nomor referensi
export async function transferPayoutAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id");
  return adminAction(async () => {
    const ref = requireText(text(fd, "transferRef"), "Nomor referensi transfer", 4);
    const p = await findPayout(id);
    await markPayoutTransferred(id, ref);
    refresh();
    return {
      action: "PAYOUT_TRANSFERRED",
      targetType: "PAYOUT",
      targetId: id,
      targetLabel: `${p.userName} · ${formatRupiah(p.amount - p.fee)} ke ${p.bankName} ${p.accountNumberMasked}`,
      reason: [`Ref ${ref}`, text(fd, "reason")].filter(Boolean).join(" — "),
    };
  });
}

// tolak pencairan → saldo dikembalikan ke pengguna
export async function rejectPayoutAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id");
  return adminAction(async () => {
    const reason = requireText(text(fd, "reason"), "Alasan penolakan", 5);
    const p = await findPayout(id);
    await rejectPayout(id, reason);
    refresh();
    return { action: "PAYOUT_REJECTED", targetType: "PAYOUT", targetId: id, targetLabel: `${p.userName} · ${formatRupiah(p.amount)}`, reason };
  });
}
