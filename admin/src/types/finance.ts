// Mengikuti `Payment` & `PaymentMethod` di schema.prisma.
// `Payout` belum ada di skema → perlu tabel baru (lihat hasil audit).

export type PaymentPurpose = "CONSULTATION" | "ENGAGEMENT" | "SUBSCRIPTION";
export type PaymentStatus = "PENDING" | "VERIFYING" | "PAID" | "FAILED" | "EXPIRED";

export type Payment = {
  id: string;
  invoiceNo: string;
  userId: string;
  userName: string;
  purpose: PaymentPurpose;
  description: string; // "Konsultasi Amanda Putri" (tanpa nama anak)
  amount: number;
  uniqueCode: number | null;
  amountDue: number | null;
  status: PaymentStatus;
  manualMethodId: string | null;
  manualMethodLabel: string | null;
  proofUrl: string | null;
  proofSenderName: string | null;
  proofNote: string | null;
  proofSubmittedAt: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
};

export type PaymentMethodType = "QRIS" | "BANK_TRANSFER";

export type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  label: string;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string;
  qrImageUrl: string | null;
  instructions: string | null;
  active: boolean;
  order: number;
};

export type PayoutStatus = "PENDING" | "TRANSFERRED" | "REJECTED";

export type Payout = {
  id: string;
  userId: string;
  userName: string;
  role: "TEACHER" | "PSYCHOLOGIST";
  amount: number;
  fee: number;
  bankName: string;
  accountNumber?: string; // nomor lengkap, hanya untuk dialog transfer
  accountNumberMasked: string; // "•••• 4821"
  accountName: string;
  status: PayoutStatus;
  availableBalance: number; // saldo saat diajukan
  transferRef: string | null;
  rejectReason: string | null;
  processedByName: string | null;
  processedAt: string | null;
  requestedAt: string;
};
