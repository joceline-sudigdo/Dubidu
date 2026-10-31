import "server-only";

import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

import { mockAdmins } from "@/lib/mock/admins";
import { mockAuditLogs } from "@/lib/mock/audit-logs";
import { mockPosts, mockReports, mockReviews } from "@/lib/mock/community";
import {
  mockDoobieTopics,
  mockFaqs,
  mockLegal,
  mockLevels,
  mockMissions,
  mockPlans,
  mockPromos,
  mockRedemptions,
  mockRewards,
  mockSettings,
} from "@/lib/mock/content";
import { mockPaymentMethods, mockPayments, mockPayouts } from "@/lib/mock/finance";
import { mockUsers } from "@/lib/mock/users";
import { mockApplications } from "@/lib/mock/verifications";
import type { AdminUser } from "@/types/admin";
import type { AuditLog, NewAuditLog } from "@/types/audit";
import type { CommunityPost, ContentReport, ModerationStatus, ReportStatus, Review } from "@/types/community";
import type {
  AppSettings,
  DoobieTopic,
  Faq,
  LegalDoc,
  LegalType,
  Mission,
  PlusPlan,
  PromoCode,
  Redemption,
  Reward,
  RewardLevel,
} from "@/types/content";
import type { Payment, PaymentMethod, PaymentStatus, Payout, PayoutStatus } from "@/types/finance";
import type { AppUser, NewPsychologistInput } from "@/types/user";
import type { DecisionStatus, TeacherApplication } from "@/types/verification";

// Lapisan data admin. Sekarang membaca/mengubah data dummy di src/lib/mock/ (memori proses).
// Nanti tiap fungsi diganti fetch ke env.backendApiUrl tanpa mengubah halaman, misalnya:
//   fetch(`${env.backendApiUrl}/api/admin/payments?status=VERIFYING`, { headers: authHeader })
// Endpoint di komentar TODO masih usulan: backend belum punya route admin.

const now = () => new Date().toISOString();
const clone = <T>(v: T): T => structuredClone(v);

export class NotFoundError extends Error {}

function find<T extends { id: string }>(list: T[], id: string): T {
  const item = list.find((x) => x.id === id);
  if (!item) throw new NotFoundError("Data tidak ditemukan");
  return item;
}

// ---------------------------------------------------------------------------
//  Admin & autentikasi
// ---------------------------------------------------------------------------

// buang passwordHash sebelum data keluar dari lapisan ini
const strip = (a: (typeof mockAdmins)[number]): AdminUser => ({
  id: a.id,
  role: a.role,
  fullName: a.fullName,
  email: a.email,
  avatarUrl: a.avatarUrl,
  isActive: a.isActive,
  createdAt: a.createdAt,
});

function passwordMatches(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

// TODO(backend): POST /api/auth/login (role ADMIN) → simpan token backend di sesi
export async function verifyAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
  const admin = mockAdmins.find((a) => a.email === email.trim().toLowerCase());
  if (!admin || !admin.isActive || !passwordMatches(password, admin.passwordHash)) return null;
  return strip(admin);
}

// TODO(backend): GET /api/admin/me
export async function getAdminById(id: string): Promise<AdminUser | null> {
  const admin = mockAdmins.find((a) => a.id === id && a.isActive);
  return admin ? strip(admin) : null;
}

// ---------------------------------------------------------------------------
//  Audit log
// ---------------------------------------------------------------------------

// TODO(backend): POST /api/admin/audit-logs (atau ditulis otomatis oleh endpoint aksi)
export async function createAuditLog(entry: NewAuditLog): Promise<AuditLog> {
  const log: AuditLog = { ...entry, id: `log_${randomUUID().slice(0, 8)}`, createdAt: now() };
  mockAuditLogs.unshift(log);
  return log;
}

// TODO(backend): GET /api/admin/audit-logs?limit=&action=
export async function listAuditLogs({ limit = 50, q }: { limit?: number; q?: string } = {}): Promise<AuditLog[]> {
  const term = q?.trim().toLowerCase();
  return clone(
    mockAuditLogs
      .filter((l) => !term || `${l.actorName} ${l.targetLabel} ${l.reason ?? ""}`.toLowerCase().includes(term))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  );
}

