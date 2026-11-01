import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/format";
import type { AuditAction, AuditLog } from "@/types/audit";

// label & warna tiap aksi; merah untuk aksi berisiko/ditolak
const ACTION: Record<AuditAction, { label: string; tone: StatusTone }> = {
  AUTH_LOGIN: { label: "Masuk", tone: "brand" },
  AUTH_LOGIN_FAILED: { label: "Gagal masuk", tone: "danger" },
  AUTH_LOGOUT: { label: "Keluar", tone: "neutral" },
  ADMIN_CREATED: { label: "Admin dibuat", tone: "brand" },
  TEACHER_VERIFIED: { label: "Teacher diverifikasi", tone: "success" },
  TEACHER_REVISION_REQUESTED: { label: "Minta revisi", tone: "warning" },
  TEACHER_SKILLS_ADJUSTED: { label: "Sesuaikan keahlian", tone: "neutral" },
  TEACHER_REJECTED: { label: "Teacher ditolak", tone: "danger" },
  PAYMENT_CONFIRMED: { label: "Pembayaran dikonfirmasi", tone: "success" },
  PAYMENT_REJECTED: { label: "Bukti transfer ditolak", tone: "danger" },
  PAYMENT_METHOD_CREATED: { label: "Tujuan transfer dibuat", tone: "brand" },
  PAYMENT_METHOD_UPDATED: { label: "Tujuan transfer diubah", tone: "brand" },
  PAYOUT_TRANSFERRED: { label: "Pencairan ditransfer", tone: "success" },
  PAYOUT_REJECTED: { label: "Pencairan ditolak", tone: "danger" },
  USER_SUSPENDED: { label: "Akun dinonaktifkan", tone: "danger" },
  USER_ACTIVATED: { label: "Akun diaktifkan", tone: "success" },
  PSYCHOLOGIST_CREATED: { label: "Akun psikolog dibuat", tone: "brand" },
  REPORT_RESOLVED: { label: "Laporan ditindak", tone: "success" },
  REPORT_DISMISSED: { label: "Laporan diabaikan", tone: "neutral" },
  POST_HIDDEN: { label: "Postingan disembunyikan", tone: "danger" },
  POST_RESTORED: { label: "Postingan dipulihkan", tone: "success" },
  COMMENT_HIDDEN: { label: "Komentar disembunyikan", tone: "danger" },
  COMMENT_RESTORED: { label: "Komentar dipulihkan", tone: "success" },
  REVIEW_HIDDEN: { label: "Ulasan disembunyikan", tone: "danger" },
  REVIEW_RESTORED: { label: "Ulasan dipulihkan", tone: "success" },
  CONTENT_CREATED: { label: "Konten dibuat", tone: "brand" },
  CONTENT_UPDATED: { label: "Konten diubah", tone: "brand" },
  CONTENT_DELETED: { label: "Konten dihapus", tone: "danger" },
  REDEMPTION_CANCELLED: { label: "Voucher dibatalkan", tone: "danger" },
};

const COLUMNS: Column<AuditLog>[] = [
  {
    key: "time",
    header: "Waktu",
    className: "whitespace-nowrap text-muted-foreground",
    cell: (l) => formatDateTime(l.createdAt),
  },
  { key: "actor", header: "Pelaku", cell: (l) => <span className="font-medium">{l.actorName}</span> },
  {
    key: "action",
    header: "Aksi",
    cell: (l) => <StatusBadge label={ACTION[l.action].label} tone={ACTION[l.action].tone} />,
  },
  { key: "target", header: "Target", cell: (l) => l.targetLabel },
  {
    key: "reason",
    header: "Alasan",
    className: "max-w-xs text-muted-foreground",
    cell: (l) => l.reason ?? "—",
  },
  {
    key: "ip",
    header: "IP",
    className: "whitespace-nowrap font-mono text-xs text-muted-foreground",
    cell: (l) => l.ipAddress ?? "—",
  },
];

export function AuditLogTable({ logs, compact }: { logs: AuditLog[]; compact?: boolean }) {
  const columns = compact ? COLUMNS.filter((c) => c.key !== "ip" && c.key !== "reason") : COLUMNS;
  return <DataTable columns={columns} rows={logs} rowKey={(l) => l.id} empty="Belum ada aktivitas tercatat." />;
}
