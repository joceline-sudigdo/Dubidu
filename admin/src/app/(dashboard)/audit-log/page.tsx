import type { Metadata } from "next";
import { Suspense } from "react";

import { AuditLogTable } from "@/components/audit/audit-log-table";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { listAuditLogs } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";

export const metadata: Metadata = { title: "Audit Log" };

// judul statis tampil instan, data dimuat di dalam Suspense
export default function AuditLogPage() {
  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Semua aksi admin tercatat di sini: siapa, aksi apa, targetnya, alasan, dan waktunya. Catatan tidak bisa diubah atau dihapus."
      />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <AuditLogContent />
      </Suspense>
    </>
  );
}

async function AuditLogContent() {
  await getCurrentAdmin();
  const logs = await listAuditLogs({ limit: 100 });
  return <AuditLogTable logs={logs} />;
}
