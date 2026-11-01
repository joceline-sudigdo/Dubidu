import { ArrowLeft, CheckCircle2, ExternalLink, FileWarning, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { DetailCard, InfoRow, Notice } from "@/components/shared/detail-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { decideTeacher } from "@/lib/actions/verification";
import { getApplication } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { DECISION, RECOMMENDATION, REVISION_ISSUES } from "@/lib/labels";

export const metadata: Metadata = { title: "Tinjau Pengajuan" };

export default function TinjauPage(props: PageProps<"/verifikasi/[id]">) {
  return (
    <>
      <Link href="/verifikasi" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-brand">
        <ArrowLeft className="size-4" /> Kembali ke daftar
      </Link>
      <Suspense fallback={<TableSkeleton rows={6} />}>
        <TinjauContent params={props.params} />
      </Suspense>
    </>
  );
}

async function TinjauContent({ params }: Pick<PageProps<"/verifikasi/[id]">, "params">) {
  await getCurrentAdmin();
  const { id } = await params;
  const app = await getApplication(id);
  if (!app) notFound();

  const missing = app.documents.filter((d) => !d.url);
  const review = app.psychologistReview;
  const open = app.status === "PENDING" || app.status === "REVISION";

  return (
    <>
      <PageHeader
        title={app.fullName}
        description={`Diajukan ${formatDateTime(app.submittedAt)} · ${app.domicile}`}
        actions={<StatusBadge {...DECISION[app.status]} className="px-3 py-1.5 text-sm" />}
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <DetailCard title="Profil pendaftar">
            <dl>
              <InfoRow label="Gelar">{app.title ?? "—"}</InfoRow>
              <InfoRow label="Pendidikan">{app.education}</InfoRow>
              <InfoRow label="Pengalaman">{app.experienceYears > 0 ? `${app.experienceYears} tahun` : "Kurang dari 1 tahun"}</InfoRow>
              <InfoRow label="Tarif per sesi">{formatRupiah(app.pricePerSession)}</InfoRow>
              <InfoRow label="Spesialisasi">
                <div className="flex flex-wrap gap-1.5">
                  {app.specializations.map((s) => (
                    <span key={s} className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-dark">
                      {s}
                    </span>
                  ))}
                </div>
              </InfoRow>
              <InfoRow label="Bio">
                <span className="font-normal leading-relaxed">{app.bio}</span>
              </InfoRow>
            </dl>
          </DetailCard>

          <DetailCard title={`Dokumen (${app.documents.length - missing.length}/${app.documents.length})`}>
            {missing.length > 0 && (
              <div className="mb-3">
                <Notice tone="warning">
                  <span className="flex items-center gap-2">
                    <FileWarning className="size-4" /> Belum diunggah: {missing.map((d) => d.label).join(", ")}
                  </span>
                </Notice>
              </div>
            )}
            <ul className="divide-y">
              {app.documents.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{d.label}</p>
                    <p className="text-xs text-muted-foreground">{d.type}</p>
                  </div>
                  {d.url ? (
                    <>
                      <StatusBadge label={d.status === "VERIFIED" ? "Valid" : "Belum dicek"} tone={d.status === "VERIFIED" ? "success" : "warning"} />
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                        Lihat <ExternalLink className="size-3.5" />
                      </a>
                    </>
                  ) : (
                    <StatusBadge label="Belum diunggah" tone="danger" />
                  )}
                </li>
              ))}
            </ul>
          </DetailCard>
        </div>

        <div className="space-y-5">
          <DetailCard title="Rekomendasi psikolog">
            {review ? (
              <div className="space-y-3 text-sm">
                <StatusBadge {...RECOMMENDATION[review.recommendation]} />
                <dl>
                  <InfoRow label="Psikolog">{review.psychologistName}</InfoRow>
                  <InfoRow label="Interview">{review.interview ?? "—"}</InfoRow>
                  <InfoRow label="Ditinjau">{formatDateTime(review.reviewedAt)}</InfoRow>
                </dl>
                {review.issues.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-warning-foreground">
                    {review.issues.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                )}
                <p className="rounded-xl bg-surface p-3 leading-relaxed">“{review.note}”</p>
                <p className="text-xs text-muted-foreground">Hanya bisa dibaca. Keputusan akhir ada di admin.</p>
              </div>
            ) : (
              <Notice>Psikolog belum menjadwalkan atau menyelesaikan interview. Kamu tetap bisa memutuskan, tapi sebaiknya tunggu rekomendasinya.</Notice>
            )}
          </DetailCard>

          <DetailCard title="Keputusan admin">
            {open ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Keputusan dikirim ke pendaftar dan tercatat di audit log.</p>
                <div className="flex flex-wrap gap-2">
                  <ActionDialog
                    action={decideTeacher}
                    hidden={{ id: app.id, decision: "VERIFIED" }}
                    triggerLabel="Verifikasi"
                    triggerIcon={<ShieldCheck />}
                    triggerTone="success"
                    title={`Verifikasi ${app.fullName}?`}
                    description="Teacher akan muncul di hasil matching orang tua dan bisa menerima pendampingan."
                    submitLabel="Ya, verifikasi"
                    submitTone="success"
                    reason={{ label: "Catatan", placeholder: "Misal: dokumen lengkap, sesuai rekomendasi psikolog" }}>
                    {missing.length > 0 && <Notice tone="warning">Masih ada dokumen yang belum diunggah.</Notice>}
                  </ActionDialog>
                  <ActionDialog
                    action={decideTeacher}
                    hidden={{ id: app.id, decision: "REVISION" }}
                    triggerLabel="Minta revisi"
                    triggerIcon={<RotateCcw />}
                    title="Minta perbaikan"
                    description="Pendaftar diminta memperbaiki data lalu mengajukan ulang."
                    submitLabel="Kirim permintaan revisi"
                    reason={{ label: "Catatan tambahan", placeholder: "Jelaskan apa yang perlu diperbaiki" }}>
                    <fieldset className="space-y-2">
                      <legend className="mb-2 text-sm font-medium">Yang perlu diperbaiki</legend>
                      {[...missing.map((d) => `${d.label} belum diunggah`), ...REVISION_ISSUES].map((issue) => (
                        <label key={issue} className="flex items-center gap-2.5 text-sm">
                          <input type="checkbox" name="issues" value={issue} className="size-4 accent-brand" />
                          {issue}
                        </label>
                      ))}
                    </fieldset>
                  </ActionDialog>
                  <ActionDialog
                    action={decideTeacher}
                    hidden={{ id: app.id, decision: "REJECTED" }}
                    triggerLabel="Tolak"
                    triggerIcon={<XCircle />}
                    triggerTone="danger"
                    title={`Tolak ${app.fullName}?`}
                    description="Pendaftar tidak bisa menerima pendampingan. Alasan wajib diisi dan dikirim ke pendaftar."
                    submitLabel="Tolak pengajuan"
                    submitTone="danger"
                    reason={{ label: "Alasan penolakan", required: true, quick: ["Pengalaman belum relevan", "Dokumen tidak valid", "Tidak lolos interview"] }}
                  />
                </div>
                {app.status === "REVISION" && app.decisionNote && <Notice>Catatan revisi sebelumnya: {app.decisionNote}</Notice>}
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 font-semibold">
                  {app.status === "VERIFIED" ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-danger" />}
                  {DECISION[app.status].label} {app.decidedAt && `· ${formatDateTime(app.decidedAt)}`}
                </p>
                {app.decisionNote && <p className="rounded-xl bg-surface p-3">{app.decisionNote}</p>}
              </div>
            )}
          </DetailCard>
        </div>
      </div>
    </>
  );
}
