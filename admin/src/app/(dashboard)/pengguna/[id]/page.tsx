import { ArrowLeft, Ban, Crown, ShieldCheck, UserCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { DetailCard, InfoRow, Notice } from "@/components/shared/detail-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { setUserStatusAction } from "@/lib/actions/users";
import { getUser, listApplications } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { ROLE } from "@/lib/labels";

export const metadata: Metadata = { title: "Detail Pengguna" };

export default function UserDetailPage(props: PageProps<"/pengguna/[id]">) {
  return (
    <>
      <Link href="/pengguna" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-brand">
        <ArrowLeft className="size-4" /> Kembali ke daftar
      </Link>
      <Suspense fallback={<TableSkeleton rows={6} />}>
        <UserDetail params={props.params} />
      </Suspense>
    </>
  );
}

async function UserDetail({ params }: Pick<PageProps<"/pengguna/[id]">, "params">) {
  await getCurrentAdmin();
  const { id } = await params;
  const u = await getUser(id);
  if (!u) notFound();
  const application = u.role === "TEACHER" ? (await listApplications()).find((a) => a.userId === u.id) : undefined;

  return (
    <>
      <PageHeader
        title={u.fullName}
        description={`${ROLE[u.role]} · bergabung ${formatDateTime(u.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            {u.isDemo && <StatusBadge label="Akun demo" tone="neutral" />}
            {u.plusActive && <StatusBadge label="Plus" tone="warning" />}
            <StatusBadge label={u.isActive ? "Aktif" : "Nonaktif"} tone={u.isActive ? "success" : "danger"} className="px-3 py-1.5 text-sm" />
          </div>
        }
      />

      {!u.isActive && u.suspendedReason && (
        <div className="mb-5">
          <Notice tone="danger">
            <b>Akun dinonaktifkan.</b> {u.suspendedReason}
          </Notice>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <DetailCard title="Akun">
            <dl>
              <InfoRow label="Email">{u.email ?? "—"}</InfoRow>
              <InfoRow label="Nomor HP">{u.phone ?? "—"}</InfoRow>
              <InfoRow label="Domisili">{u.domicile ?? "—"}</InfoRow>
              <InfoRow label="Terakhir aktif">{u.lastActiveAt ? formatDateTime(u.lastActiveAt) : "—"}</InfoRow>
              {u.role !== "PSYCHOLOGIST" && <InfoRow label="Saldo ikan">{u.points.toLocaleString("id-ID")} ikan</InfoRow>}
              {u.role !== "PSYCHOLOGIST" && (
                <InfoRow label="Dubidu Plus">
                  {u.plusActive ? (
                    <span className="flex items-center gap-1.5 text-warning-foreground">
                      <Crown className="size-4" /> Aktif
                    </span>
                  ) : (
                    "Paket gratis"
                  )}
                </InfoRow>
              )}
              {u.role !== "PSYCHOLOGIST" && <InfoRow label="Kontrak aktif">{u.activeEngagements}</InfoRow>}
            </dl>
          </DetailCard>

          {u.teacher && (
            <DetailCard
              title="Profil shadow teacher"
              action={
                application && (
                  <Link href={`/verifikasi/${application.id}`} className="text-sm font-semibold text-brand hover:underline">
                    Lihat pengajuan
                  </Link>
                )
              }>
              <dl>
                <InfoRow label="Verifikasi">{u.teacher.verificationStatus}</InfoRow>
                <InfoRow label="Pengalaman">{u.teacher.experienceYears} tahun</InfoRow>
                <InfoRow label="Tarif per sesi">{formatRupiah(u.teacher.pricePerSession)}</InfoRow>
                <InfoRow label="Rating">{u.teacher.reviewCount ? `${u.teacher.rating} (${u.teacher.reviewCount} ulasan)` : "Belum ada ulasan"}</InfoRow>
              </dl>
            </DetailCard>
          )}

          {u.psychologist && (
            <DetailCard title="Profil psikolog">
              <dl>
                <InfoRow label="Jabatan">{u.psychologist.title}</InfoRow>
                <InfoRow label="Tempat praktik">{u.psychologist.place ?? "—"}</InfoRow>
                <InfoRow label="Pengalaman">{u.psychologist.experienceYears} tahun</InfoRow>
                <InfoRow label="Tarif">
                  {formatRupiah(u.psychologist.basePrice)} / {u.psychologist.durationMinutes} menit
                  {u.psychologist.discountPercent > 0 && ` · diskon ${u.psychologist.discountPercent}%`}
                </InfoRow>
                <InfoRow label="Keahlian">{u.psychologist.categories.join(", ")}</InfoRow>
                <InfoRow label="Rating">
                  {u.psychologist.reviewCount ? `${u.psychologist.rating} (${u.psychologist.reviewCount} ulasan)` : "Belum ada ulasan"}
                </InfoRow>
              </dl>
            </DetailCard>
          )}
        </div>

        <div className="space-y-5">
          <DetailCard title="Status akun">
            <p className="mb-4 text-sm text-muted-foreground">
              {u.isActive
                ? "Akun nonaktif tidak bisa login, tidak muncul di matching, dan postingannya disembunyikan."
                : "Aktifkan kembali kalau masalahnya sudah selesai."}
            </p>
            {u.isActive ? (
              <ActionDialog
                action={setUserStatusAction}
                hidden={{ id: u.id, activate: "false" }}
                triggerLabel="Nonaktifkan akun"
                triggerIcon={<Ban />}
                triggerTone="danger"
                title={`Nonaktifkan ${u.fullName}?`}
                description={
                  u.activeEngagements > 0
                    ? `Pengguna ini punya ${u.activeEngagements} kontrak aktif. Pastikan pihak lain sudah dihubungi.`
                    : "Pengguna akan langsung keluar dari aplikasi."
                }
                submitLabel="Nonaktifkan"
                submitTone="danger"
                reason={{
                  label: "Alasan",
                  required: true,
                  quick: ["Melanggar aturan komunitas", "Transaksi di luar aplikasi", "Laporan berulang dari pengguna lain", "Permintaan pemilik akun"],
                }}
              />
            ) : (
              <ActionDialog
                action={setUserStatusAction}
                hidden={{ id: u.id, activate: "true" }}
                triggerLabel="Aktifkan kembali"
                triggerIcon={<UserCheck />}
                triggerTone="success"
                title={`Aktifkan ${u.fullName}?`}
                submitLabel="Aktifkan"
                submitTone="success"
                reason={{ label: "Alasan", required: true, placeholder: "Misal: banding diterima setelah klarifikasi" }}
              />
            )}
          </DetailCard>

          <Notice>
            <span className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              Data anak, laporan perkembangan, dan isi chat pengguna ini sengaja tidak ditampilkan di panel admin.
            </span>
          </Notice>
        </div>
      </div>
    </>
  );
}