// ---------------------------------------------------------------------------
//  Ringkasan (dashboard) — semua angka agregat, tanpa data anak
// ---------------------------------------------------------------------------

// TODO(backend): GET /api/admin/stats
export async function getDashboardStats() {
  const paid = mockPayments.filter((p) => p.status === "PAID");
  return {
    users: {
      parent: mockUsers.filter((u) => u.role === "PARENT").length,
      teacher: mockUsers.filter((u) => u.role === "TEACHER").length,
      psychologist: mockUsers.filter((u) => u.role === "PSYCHOLOGIST").length,
      suspended: mockUsers.filter((u) => !u.isActive).length,
      plus: mockUsers.filter((u) => u.plusActive).length,
    },
    queues: {
      verification: mockApplications.filter((a) => a.status === "PENDING").length,
      payment: mockPayments.filter((p) => p.status === "VERIFYING").length,
      payout: mockPayouts.filter((p) => p.status === "PENDING").length,
      report: mockReports.filter((r) => r.status === "OPEN").length,
    },
    revenue: {
      paidTotal: paid.reduce((s, p) => s + p.amount, 0),
      paidCount: paid.length,
      platformFee: Math.round(
        paid.filter((p) => p.purpose === "ENGAGEMENT").reduce((s, p) => s + p.amount, 0) * (mockSettings.platformFeePercent / 100)
      ),
      subscription: paid.filter((p) => p.purpose === "SUBSCRIPTION").reduce((s, p) => s + p.amount, 0),
    },
    activeEngagements: mockUsers.filter((u) => u.role === "PARENT").reduce((s, u) => s + u.activeEngagements, 0),
  };
}

// ---------------------------------------------------------------------------
//  Verifikasi shadow teacher
// ---------------------------------------------------------------------------

// TODO(backend): GET /api/admin/teacher-verifications?status=
export async function listApplications(status?: DecisionStatus): Promise<TeacherApplication[]> {
  return clone(
    mockApplications.filter((a) => !status || a.status === status).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  );
}

// TODO(backend): GET /api/admin/teacher-verifications/:id
export async function getApplication(id: string): Promise<TeacherApplication | null> {
  const app = mockApplications.find((a) => a.id === id);
  return app ? clone(app) : null;
}

// TODO(backend): POST /api/admin/teacher-verifications/:id/decision { status, note }
export async function decideApplication(id: string, status: Exclude<DecisionStatus, "PENDING">, note: string) {
  const app = find(mockApplications, id);
  app.status = status;
  app.decisionNote = note || null;
  app.decidedAt = now();
  if (status === "VERIFIED") app.documents.forEach((d) => d.url && (d.status = "VERIFIED"));
  const user = mockUsers.find((u) => u.id === app.userId);
  if (user?.teacher) user.teacher.verificationStatus = status === "VERIFIED" ? "VERIFIED" : status === "REJECTED" ? "REJECTED" : "PENDING";
  return clone(app);
}

// ---------------------------------------------------------------------------
//  Pembayaran (bukti transfer manual) & tujuan transfer
// ---------------------------------------------------------------------------

// TODO(backend): GET /api/admin/payments?status=
export async function listPayments(status?: PaymentStatus): Promise<Payment[]> {
  return clone(
    mockPayments
      .filter((p) => !status || p.status === status)
      .sort((a, b) => (b.proofSubmittedAt ?? b.createdAt).localeCompare(a.proofSubmittedAt ?? a.createdAt))
  );
}

export async function getPayment(id: string): Promise<Payment | null> {
  const p = mockPayments.find((x) => x.id === id);
  return p ? clone(p) : null;
}

// TODO(backend): POST /api/admin/payments/:id/confirm
export async function confirmPayment(id: string, adminName: string) {
  const p = find(mockPayments, id);
  if (p.status !== "VERIFYING") throw new Error("Pembayaran ini tidak sedang menunggu konfirmasi.");
  Object.assign(p, { status: "PAID", verifiedByName: adminName, verifiedAt: now(), rejectReason: null });
  return clone(p);
}

// TODO(backend): POST /api/admin/payments/:id/reject { reason } → kembali PENDING (user bisa upload ulang)
export async function rejectPayment(id: string, reason: string, adminName: string) {
  const p = find(mockPayments, id);
  if (p.status !== "VERIFYING") throw new Error("Pembayaran ini tidak sedang menunggu konfirmasi.");
  Object.assign(p, { status: "PENDING", verifiedByName: adminName, verifiedAt: now(), rejectReason: reason });
  return clone(p);
}

