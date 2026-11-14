import "server-only";

import { randomUUID } from "node:crypto";
import { connection } from "next/server";

import { env } from "@/lib/env";
import { readSession } from "@/lib/session";
import type { AdminUser } from "@/types/admin";
import type { AuditLog, NewAuditLog } from "@/types/audit";
import type { CommunityComment, CommunityPost, ContentReport, ModerationStatus, ReportStatus, Review } from "@/types/community";
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

// Lapisan data admin: semua fungsi memanggil backend DUBIDU (env.backendApiUrl) dengan token admin
// yang tersimpan di cookie sesi. Halaman & Server Action cukup memanggil fungsi di sini.

export class NotFoundError extends Error {}

/** Error dari backend yang pesannya aman ditampilkan ke admin */
export class BackendError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type RequestOptions = { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown; token?: string };

async function request<T>(path: string, { method = "GET", body, token }: RequestOptions = {}): Promise<T> {
  const authToken = token ?? (await readSession())?.token;
  const res = await fetch(`${env.backendApiUrl}/api${path}`, {
    method,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (res.status === 404) throw new NotFoundError(data.error ?? "Data tidak ditemukan");
  if (!res.ok) throw new BackendError(res.status, data.error ?? "Server sedang bermasalah. Coba lagi.");
  return data as T;
}

async function backend<T>(path: string, options?: RequestOptions): Promise<T> {
  await connection(); // data admin selalu dibaca saat request, tidak pernah di-prerender
  return request<T>(path, options);
}

/** Sama seperti backend(), tapi 404 → null (untuk halaman detail) */
async function backendOrNull<T>(path: string): Promise<T | null> {
  try {
    return await backend<T>(path);
  } catch (e) {
    if (e instanceof NotFoundError) return null;
    throw e;
  }
}

const query = (params: Record<string, string | number | undefined>) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [string, string][]);
  return qs.size ? `?${qs}` : "";
};

// ---------------------------------------------------------------------------
//  Admin & autentikasi
// ---------------------------------------------------------------------------

