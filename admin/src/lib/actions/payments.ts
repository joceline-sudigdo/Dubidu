"use server";

import { revalidatePath } from "next/cache";

import { confirmPayment, getPayment, listPaymentMethods, rejectPayment, savePaymentMethod } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import type { PaymentMethodType } from "@/types/finance";

import { adminAction, bool, requireText, text, type ActionState } from "./helpers";

function refresh(id?: string) {
  revalidatePath("/pembayaran");
  if (id) revalidatePath(`/pembayaran/${id}`);
  revalidatePath("/");
}

// bukti transfer cocok dengan mutasi rekening → lunas
export async function confirmPaymentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id");
  return adminAction(async () => {
    const p = await getPayment(id);
    if (!p) throw new Error("Pembayaran tidak ditemukan.");
    await confirmPayment(id);
    refresh(id);
    return {
      action: "PAYMENT_CONFIRMED",
      targetType: "PAYMENT",
      targetId: id,
      targetLabel: `${p.invoiceNo} · ${formatRupiah(p.amountDue ?? p.amount)}`,
      reason: text(fd, "reason"),
    };
  });
}

// bukti tidak cocok → kembali menunggu transfer, user bisa unggah ulang
export async function rejectPaymentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id");
  return adminAction(async () => {
    const reason = requireText(text(fd, "reason"), "Alasan penolakan", 5);
    const p = await getPayment(id);
    if (!p) throw new Error("Pembayaran tidak ditemukan.");
    await rejectPayment(id, reason);
    refresh(id);
    return { action: "PAYMENT_REJECTED", targetType: "PAYMENT", targetId: id, targetLabel: p.invoiceNo, reason };
  });
}

// tambah / ubah tujuan transfer yang tampil di aplikasi
export async function savePaymentMethodAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id") || undefined;
  return adminAction(async () => {
    const type = text(fd, "type") as PaymentMethodType;
    if (type !== "QRIS" && type !== "BANK_TRANSFER") throw new Error("Jenis tujuan transfer tidak dikenal.");
    const label = requireText(text(fd, "label"), "Nama tampilan");
    const accountName = requireText(text(fd, "accountName"), "Nama pemilik");
    const bankName = text(fd, "bankName") || null;
    const accountNumber = text(fd, "accountNumber").replace(/\D/g, "") || null;
    if (type === "BANK_TRANSFER" && (!bankName || !accountNumber)) throw new Error("Nama bank dan nomor rekening wajib diisi.");
    const previous = id ? (await listPaymentMethods()).find((m) => m.id === id) : undefined;
    if (type === "QRIS" && !text(fd, "qrImageUrl") && !text(fd, "qrisPayload") && !previous?.qrImageUrl) {
      throw new Error("Isi teks QRIS atau URL gambar QR.");
    }

    const saved = await savePaymentMethod({
      id,
      type,
      label,
      accountName,
      bankName: type === "BANK_TRANSFER" ? bankName : null,
      accountNumber: type === "BANK_TRANSFER" ? accountNumber : null,
      // kolom dikosongkan saat mengubah → gambar QR yang lama tetap dipakai
      qrImageUrl: type === "QRIS" ? text(fd, "qrImageUrl") || previous?.qrImageUrl || null : null,
      qrisPayload: type === "QRIS" ? text(fd, "qrisPayload").replace(/\s+/g, "") || null : null,
      instructions: text(fd, "instructions") || null,
      active: bool(fd, "active"),
    });
    revalidatePath("/pembayaran/tujuan");
    return {
      action: id ? "PAYMENT_METHOD_UPDATED" : "PAYMENT_METHOD_CREATED",
      targetType: "PAYMENT_METHOD",
      targetId: saved.id,
      targetLabel: `${saved.label}${saved.active ? "" : " (nonaktif)"}`,
      reason: text(fd, "reason"),
    };
  });
}
