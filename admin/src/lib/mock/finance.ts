import "server-only";

import type { Payment, PaymentMethod, Payout } from "@/types/finance";

// tujuan transfer manual (seed backend: QRIS GoPay + rekening bank)
export const mockPaymentMethods: PaymentMethod[] = [
  { id: "pm_qris", type: "QRIS", label: "QRIS GoPay DUBIDU", bankName: null, accountNumber: null, accountName: "DUBIDU INDONESIA", qrImageUrl: "/brand/doobie.png", instructions: "Scan QRIS dari aplikasi bank/e-wallet apa pun.", active: true, order: 1 },
  { id: "pm_bca", type: "BANK_TRANSFER", label: "Transfer BCA", bankName: "BCA", accountNumber: "4401987766", accountName: "PT Dubidu Tumbuh Bersama", qrImageUrl: null, instructions: "Transfer tepat sesuai nominal termasuk kode unik.", active: true, order: 2 },
  { id: "pm_bri", type: "BANK_TRANSFER", label: "Transfer BRI", bankName: "BRI", accountNumber: "002101000123307", accountName: "PT Dubidu Tumbuh Bersama", qrImageUrl: null, instructions: null, active: false, order: 3 },
];

const p = (x: Partial<Payment> & Pick<Payment, "id" | "invoiceNo" | "userId" | "userName" | "purpose" | "description" | "amount" | "status" | "createdAt">): Payment => ({
  uniqueCode: null,
  amountDue: null,
  manualMethodId: null,
  manualMethodLabel: null,
  proofUrl: null,
  proofSenderName: null,
  proofNote: null,
  proofSubmittedAt: null,
  verifiedByName: null,
  verifiedAt: null,
  rejectReason: null,
  ...x,
});

export const mockPayments: Payment[] = [
  p({ id: "pay_01", invoiceNo: "DBD-26103101", userId: "u_devi", userName: "Devi Anggraini", purpose: "ENGAGEMENT", description: "Kontrak Nielsen Dave · Termin 3", amount: 1800000, uniqueCode: 217, amountDue: 1800217, status: "VERIFYING", manualMethodId: "pm_bca", manualMethodLabel: "Transfer BCA", proofUrl: "/brand/doobie.png", proofSenderName: "DEVI ANGGRAINI", proofNote: "Transfer dari BCA mobile", proofSubmittedAt: "2026-10-31T09:12:00.000Z", createdAt: "2026-10-31T08:40:00.000Z" }),
  p({ id: "pay_02", invoiceNo: "DBD-26103102", userId: "u_laras", userName: "Laras Setiawati", purpose: "SUBSCRIPTION", description: "Dubidu Plus Tahunan", amount: 590000, uniqueCode: 48, amountDue: 590048, status: "VERIFYING", manualMethodId: "pm_qris", manualMethodLabel: "QRIS GoPay DUBIDU", proofUrl: "/brand/doobie.png", proofSenderName: "Laras S", proofNote: null, proofSubmittedAt: "2026-10-31T10:05:00.000Z", createdAt: "2026-10-31T10:00:00.000Z" }),
  p({ id: "pay_03", invoiceNo: "DBD-26103003", userId: "u_rahma", userName: "Rahma Aulia", purpose: "CONSULTATION", description: "Konsultasi Dimas Wicaksono · Video", amount: 288000, uniqueCode: 905, amountDue: 288905, status: "VERIFYING", manualMethodId: "pm_bca", manualMethodLabel: "Transfer BCA", proofUrl: "/brand/doobie.png", proofSenderName: "AULIA RAHMA", proofNote: "Nominal saya transfer 288.000 karena lupa kode unik", proofSubmittedAt: "2026-10-30T14:20:00.000Z", createdAt: "2026-10-30T13:55:00.000Z" }),
  p({ id: "pay_04", invoiceNo: "DBD-26103004", userId: "u_wulan", userName: "Wulan Anggita", purpose: "CONSULTATION", description: "Konsultasi Amanda Putri · Chat", amount: 280000, uniqueCode: 312, amountDue: 280312, status: "PENDING", manualMethodId: "pm_bca", manualMethodLabel: "Transfer BCA", createdAt: "2026-10-30T16:00:00.000Z" }),
  p({ id: "pay_05", invoiceNo: "DBD-26102905", userId: "u_sarahw", userName: "Sarah Wijaya", purpose: "ENGAGEMENT", description: "Kontrak Pras Karunia · Termin 2", amount: 1440000, uniqueCode: 77, amountDue: 1440077, status: "PAID", manualMethodId: "pm_bca", manualMethodLabel: "Transfer BCA", proofUrl: "/brand/doobie.png", proofSenderName: "SARAH WIJAYA", proofSubmittedAt: "2026-10-29T06:00:00.000Z", verifiedByName: "Admin Dubidu", verifiedAt: "2026-10-29T07:30:00.000Z", createdAt: "2026-10-29T05:30:00.000Z" }),
  p({ id: "pay_06", invoiceNo: "DBD-26102806", userId: "u_devi", userName: "Devi Anggraini", purpose: "SUBSCRIPTION", description: "Dubidu Plus Bulanan", amount: 59000, uniqueCode: 501, amountDue: 59501, status: "PAID", manualMethodId: "pm_qris", manualMethodLabel: "QRIS GoPay DUBIDU", proofUrl: "/brand/doobie.png", proofSenderName: "Devi A", proofSubmittedAt: "2026-10-28T02:00:00.000Z", verifiedByName: "Admin Dubidu", verifiedAt: "2026-10-28T03:00:00.000Z", createdAt: "2026-10-28T01:50:00.000Z" }),
  p({ id: "pay_07", invoiceNo: "DBD-26102707", userId: "u_ratna", userName: "Ratna Sari", purpose: "CONSULTATION", description: "Konsultasi dr. Reni Anggraini · Video", amount: 450000, uniqueCode: 66, amountDue: 450066, status: "EXPIRED", manualMethodId: "pm_bca", manualMethodLabel: "Transfer BCA", createdAt: "2026-10-27T09:00:00.000Z" }),
];