// TODO(backend): GET /api/admin/payment-methods
export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  return clone([...mockPaymentMethods].sort((a, b) => a.order - b.order));
}

// TODO(backend): POST/PATCH /api/admin/payment-methods
export async function savePaymentMethod(input: Omit<PaymentMethod, "id" | "order"> & { id?: string }) {
  if (input.id) {
    const m = find(mockPaymentMethods, input.id);
    Object.assign(m, input);
    return clone(m);
  }
  const m: PaymentMethod = { ...input, id: `pm_${randomUUID().slice(0, 6)}`, order: mockPaymentMethods.length + 1 };
  mockPaymentMethods.push(m);
  return clone(m);
}

// ---------------------------------------------------------------------------
//  Pencairan dana (tabel baru `Payout`)
// ---------------------------------------------------------------------------

// TODO(backend): GET /api/admin/payouts?status=
export async function listPayouts(status?: PayoutStatus): Promise<Payout[]> {
  return clone(mockPayouts.filter((p) => !status || p.status === status).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)));
}

// TODO(backend): POST /api/admin/payouts/:id/transfer { transferRef }
export async function markPayoutTransferred(id: string, transferRef: string, adminName: string) {
  const p = find(mockPayouts, id);
  if (p.status !== "PENDING") throw new Error("Pencairan ini sudah diproses.");
  if (p.amount > p.availableBalance) throw new Error("Nominal melebihi saldo pengguna saat diajukan.");
  Object.assign(p, { status: "TRANSFERRED", transferRef, processedByName: adminName, processedAt: now() });
  return clone(p);
}

// TODO(backend): POST /api/admin/payouts/:id/reject { reason } → saldo dikembalikan
export async function rejectPayout(id: string, reason: string, adminName: string) {
  const p = find(mockPayouts, id);
  if (p.status !== "PENDING") throw new Error("Pencairan ini sudah diproses.");
  Object.assign(p, { status: "REJECTED", rejectReason: reason, processedByName: adminName, processedAt: now() });
  return clone(p);
}

// ---------------------------------------------------------------------------
//  Pengguna
// ---------------------------------------------------------------------------

export type UserFilter = { role?: AppUser["role"]; q?: string; status?: "active" | "suspended" };

