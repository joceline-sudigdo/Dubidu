import { ArrowLeft, Landmark, Pencil, Plus, QrCode } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { CheckboxField, Field, SelectField, TextareaField } from "@/components/shared/form-fields";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { savePaymentMethodAction } from "@/lib/actions/payments";
import { listPaymentMethods } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import type { PaymentMethod } from "@/types/finance";

export const metadata: Metadata = { title: "Tujuan Transfer" };

// kolom form tambah/ubah tujuan transfer
function MethodFields({ m }: { m?: PaymentMethod }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <SelectField
        label="Jenis"
        name="type"
        defaultValue={m?.type ?? "BANK_TRANSFER"}
        options={[
          { value: "BANK_TRANSFER", label: "Transfer bank" },
          { value: "QRIS", label: "QRIS" },
        ]}
      />
      <Field label="Nama tampilan" name="label" defaultValue={m?.label} placeholder="Transfer BCA" required />
      <Field label="Nama bank" name="bankName" defaultValue={m?.bankName ?? ""} placeholder="BCA" hint="Khusus transfer bank" />
      <Field label="Nomor rekening" name="accountNumber" defaultValue={m?.accountNumber ?? ""} inputMode="numeric" hint="Khusus transfer bank" />
      <Field label="Nama pemilik / merchant" name="accountName" defaultValue={m?.accountName} required className="sm:col-span-2" />
      <TextareaField label="Petunjuk untuk pengguna" name="instructions" defaultValue={m?.instructions ?? ""} className="sm:col-span-2" />
      <CheckboxField label="Tampilkan di aplikasi" name="active" defaultChecked={m?.active ?? true} className="sm:col-span-2" />
    </div>
  );
}

export default function TujuanPage() {
  return (
    <>
      <Link href="/pembayaran" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-brand">
        <ArrowLeft className="size-4" /> Bukti Transfer
      </Link>
      <PageHeader
        title="Tujuan Transfer"
        description="Rekening dan QRIS DUBIDU yang ditampilkan ke pengguna saat membayar manual."
        actions={
          <ActionDialog
            action={savePaymentMethodAction}
            triggerLabel="Tambah tujuan"
            triggerIcon={<Plus />}
            triggerTone="primary"
            title="Tambah tujuan transfer"
            submitLabel="Simpan"
            wide>
            <MethodFields />
          </ActionDialog>
        }
      />
      <Suspense fallback={<TableSkeleton rows={3} />}>
        <MethodList />
      </Suspense>
    </>
  );
}

async function MethodList() {
  await getCurrentAdmin();
  const methods = await listPaymentMethods();

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {methods.map((m) => (
        <article key={m.id} className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm shadow-brand-dark/5">
          <div className="flex items-start gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
              {m.type === "QRIS" ? <QrCode className="size-5" /> : <Landmark className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.type === "QRIS" ? "QRIS" : m.bankName}</p>
            </div>
            <StatusBadge label={m.active ? "Aktif" : "Nonaktif"} tone={m.active ? "success" : "neutral"} />
          </div>
          <div className="rounded-xl bg-surface p-3 text-sm">
            {m.accountNumber && <p className="font-mono font-semibold tracking-wide">{m.accountNumber}</p>}
            <p className="text-muted-foreground">a.n. {m.accountName}</p>
          </div>
          {m.instructions && <p className="text-xs text-muted-foreground">{m.instructions}</p>}
          <div className="mt-auto">
            <ActionDialog
              action={savePaymentMethodAction}
              hidden={{ id: m.id }}
              triggerLabel="Ubah"
              triggerIcon={<Pencil />}
              triggerSize="sm"
              title={`Ubah ${m.label}`}
              description="Perubahan langsung terlihat oleh pengguna yang akan membayar."
              submitLabel="Simpan perubahan"
              reason={{ label: "Alasan perubahan" }}
              wide>
              <MethodFields m={m} />
            </ActionDialog>
          </div>
        </article>
      ))}
    </div>
  );
}
