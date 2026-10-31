import { Crown, Pencil, Plus, Settings2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { BackLink } from "@/components/shared/back-link";
import { DataTable, type Column } from "@/components/shared/data-table";
import { DetailCard, InfoRow } from "@/components/shared/detail-card";
import { CheckboxField, Field, SelectField } from "@/components/shared/form-fields";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { savePromoAction, updatePlanAction, updateSettingsAction } from "@/lib/actions/content";
import { getPlusData } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { formatDateTime, formatRupiah } from "@/lib/format";
import type { PromoCode } from "@/types/content";

export const metadata: Metadata = { title: "Paket Plus & Promo" };

const APPLIES = { CONSULTATION: "Konsultasi", SUBSCRIPTION: "Dubidu Plus", ALL: "Semua" } as const;

function PromoFields({ p }: { p?: PromoCode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Kode" name="code" defaultValue={p?.code} readOnly={!!p} required placeholder="DUBIDUSAYANG" className="uppercase" />
      <Field label="Diskon (%)" name="discountPercent" type="number" min={1} max={50} defaultValue={p?.discountPercent ?? 10} required />
      <SelectField
        label="Berlaku untuk"
        name="appliesTo"
        defaultValue={p?.appliesTo ?? "ALL"}
        options={Object.entries(APPLIES).map(([value, label]) => ({ value, label }))}
      />
      <Field label="Berlaku sampai" name="expiresAt" type="date" defaultValue={p?.expiresAt?.slice(0, 10) ?? ""} hint="Kosongkan bila tanpa batas" />
      <CheckboxField label="Aktif" name="active" defaultChecked={p?.active ?? true} className="sm:col-span-2" />
    </div>
  );
}

const PROMO_COLUMNS: Column<PromoCode>[] = [
  { key: "code", header: "Kode", cell: (p) => <span className="font-mono font-semibold">{p.code}</span> },
  { key: "disc", header: "Diskon", className: "font-semibold", cell: (p) => `${p.discountPercent}%` },
  { key: "for", header: "Berlaku untuk", className: "text-sm", cell: (p) => APPLIES[p.appliesTo] },
  { key: "use", header: "Dipakai", className: "text-sm", cell: (p) => `${p.usageCount}×` },
  { key: "exp", header: "Sampai", className: "whitespace-nowrap text-muted-foreground", cell: (p) => (p.expiresAt ? formatDateTime(p.expiresAt) : "Tanpa batas") },
  { key: "status", header: "Status", cell: (p) => <StatusBadge label={p.active ? "Aktif" : "Nonaktif"} tone={p.active ? "success" : "neutral"} /> },
  {
    key: "act",
    header: "",
    className: "text-right",
    cell: (p) => (
      <ActionDialog
        action={savePromoAction}
        hidden={{ isNew: "false" }}
        triggerLabel="Ubah"
        triggerIcon={<Pencil />}
        triggerSize="sm"
        title={`Ubah promo ${p.code}`}
        submitLabel="Simpan"
        reason={{ label: "Alasan perubahan" }}
        wide>
        <PromoFields p={p} />
      </ActionDialog>
    ),
  },
];

export default function PlusPage() {
  return (
    <>
      <BackLink href="/konten" label="Konten" />
      <PageHeader title="Paket Plus & Promo" description="Harga langganan Dubidu Plus, kode promo, dan biaya platform yang dipotong dari pencairan." />
      <Suspense fallback={<TableSkeleton />}>
        <PlusContent />
      </Suspense>
    </>
  );
}

async function PlusContent() {
  await getCurrentAdmin();
  const { plans, promos, settings } = await getPlusData();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">Harga Dubidu Plus</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => (
            <article key={`${p.role}-${p.key}`} className="flex flex-col gap-2 rounded-2xl border bg-linear-to-br from-warning-soft to-white p-5">
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-warning-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide text-warning-foreground">
                  {p.role === "parent" ? "Orang tua" : "Teacher"} · {p.title}
                </span>
              </div>
              <p className="text-2xl font-bold text-brand-dark">{formatRupiah(p.price)}</p>
              <p className="text-xs text-muted-foreground">{p.note}</p>
              {p.badge && <StatusBadge label={p.badge} tone="danger" className="w-fit" />}
              <div className="mt-auto pt-2">
                <ActionDialog
                  action={updatePlanAction}
                  hidden={{ role: p.role, key: p.key }}
                  triggerLabel="Ubah harga"
                  triggerIcon={<Pencil />}
                  triggerSize="sm"
                  title={`Plus ${p.title} untuk ${p.role === "parent" ? "orang tua" : "teacher"}`}
                  description="Harga baru berlaku untuk pembelian dan perpanjangan berikutnya."
                  submitLabel="Simpan harga"
                  reason={{ label: "Alasan perubahan harga", required: true }}>
                  <div className="grid gap-3">
                    <Field label="Harga (Rp)" name="price" type="number" min={10000} step={1000} defaultValue={p.price} required />
                    <Field label="Keterangan" name="note" defaultValue={p.note} required />
                    <Field label="Badge" name="badge" defaultValue={p.badge ?? ""} placeholder="Hemat 17%" hint="Kosongkan bila tidak perlu" />
                  </div>
                </ActionDialog>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-brand-dark">Kode promo</h2>
          <ActionDialog
            action={savePromoAction}
            hidden={{ isNew: "true" }}
            triggerLabel="Tambah promo"
            triggerIcon={<Plus />}
            triggerTone="primary"
            title="Tambah kode promo"
            submitLabel="Simpan"
            wide>
            <PromoFields />
          </ActionDialog>
        </div>
        <DataTable columns={PROMO_COLUMNS} rows={promos} rowKey={(p) => p.code} empty="Belum ada kode promo." />
      </section>

      <DetailCard
        title="Biaya platform & pencairan"
        action={
          <ActionDialog
            action={updateSettingsAction}
            triggerLabel="Ubah biaya"
            triggerIcon={<Settings2 />}
            triggerSize="sm"
            title="Ubah biaya"
            description="Berlaku untuk termin dan pencairan berikutnya, tidak mengubah transaksi lama."
            submitLabel="Simpan"
            reason={{ label: "Alasan", required: true }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Biaya platform (%)" name="platformFeePercent" type="number" min={0} max={30} defaultValue={settings.platformFeePercent} />
              <Field label="Biaya platform Plus (%)" name="plusPlatformFeePercent" type="number" min={0} max={30} defaultValue={settings.plusPlatformFeePercent} />
              <Field label="Biaya transfer pencairan (Rp)" name="payoutFee" type="number" min={0} step={500} defaultValue={settings.payoutFee} />
              <Field label="Minimal pencairan (Rp)" name="minPayout" type="number" min={10000} step={5000} defaultValue={settings.minPayout} />
            </div>
          </ActionDialog>
        }>
        <dl>
          <InfoRow label="Biaya platform">{settings.platformFeePercent}% dari setiap termin</InfoRow>
          <InfoRow label="Biaya platform Plus">{settings.plusPlatformFeePercent}% untuk teacher Plus</InfoRow>
          <InfoRow label="Biaya transfer">{formatRupiah(settings.payoutFee)} per pencairan</InfoRow>
          <InfoRow label="Minimal pencairan">{formatRupiah(settings.minPayout)}</InfoRow>
        </dl>
      </DetailCard>
    </div>
  );
}
