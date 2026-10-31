// Audit log admin. Belum ada di skema backend: perlu tabel baru `AdminAuditLog`.
// Setiap aksi yang mengubah data wajib menulis satu baris di sini.

export type AuditAction =
  | "AUTH_LOGIN"
  | "AUTH_LOGIN_FAILED"
  | "AUTH_LOGOUT"
  | "ADMIN_CREATED"
  | "TEACHER_VERIFIED"
  | "TEACHER_REVISION_REQUESTED"
  | "TEACHER_REJECTED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_REJECTED"
  | "PAYMENT_METHOD_CREATED"
  | "PAYMENT_METHOD_UPDATED"
  | "PAYOUT_TRANSFERRED"
  | "PAYOUT_REJECTED"
  | "USER_SUSPENDED"
  | "USER_ACTIVATED"
  | "PSYCHOLOGIST_CREATED"
  | "REPORT_RESOLVED"
  | "REPORT_DISMISSED"
  | "POST_HIDDEN"
  | "POST_RESTORED"
  | "COMMENT_HIDDEN"
  | "COMMENT_RESTORED"
  | "REVIEW_HIDDEN"
  | "REVIEW_RESTORED"
  | "CONTENT_CREATED"
  | "CONTENT_UPDATED"
  | "CONTENT_DELETED"
  | "REDEMPTION_CANCELLED";

export type AuditTargetType =
  | "ADMIN"
  | "USER"
  | "TEACHER"
  | "PAYMENT"
  | "PAYMENT_METHOD"
  | "PAYOUT"
  | "REPORT"
  | "POST"
  | "COMMENT"
  | "REVIEW"
  | "LEGAL"
  | "FAQ"
  | "DOOBIE"
  | "REWARD"
  | "MISSION"
  | "LEVEL"
  | "REDEMPTION"
  | "PLAN"
  | "PROMO"
  | "SETTING";

export type AuditLog = {
  id: string;
  actorId: string | null; // null = percobaan login yang gagal / sistem
  actorName: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string | null;
  targetLabel: string;
  reason: string | null;
  ipAddress: string | null;
  createdAt: string; // ISO
};

export type NewAuditLog = Omit<AuditLog, "id" | "createdAt">;
