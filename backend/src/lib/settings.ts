import { z } from "zod";

import type { NotificationCategory } from "../db.js";

/** Preferensi notifikasi user (halaman Pengaturan di aplikasi) */
export const settingsSchema = z.object({
  notifPush: z.boolean(), // semua push notification
  notifChat: z.boolean(), // pesan chat baru
  notifReport: z.boolean(), // laporan sesi, booking & pengingat jadwal
  notifPromo: z.boolean(), // promo & info (kategori LAINNYA)
});
export type UserSettings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: UserSettings = { notifPush: true, notifChat: true, notifReport: true, notifPromo: false };

/** Kolom User.settings (JSON, bisa null / sebagian) → preferensi lengkap */
export function readSettings(value: unknown): UserSettings {
  const parsed = settingsSchema.partial().safeParse(value ?? {});
  return { ...DEFAULT_SETTINGS, ...(parsed.success ? parsed.data : {}) };
}

/** Boleh kirim push untuk kategori ini? Notifikasi tetap tersimpan di halaman Notifikasi. */
export function allowsPush(settings: UserSettings, category: NotificationCategory) {
  if (!settings.notifPush) return false;
  if (category === "CHAT") return settings.notifChat;
  if (category === "LAPORAN" || category === "BOOKING") return settings.notifReport;
  // LAINNYA dipakai juga untuk kabar penting (verifikasi, pembayaran), jadi tetap dikirim
  return true;
}