export const mockPayouts: Payout[] = [
  { id: "po_01", userId: "u_pras", userName: "Pras Karunia, S.Pd", role: "TEACHER", amount: 900000, fee: 2500, bankName: "BCA", accountNumberMasked: "•••• 4821", accountName: "PRAS KARUNIA", status: "PENDING", availableBalance: 1200000, transferRef: null, rejectReason: null, processedByName: null, processedAt: null, requestedAt: "2026-10-31T07:45:00.000Z" },
  { id: "po_02", userId: "u_amanda", userName: "Amanda Putri, M.Psi.", role: "PSYCHOLOGIST", amount: 3600000, fee: 2500, bankName: "Mandiri", accountNumberMasked: "•••• 1190", accountName: "AMANDA PUTRI", status: "PENDING", availableBalance: 3600000, transferRef: null, rejectReason: null, processedByName: null, processedAt: null, requestedAt: "2026-10-31T05:10:00.000Z" },
  { id: "po_03", userId: "u_larasati", userName: "Larasati Sudigdo, S.Psi", role: "TEACHER", amount: 2500000, fee: 2500, bankName: "BNI", accountNumberMasked: "•••• 7730", accountName: "LARASATI S", status: "PENDING", availableBalance: 1750000, transferRef: null, rejectReason: null, processedByName: null, processedAt: null, requestedAt: "2026-10-30T11:00:00.000Z" },
  { id: "po_04", userId: "u_nielsen", userName: "Nielsen Dave, S.Pd", role: "TEACHER", amount: 1620000, fee: 2500, bankName: "BCA", accountNumberMasked: "•••• 0915", accountName: "NIELSEN DAVE", status: "TRANSFERRED", availableBalance: 1620000, transferRef: "TRF-BCA-88213", rejectReason: null, processedByName: "Admin Dubidu", processedAt: "2026-10-27T04:00:00.000Z", requestedAt: "2026-10-26T10:00:00.000Z" },
];
