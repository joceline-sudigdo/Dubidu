import { Gavel, Lock, XCircle } from "lucide-react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { Notice } from "@/components/shared/detail-card";
import { CheckboxField } from "@/components/shared/form-fields";
import { StatusBadge } from "@/components/shared/status-badge";
import { resolveReportAction } from "@/lib/actions/moderation";
import { formatDateTime } from "@/lib/format";
import { REPORT_STATUS, REPORT_TARGET } from "@/lib/labels";
import type { ContentReport } from "@/types/community";

// antrean laporan pengguna. Laporan percakapan: hanya alasan, isi chat tidak pernah ditampilkan.
export function ReportList({ reports }: { reports: ContentReport[] }) {
  if (reports.length === 0) return <Notice>Tidak ada laporan di sini. 🎉</Notice>;

  return (
    <div className="space-y-3">
      {reports.map((r) => {
        const canHide = r.targetType === "POST" || r.targetType === "COMMENT";
        return (
          <article key={r.id} className="rounded-2xl border bg-white p-5 shadow-sm shadow-brand-dark/5">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark">{REPORT_TARGET[r.targetType]}</span>
                  <StatusBadge {...REPORT_STATUS[r.status]} />
                  <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
                </div>
                <p className="font-semibold">{r.reason}</p>
                <p className="text-sm text-muted-foreground">
                  Dilaporkan oleh {r.reporterName}
                  {r.targetUserName && ` · pemilik: ${r.targetUserName}`}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-surface p-3 text-sm">
              {r.targetType === "CONVERSATION" ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="size-4" /> {r.targetLabel}. Isi percakapan tidak ditampilkan di admin.
                </span>
              ) : (
                <span>“{r.targetLabel}”</span>
              )}
              {r.detail && <p className="mt-2 text-muted-foreground">Keterangan pelapor: {r.detail}</p>}
            </div>

            {r.status === "OPEN" ? (
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <ActionDialog
                  action={resolveReportAction}
                  hidden={{ id: r.id, outcome: "dismiss" }}
                  triggerLabel="Abaikan"
                  triggerIcon={<XCircle />}
                  triggerSize="sm"
                  title="Abaikan laporan?"
                  description="Laporan ditutup tanpa tindakan pada konten atau akun."
                  submitLabel="Abaikan laporan"
                  reason={{ label: "Alasan", required: true, quick: ["Tidak melanggar aturan", "Laporan duplikat"] }}
                />
                <ActionDialog
                  action={resolveReportAction}
                  hidden={{ id: r.id, outcome: "resolve" }}
                  triggerLabel="Tindak"
                  triggerIcon={<Gavel />}
                  triggerTone="danger"
                  triggerSize="sm"
                  title="Tindak laporan"
                  description="Pilih tindakan, lalu tulis catatannya. Semua tindakan tercatat di audit log."
                  submitLabel="Terapkan tindakan"
                  submitTone="danger"
                  reason={{ label: "Catatan tindakan", required: true, placeholder: "Misal: promosi jasa luar dengan klaim menyesatkan" }}>
                  <div className="space-y-3 rounded-xl border p-3">
                    {canHide && <CheckboxField label={`Sembunyikan ${REPORT_TARGET[r.targetType].toLowerCase()}`} name="hideContent" defaultChecked />}
                    {r.targetUserId && (
                      <CheckboxField
                        label={`Nonaktifkan akun ${r.targetUserName}`}
                        name="suspendUser"
                        defaultChecked={r.targetType === "USER"}
                        hint="Untuk pelanggaran berat atau berulang"
                      />
                    )}
                    {!canHide && !r.targetUserId && <p className="text-sm text-muted-foreground">Laporan akan ditandai sudah ditindak.</p>}
                  </div>
                </ActionDialog>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {r.resolution} · {r.handledByName} {r.handledAt && `· ${formatDateTime(r.handledAt)}`}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
