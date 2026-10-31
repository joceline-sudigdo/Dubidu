import "server-only";

import type { AuditLog } from "@/types/audit";

// Disimpan di memori proses server. Hilang saat server restart (sampai tersambung backend).
export const mockAuditLogs: AuditLog[] = [
  {
    id: "log_003",
    actorId: "adm_01",
    actorName: "Admin Dubidu",
    action: "AUTH_LOGOUT",
    targetType: "ADMIN",
    targetId: "adm_01",
    targetLabel: "admin@dubidu.id",
    reason: null,
    ipAddress: "182.253.10.4",
    createdAt: "2026-10-31T11:02:00.000Z",
  },
  {
    id: "log_002",
    actorId: "adm_01",
    actorName: "Admin Dubidu",
    action: "AUTH_LOGIN",
    targetType: "ADMIN",
    targetId: "adm_01",
    targetLabel: "admin@dubidu.id",
    reason: null,
    ipAddress: "182.253.10.4",
    createdAt: "2026-10-31T09:15:00.000Z",
  },
  {
    id: "log_001",
    actorId: null,
    actorName: "Sistem (seed)",
    action: "ADMIN_CREATED",
    targetType: "ADMIN",
    targetId: "adm_01",
    targetLabel: "admin@dubidu.id",
    reason: "Akun dibuat lewat npm run admin:create",
    ipAddress: null,
    createdAt: "2026-10-30T15:30:50.000Z",
  },
];