/** POST /api/auth/login (portal admin). Percobaan gagal dicatat di audit log oleh backend. */
export async function verifyAdminCredentials(email: string, password: string): Promise<(AdminUser & { token: string }) | null> {
  try {
    const { token } = await backend<{ token: string }>("/auth/login", {
      method: "POST",
      body: { contact: email.trim().toLowerCase(), password, portal: "admin" },
    });
    const admin = await backend<AdminUser>("/admin/me", { token });
    return { ...admin, token };
  } catch (e) {
    if (e instanceof BackendError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
}

// dipanggil dari getSessionAdmin() ("use cache: private"), jadi tanpa connection()
export async function getAdminById(id: string): Promise<AdminUser | null> {
  try {
    const admin = await request<AdminUser>("/admin/me");
    return admin.id === id && admin.isActive ? admin : null;
  } catch (e) {
    // token kedaluwarsa / akun bukan admin lagi → dianggap belum login
    if (e instanceof BackendError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
}

// ---------------------------------------------------------------------------
//  Audit log
// ---------------------------------------------------------------------------

export async function createAuditLog(entry: NewAuditLog): Promise<AuditLog | null> {
  // login berhasil/gagal sudah dicatat backend saat POST /auth/login
  if (entry.action === "AUTH_LOGIN" || entry.action === "AUTH_LOGIN_FAILED") return null;
  // pelaku = admin pemilik token, jadi actorId/actorName tidak perlu dikirim
  return backend<AuditLog>("/admin/audit-logs", {
    method: "POST",
    body: { action: entry.action, targetType: entry.targetType, targetId: entry.targetId, targetLabel: entry.targetLabel, reason: entry.reason, ipAddress: entry.ipAddress },
  });
}

export async function listAuditLogs({ limit = 50, q }: { limit?: number; q?: string } = {}): Promise<AuditLog[]> {
  return backend(`/admin/audit-logs${query({ limit, q: q?.trim() })}`);
}

// ---------------------------------------------------------------------------
//  Ringkasan (dashboard) — angka agregat user sungguhan, tanpa data anak
// ---------------------------------------------------------------------------

type DashboardStats = {
  users: { parent: number; teacher: number; psychologist: number; suspended: number; plus: number };
  queues: { verification: number; payment: number; payout: number; report: number };
  revenue: { paidTotal: number; paidCount: number; platformFee: number; subscription: number };
  activeEngagements: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  return backend("/admin/stats");
}

// ---------------------------------------------------------------------------
//  Verifikasi shadow teacher
// ---------------------------------------------------------------------------

export async function listApplications(status?: DecisionStatus): Promise<TeacherApplication[]> {
  return backend(`/admin/teacher-verifications${query({ status })}`);
}

export async function getApplication(id: string): Promise<TeacherApplication | null> {
  return backendOrNull(`/admin/teacher-verifications/${encodeURIComponent(id)}`);
}

export async function decideApplication(id: string, status: Exclude<DecisionStatus, "PENDING">, note: string) {
  return backend<TeacherApplication>(`/admin/teacher-verifications/${encodeURIComponent(id)}/decision`, {
    method: "POST",
    body: { status, note },
  });
}

/** Admin menyesuaikan level keahlian teacher (nilai ini yang dipakai matching) */
export async function setTeacherSkills(userId: string, skills: Record<string, number>) {
  return backend(`/admin/teachers/${encodeURIComponent(userId)}/skills`, { method: "PATCH", body: { skills } });
}

// ---------------------------------------------------------------------------
//  Pembayaran (bukti transfer manual) & tujuan transfer
// ---------------------------------------------------------------------------

export async function listPayments(status?: PaymentStatus): Promise<Payment[]> {
  return backend(`/admin/payments${query({ status })}`);
}

export async function getPayment(id: string): Promise<Payment | null> {
  return backendOrNull(`/admin/payments/${encodeURIComponent(id)}`);
}

export async function confirmPayment(id: string) {
  return backend<Payment>(`/admin/payments/${encodeURIComponent(id)}/confirm`, { method: "POST", body: {} });
}

export async function rejectPayment(id: string, reason: string) {
  return backend<Payment>(`/admin/payments/${encodeURIComponent(id)}/reject`, { method: "POST", body: { reason } });
}

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  return backend("/admin/payment-methods");
}

export async function savePaymentMethod(input: Omit<PaymentMethod, "id" | "order"> & { id?: string }) {
  const { id, ...body } = input;
  return id
    ? backend<PaymentMethod>(`/admin/payment-methods/${encodeURIComponent(id)}`, { method: "PATCH", body })
    : backend<PaymentMethod>("/admin/payment-methods", { method: "POST", body });
}

// ---------------------------------------------------------------------------
//  Pencairan dana
// ---------------------------------------------------------------------------

export async function listPayouts(status?: PayoutStatus): Promise<Payout[]> {
  return backend(`/admin/payouts${query({ status })}`);
}

export async function markPayoutTransferred(id: string, transferRef: string) {
  return backend<Payout>(`/admin/payouts/${encodeURIComponent(id)}/transfer`, { method: "POST", body: { transferRef } });
}

export async function rejectPayout(id: string, reason: string) {
  return backend<Payout>(`/admin/payouts/${encodeURIComponent(id)}/reject`, { method: "POST", body: { reason } });
}

// ---------------------------------------------------------------------------
//  Pengguna
// ---------------------------------------------------------------------------

export type UserFilter = { role?: AppUser["role"]; q?: string; status?: "active" | "suspended" };

export async function listUsers({ role, q, status }: UserFilter = {}): Promise<AppUser[]> {
  return backend(`/admin/users${query({ role, q: q?.trim(), status })}`);
}

export async function getUser(id: string): Promise<AppUser | null> {
  return backendOrNull(`/admin/users/${encodeURIComponent(id)}`);
}

export async function setUserActive(id: string, isActive: boolean, reason: string) {
  return backend<AppUser>(`/admin/users/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { isActive, reason } });
}

/** Buat akun psikolog. Kata sandi sementara dibuat backend dan wajib diteruskan ke psikolog. */
export async function createPsychologist(input: NewPsychologistInput) {
  return backend<{ user: AppUser; tempPassword: string }>("/admin/psychologists", {
    method: "POST",
    body: { ...input, place: input.place || undefined },
  });
}

// ---------------------------------------------------------------------------
//  Moderasi
// ---------------------------------------------------------------------------

export async function listReports(status?: ReportStatus): Promise<ContentReport[]> {
  return backend(`/admin/reports${query({ status })}`);
}

export async function resolveReport(id: string, status: Exclude<ReportStatus, "OPEN">, resolution: string) {
  return backend<ContentReport>(`/admin/reports/${encodeURIComponent(id)}/resolve`, { method: "POST", body: { status, resolution } });
}

export async function listPosts(status?: ModerationStatus): Promise<CommunityPost[]> {
  return backend(`/admin/community/posts${query({ status })}`);
}

export async function getPost(id: string): Promise<CommunityPost | null> {
  return backendOrNull(`/admin/community/posts/${encodeURIComponent(id)}`);
}

export async function setPostStatus(id: string, status: ModerationStatus, reason: string | null) {
  return backend<CommunityPost>(`/admin/community/posts/${encodeURIComponent(id)}`, { method: "PATCH", body: { status, reason } });
}

export async function setCommentStatus(commentId: string, status: ModerationStatus) {
  return backend<CommunityComment>(`/admin/community/comments/${encodeURIComponent(commentId)}`, { method: "PATCH", body: { status } });
}

// komentar bisa dicari tanpa tahu postingannya (dipakai dari laporan)
export async function findCommentPostId(commentId: string) {
  return (await backendOrNull<{ postId: string }>(`/admin/community/comments/${encodeURIComponent(commentId)}`))?.postId ?? null;
}

export async function listReviews(status?: ModerationStatus): Promise<Review[]> {
  return backend(`/admin/reviews${query({ status })}`);
}

export async function setReviewStatus(id: string, status: ModerationStatus, reason: string | null) {
  return backend<Review>(`/admin/reviews/${encodeURIComponent(id)}`, { method: "PATCH", body: { status, reason } });
}

// ---------------------------------------------------------------------------
//  Konten: disimpan di backend sebagai satu dokumen per jenis (GET/PUT /api/admin/content/:key)
// ---------------------------------------------------------------------------

type ContentRow<T> = { key: string; value: T; version: number; updatedAt: string | null; updatedByName: string | null };

const getContent = <T>(key: string) => backend<ContentRow<T>>(`/admin/content/${key}`);
const putContent = <T>(key: string, value: T) => backend<ContentRow<T>>(`/admin/content/${key}`, { method: "PUT", body: { value } });

const shortId = (prefix: string) => `${prefix}${randomUUID().slice(0, 6)}`;

function findIn<T extends { id: string }>(list: T[], id: string, what = "Data"): T {
  const item = list.find((x) => x.id === id);
  if (!item) throw new NotFoundError(`${what} tidak ditemukan`);
  return item;
}

// ---------- legal ----------

type LegalValue = Pick<LegalDoc, "type" | "title" | "sections">;

const toLegal = (row: ContentRow<LegalValue>): LegalDoc => ({
  ...row.value,
  version: row.version,
  updatedAt: row.updatedAt ?? new Date(0).toISOString(),
  updatedByName: row.updatedByName,
});

export async function listLegal(): Promise<LegalDoc[]> {
  const rows = await Promise.all([getContent<LegalValue>("legal.terms"), getContent<LegalValue>("legal.privacy")]);
  return rows.map(toLegal);
}

export async function getLegal(type: LegalType): Promise<LegalDoc | null> {
  return toLegal(await getContent<LegalValue>(`legal.${type}`));
}

export async function updateLegal(type: LegalType, sections: LegalDoc["sections"]) {
  const current = await getContent<LegalValue>(`legal.${type}`);
  return toLegal(await putContent<LegalValue>(`legal.${type}`, { ...current.value, sections }));
}

// ---------- FAQ ----------

export async function listFaqs(): Promise<Faq[]> {
  return [...(await getContent<Faq[]>("faqs")).value].sort((a, b) => a.order - b.order);
}

export async function saveFaq(input: Omit<Faq, "id" | "order"> & { id?: string }) {
  const faqs = await listFaqs();
  let saved: Faq;
  if (input.id) {
    saved = { ...findIn(faqs, input.id, "FAQ"), ...input, id: input.id };
  } else {
    saved = { ...input, id: shortId("faq_"), order: faqs.length + 1 };
  }
  await putContent("faqs", input.id ? faqs.map((f) => (f.id === saved.id ? saved : f)) : [...faqs, saved]);
  return saved;
}

export async function deleteFaq(id: string) {
  const faqs = await listFaqs();
  const faq = findIn(faqs, id, "FAQ");
  await putContent("faqs", faqs.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i + 1 })));
  return faq;
}

// ---------- Doobie ----------

export async function listDoobieTopics(): Promise<DoobieTopic[]> {
  return [...(await getContent<DoobieTopic[]>("doobieTopics")).value].sort((a, b) => a.role.localeCompare(b.role) || a.order - b.order);
}

export async function saveDoobieTopic(input: Omit<DoobieTopic, "order"> & { isNew: boolean }) {
  const { isNew, ...data } = input;
  const topics = await listDoobieTopics();
  if (isNew) {
    if (topics.some((t) => t.id === data.id)) throw new Error("ID topik sudah dipakai.");
    const topic: DoobieTopic = { ...data, order: topics.filter((t) => t.role === data.role).length + 1 };
    await putContent("doobieTopics", [...topics, topic]);
    return topic;
  }
  const topic = { ...findIn(topics, data.id, "Topik"), ...data };
  await putContent("doobieTopics", topics.map((t) => (t.id === topic.id ? topic : t)));
  return topic;
}

export async function deleteDoobieTopic(id: string) {
  const topics = await listDoobieTopics();
  const topic = findIn(topics, id, "Topik");
  await putContent("doobieTopics", topics.filter((t) => t.id !== id));
  return topic;
}

// ---------- rewards & voucher ----------

export async function getRewardsData() {
  const [rewards, missions, levels, redemptions] = await Promise.all([
    getContent<Reward[]>("rewards"),
    getContent<Mission[]>("missions"),
    getContent<RewardLevel[]>("levels"),
    backend<Redemption[]>("/admin/redemptions"),
  ]);
  return { rewards: rewards.value, missions: missions.value, levels: levels.value, redemptions };
}

export async function saveReward(input: Omit<Reward, "id"> & { id?: string }) {
  const rewards = (await getContent<Reward[]>("rewards")).value;
  const saved: Reward = input.id
    ? { ...findIn(rewards, input.id, "Hadiah"), ...input, id: input.id }
    : { ...input, id: shortId(input.role === "teacher" ? "tr-" : "r-") };
  await putContent("rewards", input.id ? rewards.map((r) => (r.id === saved.id ? saved : r)) : [...rewards, saved]);
  return saved;
}

export async function saveMission(input: Omit<Mission, "id"> & { id?: string }) {
  const missions = (await getContent<Mission[]>("missions")).value;
  const saved: Mission = input.id
    ? { ...findIn(missions, input.id, "Misi"), ...input, id: input.id }
    : { ...input, id: shortId(input.role === "teacher" ? "t-" : "m-") };
  await putContent("missions", input.id ? missions.map((m) => (m.id === saved.id ? saved : m)) : [...missions, saved]);
  return saved;
}

export async function updateLevels(levels: RewardLevel[]) {
  return (await putContent("levels", levels)).value;
}

/** Batalkan voucher aktif (Madu dikembalikan ke pengguna oleh backend) */
export async function cancelRedemption(id: string) {
  return backend<Redemption>(`/admin/redemptions/${encodeURIComponent(id)}/cancel`, { method: "POST", body: {} });
}

// ---------- paket Plus, promo, pengaturan biaya ----------

export async function getPlusData() {
  const [plans, promos, settings] = await Promise.all([
    getContent<PlusPlan[]>("plans"),
    getContent<PromoCode[]>("promos"),
    getContent<AppSettings>("settings"),
  ]);
  return { plans: plans.value, promos: promos.value, settings: settings.value };
}

export async function updatePlan(role: PlusPlan["role"], key: PlusPlan["key"], data: Pick<PlusPlan, "price" | "note" | "badge">) {
  const plans = (await getContent<PlusPlan[]>("plans")).value;
  const plan = plans.find((p) => p.role === role && p.key === key);
  if (!plan) throw new NotFoundError("Paket tidak ditemukan");
  const saved = { ...plan, ...data };
  await putContent("plans", plans.map((p) => (p === plan ? saved : p)));
  return saved;
}

export async function savePromo(input: Omit<PromoCode, "usageCount">, isNew: boolean) {
  const promos = (await getContent<PromoCode[]>("promos")).value;
  const existing = promos.find((p) => p.code === input.code);
  if (isNew) {
    if (existing) throw new Error("Kode promo sudah ada.");
    const promo: PromoCode = { ...input, usageCount: 0 };
    await putContent("promos", [...promos, promo]);
    return promo;
  }
  if (!existing) throw new NotFoundError("Kode promo tidak ditemukan");
  const promo = { ...existing, ...input };
  await putContent("promos", promos.map((p) => (p.code === promo.code ? promo : p)));
  return promo;
}

export async function updateSettings(settings: AppSettings) {
  return (await putContent("settings", settings)).value;
}