// TODO(backend): GET /api/admin/users?role=&q=&status=
export async function listUsers({ role, q, status }: UserFilter = {}): Promise<AppUser[]> {
  const term = q?.trim().toLowerCase();
  return clone(
    mockUsers
      .filter((u) => !role || u.role === role)
      .filter((u) => !status || (status === "active" ? u.isActive : !u.isActive))
      .filter((u) => !term || `${u.fullName} ${u.email ?? ""} ${u.phone ?? ""}`.toLowerCase().includes(term))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export async function getUser(id: string): Promise<AppUser | null> {
  const u = mockUsers.find((x) => x.id === id);
  return u ? clone(u) : null;
}

// TODO(backend): PATCH /api/admin/users/:id/status { isActive, reason }
export async function setUserActive(id: string, isActive: boolean, reason: string) {
  const u = find(mockUsers, id);
  u.isActive = isActive;
  u.suspendedReason = isActive ? null : reason;
  return clone(u);
}

// TODO(backend): POST /api/admin/psychologists → User(PSYCHOLOGIST) + PsychologistProfile
export async function createPsychologist(input: NewPsychologistInput) {
  const email = input.email.toLowerCase();
  if (mockUsers.some((u) => u.email === email)) throw new Error("Email sudah terdaftar.");
  if (mockUsers.some((u) => u.phone === input.phone)) throw new Error("Nomor HP sudah terdaftar.");
  // kata sandi sementara, dikirim ke psikolog dan wajib diganti saat login pertama
  const tempPassword = `Dbd-${randomBytes(4).toString("hex")}`;
  const user: AppUser = {
    id: `u_${randomUUID().slice(0, 8)}`,
    role: "PSYCHOLOGIST",
    fullName: input.fullName,
    email,
    phone: input.phone,
    domicile: null,
    points: 0,
    isActive: true,
    suspendedReason: null,
    plusActive: false,
    createdAt: now(),
    lastActiveAt: null,
    activeEngagements: 0,
    psychologist: {
      title: input.title,
      place: input.place || null,
      experienceYears: input.experienceYears,
      basePrice: input.basePrice,
      discountPercent: input.discountPercent,
      durationMinutes: input.durationMinutes,
      categories: input.categories,
      rating: 0,
      reviewCount: 0,
    },
  };
  mockUsers.unshift(user);
  return { user: clone(user), tempPassword };
}

// ---------------------------------------------------------------------------
//  Moderasi
// ---------------------------------------------------------------------------

// TODO(backend): GET /api/admin/reports?status=
export async function listReports(status?: ReportStatus): Promise<ContentReport[]> {
  return clone(mockReports.filter((r) => !status || r.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

// TODO(backend): POST /api/admin/reports/:id/resolve { status, resolution }
export async function resolveReport(id: string, status: Exclude<ReportStatus, "OPEN">, resolution: string, adminName: string) {
  const r = find(mockReports, id);
  Object.assign(r, { status, resolution, handledByName: adminName, handledAt: now() });
  return clone(r);
}

// TODO(backend): GET /api/admin/community/posts?status=
export async function listPosts(status?: ModerationStatus): Promise<CommunityPost[]> {
  return clone(mockPosts.filter((p) => !status || p.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function getPost(id: string): Promise<CommunityPost | null> {
  const p = mockPosts.find((x) => x.id === id);
  return p ? clone(p) : null;
}

// TODO(backend): PATCH /api/admin/community/posts/:id { status, reason }
export async function setPostStatus(id: string, status: ModerationStatus, reason: string | null) {
  const p = find(mockPosts, id);
  p.status = status;
  p.hiddenReason = status === "HIDDEN" ? reason : null;
  return clone(p);
}

// TODO(backend): PATCH /api/admin/community/comments/:id { status }
export async function setCommentStatus(postId: string, commentId: string, status: ModerationStatus) {
  const c = find(find(mockPosts, postId).comments, commentId);
  c.status = status;
  return clone(c);
}

// komentar bisa dicari tanpa tahu postingannya (dipakai dari laporan)
export async function findCommentPostId(commentId: string) {
  return mockPosts.find((p) => p.comments.some((c) => c.id === commentId))?.id ?? null;
}

// TODO(backend): GET /api/admin/reviews?status=
export async function listReviews(status?: ModerationStatus): Promise<Review[]> {
  return clone(mockReviews.filter((r) => !status || r.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

// TODO(backend): PATCH /api/admin/reviews/:id { status, reason } (rating teacher dihitung ulang)
export async function setReviewStatus(id: string, status: ModerationStatus, reason: string | null) {
  const r = find(mockReviews, id);
  r.status = status;
  r.hiddenReason = status === "HIDDEN" ? reason : null;
  return clone(r);
}

// ---------------------------------------------------------------------------
//  Konten: legal, FAQ, Doobie
// ---------------------------------------------------------------------------

// TODO(backend): GET/PUT /api/admin/content/legal/:type
export async function listLegal(): Promise<LegalDoc[]> {
  return clone(mockLegal);
}

export async function getLegal(type: LegalType): Promise<LegalDoc | null> {
  const d = mockLegal.find((x) => x.type === type);
  return d ? clone(d) : null;
}

export async function updateLegal(type: LegalType, sections: LegalDoc["sections"], adminName: string) {
  const d = mockLegal.find((x) => x.type === type);
  if (!d) throw new NotFoundError("Dokumen tidak ditemukan");
  Object.assign(d, { sections, version: d.version + 1, updatedAt: now(), updatedByName: adminName });
  return clone(d);
}

// TODO(backend): /api/admin/content/faqs
export async function listFaqs(): Promise<Faq[]> {
  return clone([...mockFaqs].sort((a, b) => a.order - b.order));
}

export async function saveFaq(input: Omit<Faq, "id" | "order"> & { id?: string }) {
  if (input.id) {
    const f = find(mockFaqs, input.id);
    Object.assign(f, input);
    return clone(f);
  }
  const f: Faq = { ...input, id: `faq_${randomUUID().slice(0, 6)}`, order: mockFaqs.length + 1 };
  mockFaqs.push(f);
  return clone(f);
}

export async function deleteFaq(id: string) {
  const i = mockFaqs.findIndex((f) => f.id === id);
  if (i < 0) throw new NotFoundError("FAQ tidak ditemukan");
  return clone(mockFaqs.splice(i, 1)[0]);
}

// TODO(backend): /api/admin/content/doobie-topics
export async function listDoobieTopics(): Promise<DoobieTopic[]> {
  return clone([...mockDoobieTopics].sort((a, b) => a.role.localeCompare(b.role) || a.order - b.order));
}

export async function saveDoobieTopic(input: Omit<DoobieTopic, "order"> & { isNew: boolean }) {
  const { isNew, ...data } = input;
  if (!isNew) {
    const t = find(mockDoobieTopics, data.id);
    Object.assign(t, data);
    return clone(t);
  }
  if (mockDoobieTopics.some((t) => t.id === data.id)) throw new Error("ID topik sudah dipakai.");
  const t: DoobieTopic = { ...data, order: mockDoobieTopics.filter((x) => x.role === data.role).length + 1 };
  mockDoobieTopics.push(t);
  return clone(t);
}

export async function deleteDoobieTopic(id: string) {
  const i = mockDoobieTopics.findIndex((t) => t.id === id);
  if (i < 0) throw new NotFoundError("Topik tidak ditemukan");
  return clone(mockDoobieTopics.splice(i, 1)[0]);
}

// ---------------------------------------------------------------------------
//  Konten: rewards & voucher
// ---------------------------------------------------------------------------

// TODO(backend): /api/admin/rewards, /missions, /levels, /redemptions
export async function getRewardsData() {
  return clone({ rewards: mockRewards, missions: mockMissions, levels: mockLevels, redemptions: mockRedemptions });
}

export async function saveReward(input: Omit<Reward, "id"> & { id?: string }) {
  if (input.id) {
    const r = find(mockRewards, input.id);
    Object.assign(r, input);
    return clone(r);
  }
  const r: Reward = { ...input, id: `${input.role === "teacher" ? "tr" : "r"}-${randomUUID().slice(0, 6)}` };
  mockRewards.push(r);
  return clone(r);
}

export async function saveMission(input: Omit<Mission, "id"> & { id?: string }) {
  if (input.id) {
    const m = find(mockMissions, input.id);
    Object.assign(m, input);
    return clone(m);
  }
  const m: Mission = { ...input, id: `${input.role === "teacher" ? "t" : "m"}-${randomUUID().slice(0, 6)}` };
  mockMissions.push(m);
  return clone(m);
}

export async function updateLevels(levels: RewardLevel[]) {
  mockLevels.splice(0, mockLevels.length, ...levels);
  return clone(mockLevels);
}

export async function cancelRedemption(id: string) {
  const r = find(mockRedemptions, id);
  if (r.status !== "ACTIVE") throw new Error("Voucher ini sudah tidak aktif.");
  r.status = "CANCELLED";
  return clone(r) as Redemption;
}

// ---------------------------------------------------------------------------
//  Konten: paket Plus, promo, pengaturan biaya
// ---------------------------------------------------------------------------

// TODO(backend): /api/admin/plans, /promo-codes, /settings
export async function getPlusData() {
  return clone({ plans: mockPlans, promos: mockPromos, settings: mockSettings });
}

export async function updatePlan(role: PlusPlan["role"], key: PlusPlan["key"], data: Pick<PlusPlan, "price" | "note" | "badge">) {
  const plan = mockPlans.find((p) => p.role === role && p.key === key);
  if (!plan) throw new NotFoundError("Paket tidak ditemukan");
  Object.assign(plan, data);
  return clone(plan);
}

export async function savePromo(input: Omit<PromoCode, "usageCount">, isNew: boolean) {
  const existing = mockPromos.find((p) => p.code === input.code);
  if (isNew) {
    if (existing) throw new Error("Kode promo sudah ada.");
    const promo: PromoCode = { ...input, usageCount: 0 };
    mockPromos.push(promo);
    return clone(promo);
  }
  if (!existing) throw new NotFoundError("Kode promo tidak ditemukan");
  Object.assign(existing, input);
  return clone(existing);
}

export async function updateSettings(settings: AppSettings) {
  Object.assign(mockSettings, settings);
  return clone(mockSettings);
}
