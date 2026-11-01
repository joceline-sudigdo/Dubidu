import type { StatusTone } from "@/components/shared/status-badge";
import type { ModerationStatus, ReportStatus, ReportTargetType } from "@/types/community";
import type { RedemptionStatus } from "@/types/content";
import type { PaymentPurpose, PaymentStatus, PayoutStatus } from "@/types/finance";
import type { AppUser } from "@/types/user";
import type { DecisionStatus, PsychologistReview } from "@/types/verification";

type Label = { label: string; tone: StatusTone };

// label & warna status yang dipakai di banyak halaman
export const DECISION: Record<DecisionStatus, Label> = {
  PENDING: { label: "Menunggu", tone: "warning" },
  REVISION: { label: "Perlu revisi", tone: "brand" },
  VERIFIED: { label: "Terverifikasi", tone: "success" },
  REJECTED: { label: "Ditolak", tone: "danger" },
};

export const RECOMMENDATION: Record<PsychologistReview["recommendation"], Label> = {
  verified: { label: "Disarankan verifikasi", tone: "success" },
  revision: { label: "Disarankan revisi", tone: "warning" },
  rejected: { label: "Disarankan tolak", tone: "danger" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, Label> = {
  PENDING: { label: "Menunggu transfer", tone: "neutral" },
  VERIFYING: { label: "Perlu dicek", tone: "warning" },
  PAID: { label: "Lunas", tone: "success" },
  FAILED: { label: "Gagal", tone: "danger" },
  EXPIRED: { label: "Kedaluwarsa", tone: "neutral" },
};

export const PAYMENT_PURPOSE: Record<PaymentPurpose, string> = {
  CONSULTATION: "Konsultasi",
  ENGAGEMENT: "Kontrak",
  SUBSCRIPTION: "Dubidu Plus",
};

export const PAYOUT_STATUS: Record<PayoutStatus, Label> = {
  PENDING: { label: "Menunggu", tone: "warning" },
  TRANSFERRED: { label: "Ditransfer", tone: "success" },
  REJECTED: { label: "Ditolak", tone: "danger" },
};

export const ROLE: Record<AppUser["role"] | "TEACHER" | "PSYCHOLOGIST", string> = {
  PARENT: "Orang Tua",
  TEACHER: "Shadow Teacher",
  PSYCHOLOGIST: "Psikolog",
};

export const MODERATION: Record<ModerationStatus, Label> = {
  VISIBLE: { label: "Tampil", tone: "success" },
  HIDDEN: { label: "Disembunyikan", tone: "danger" },
};

export const REPORT_STATUS: Record<ReportStatus, Label> = {
  OPEN: { label: "Baru", tone: "warning" },
  RESOLVED: { label: "Ditindak", tone: "success" },
  DISMISSED: { label: "Diabaikan", tone: "neutral" },
};

export const REPORT_TARGET: Record<ReportTargetType, string> = {
  POST: "Postingan",
  COMMENT: "Komentar",
  USER: "Akun",
  CONVERSATION: "Percakapan",
};

export const REDEMPTION_STATUS: Record<RedemptionStatus, Label> = {
  ACTIVE: { label: "Aktif", tone: "success" },
  USED: { label: "Terpakai", tone: "neutral" },
  CANCELLED: { label: "Dibatalkan", tone: "danger" },
};

// baca satu nilai searchParams
export const param = (sp: Record<string, string | string[] | undefined>, key: string) => {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? "";
};

// pilihan catatan saat meminta revisi verifikasi teacher
export const REVISION_ISSUES = [
  "Pengalaman belum relevan",
  "Perlu interview ulang",
  "Data diri tidak lengkap",
  "Dokumen buram / tidak terbaca",
  "Dokumen wajib belum diunggah",
];

// alasan menyembunyikan postingan / komentar / ulasan
export const HIDE_REASONS = ["Spam / promosi", "Ujaran kebencian / merendahkan", "Membagikan data pribadi", "Informasi medis menyesatkan", "Konten tidak pantas"];
