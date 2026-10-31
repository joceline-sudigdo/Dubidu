import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { DetailCard, InfoRow, Notice } from "@/components/shared/detail-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { confirmPaymentAction, rejectPaymentAction } from "@/lib/actions/payments";
import { getPayment } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { PAYMENT_PURPOSE, PAYMENT_STATUS } from "@/lib/labels";

export const metadata: Metadata = { title: "Periksa Pembayaran" };

export default function PaymentDetailPage(props: PageProps<"/pembayaran/[id]">) {
  return (
    <>
      <Link href="/pembayaran" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-brand">
        <ArrowLeft className="size-4" /> Kembali ke daftar
      </Link>
      <Suspense fallback={<TableSkeleton rows={6} />}>
        <PaymentDetail params={props.params} />
      </Suspense>
    </>
  );
}

async function PaymentDetail({ params }: Pick<PageProps<"/pembayaran/[id]">, "params">) {
  await getCurrentAdmin();
  const { id } = await params;
  const p = await getPayment(id);
  if (!p) notFound();

  return (
    <>
      <PageHeader
        title={p.invoiceNo}
        description={`${p.userName} · ${PAYMENT_PURPOSE[p.purpose]}`}
        actions={<StatusBadge {...PAYMENT_STATUS[p.status]} className="px-3 py-1.5 text-sm" />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <DetailCard title="Rincian tagihan">
          <dl>
            <InfoRow label="Pembayar">{p.userName}</InfoRow>
            <InfoRow label="Untuk">{p.description}</InfoRow>
            <InfoRow label="Nominal tagihan">{formatRupiah(p.amount)}</InfoRow>
            <InfoRow label="Kode unik">{p.uniqueCode ?? "—"}</InfoRow>
            <InfoRow label="Harus ditransfer">
              <span className="text-lg font-bold text-brand-dark">{formatRupiah(p.amountDue ?? p.amount)}</span>
            </InfoRow>
            <InfoRow label="Tujuan">{p.manualMethodLabel ?? "—"}</InfoRow>
            <InfoRow label="Dibuat">{formatDateTime(p.createdAt)}</InfoRow>
            {p.verifiedAt && (
              <InfoRow label={p.status === "PAID" ? "Dikonfirmasi" : "Diperiksa"}>
                {p.verifiedByName} · {formatDateTime(p.verifiedAt)}
              </InfoRow>
            )}
            {p.rejectReason && <InfoRow label="Alasan ditolak">{p.rejectReason}</InfoRow>}
          </dl>
        </DetailCard>

        <DetailCard title="Bukti transfer">
          {p.proofUrl ? (
            <div className="space-y-4">
              <a href={p.proofUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border bg-surface">
                <Image src={p.proofUrl} alt={`Bukti transfer ${p.invoiceNo}`} width={600} height={400} className="h-64 w-full object-contain" />
              </a>
              <dl>
                <InfoRow label="Nama pengirim">{p.proofSenderName ?? "—"}</InfoRow>
                <InfoRow label="Catatan pengirim">{p.proofNote ?? "—"}</InfoRow>
                <InfoRow label="Diunggah">{p.proofSubmittedAt ? formatDateTime(p.proofSubmittedAt) : "—"}</InfoRow>
              </dl>
              {p.proofNote?.toLowerCase().includes("kode unik") && (
                <Notice tone="warning">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="size-4" /> Pengirim menyebut nominal berbeda. Pastikan jumlah di mutasi rekening.
                  </span>
                </Notice>
              )}
            </div>
          ) : (
            <Notice>Pengguna belum mengunggah bukti transfer.</Notice>
          )}
        </DetailCard>
      </div>

      {p.status === "VERIFYING" && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-5">
          <p className="mr-auto text-sm text-muted-foreground">
            Cek mutasi rekening tujuan: nominal <b className="text-foreground">{formatRupiah(p.amountDue ?? p.amount)}</b> atas nama{" "}
            <b className="text-foreground">{p.proofSenderName}</b>.
          </p>
          <ActionDialog
            action={rejectPaymentAction}
            hidden={{ id: p.id }}
            triggerLabel="Tolak bukti"
            triggerIcon={<XCircle />}
            triggerTone="danger"
            title="Tolak bukti transfer?"
            description="Status kembali ke Menunggu transfer dan pengguna diminta mengunggah bukti yang benar."
            submitLabel="Tolak"
            submitTone="danger"
            reason={{
              label: "Alasan",
              required: true,
              quick: ["Dana belum masuk ke rekening", "Nominal tidak sesuai", "Bukti tidak terbaca", "Bukti bukan untuk invoice ini"],
            }}
          />
          <ActionDialog
            action={confirmPaymentAction}
            hidden={{ id: p.id }}
            triggerLabel="Konfirmasi lunas"
            triggerIcon={<CheckCircle2 />}
            triggerTone="success"
            title="Konfirmasi pembayaran?"
            description={`Pastikan ${formatRupiah(p.amountDue ?? p.amount)} sudah masuk ke ${p.manualMethodLabel}. Layanan langsung aktif untuk pengguna.`}
            submitLabel="Ya, sudah masuk"
            submitTone="success"
            reason={{ label: "Catatan", placeholder: "Misal: cocok dengan mutasi BCA 31 Okt 16.12" }}
          />
        </div>
      )}
    </>
  );
}
