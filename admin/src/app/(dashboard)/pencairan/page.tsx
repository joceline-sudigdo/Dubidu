import { AlertTriangle, Send, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Notice } from "@/components/shared/detail-card";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { Field } from "@/components/shared/form-fields";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { rejectPayoutAction, transferPayoutAction } from "@/lib/actions/payouts";
import { listPayouts } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { param, PAYOUT_STATUS, ROLE } from "@/lib/labels";
import type { Payout, PayoutStatus } from "@/types/finance";

export const metadata: Metadata = { title: "Pencairan Dana" };

const TABS: { label: string; value: PayoutStatus }[] = [
  { label: "Menunggu", value: "PENDING" },
  { label: "Ditransfer", value: "TRANSFERRED" },
  { label: "Ditolak", value: "REJECTED" },
];

function PayoutActions({ p }: { p: Payout }) {
  const over = p.amount > p.availableBalance;
  return (
    <div className="flex justify-end gap-2">
      <ActionDialog
        action={rejectPayoutAction}
        hidden={{ id: p.id }}
        triggerLabel="Tolak"
        triggerIcon={<XCircle />}
        triggerSize="sm"
        title="Tolak pencairan?"
        description={`Saldo ${formatRupiah(p.amount)} dikembalikan ke ${p.userName}.`}
        submitLabel="Tolak pencairan"
        submitTone="danger"
        reason={{ label: "Alasan", required: true, quick: ["Nominal melebihi saldo", "Data rekening tidak sesuai nama akun", "Masih ada sengketa kontrak"] }}
      />
      <ActionDialog
        action={transferPayoutAction}
        hidden={{ id: p.id }}
        triggerLabel="Tandai ditransfer"
        triggerIcon={<Send />}
        triggerTone="success"
        triggerSize="sm"
        title="Tandai sudah ditransfer"
        description={`Transfer ${formatRupiah(p.amount - p.fee)} ke ${p.bankName} ${p.accountNumberMasked} a.n. ${p.accountName}, lalu catat nomor referensinya.`}
        submitLabel="Simpan"
        submitTone="success"
        reason={{ label: "Catatan" }}>
        {over && <Notice tone="danger">Nominal melebihi saldo pengguna saat diajukan. Sebaiknya ditolak.</Notice>}
        <Field label="Nomor referensi transfer" name="transferRef" placeholder="Misal: TRF-BCA-88213" required minLength={4} />
      </ActionDialog>
    </div>
  );
}

const COLUMNS: Column<Payout>[] = [
  {
    key: "user",
    header: "Pengaju",
    cell: (p) => (
      <div className="min-w-44">
        <p className="font-semibold">{p.userName}</p>
        <p className="text-xs text-muted-foreground">{ROLE[p.role]}</p>
      </div>
    ),
  },
  {
    key: "amount",
    header: "Nominal",
    className: "whitespace-nowrap",
    cell: (p) => (
      <div>
        <p className="font-semibold">{formatRupiah(p.amount)}</p>
        <p className="text-xs text-muted-foreground">diterima {formatRupiah(p.amount - p.fee)}</p>
        {p.amount > p.availableBalance && (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-danger">
            <AlertTriangle className="size-3.5" /> Saldo hanya {formatRupiah(p.availableBalance)}
          </p>
        )}
      </div>
    ),
  },
  {
    key: "bank",
    header: "Rekening tujuan",
    cell: (p) => (
      <div className="whitespace-nowrap text-sm">
        <p className="font-medium">
          {p.bankName} {p.accountNumberMasked}
        </p>
        <p className="text-xs text-muted-foreground">a.n. {p.accountName}</p>
      </div>
    ),
  },
  { key: "date", header: "Diajukan", className: "whitespace-nowrap text-muted-foreground", cell: (p) => formatDateTime(p.requestedAt) },
  {
    key: "status",
    header: "Status",
    cell: (p) => (
      <div className="space-y-1">
        <StatusBadge {...PAYOUT_STATUS[p.status]} />
        {p.transferRef && <p className="font-mono text-xs text-muted-foreground">{p.transferRef}</p>}
        {p.rejectReason && <p className="max-w-48 text-xs text-muted-foreground">{p.rejectReason}</p>}
      </div>
    ),
  },
  { key: "act", header: "", className: "text-right", cell: (p) => (p.status === "PENDING" ? <PayoutActions p={p} /> : null) },
];

export default function PencairanPage(props: PageProps<"/pencairan">) {
  return (
    <>
      <PageHeader
        title="Pencairan Dana"
        description="Pengajuan pencairan pendapatan shadow teacher dan psikolog. Transfer manual ke rekening mereka, lalu catat nomor referensinya."
      />
      <Suspense fallback={<TableSkeleton />}>
        <PencairanContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function PencairanContent({ searchParams }: Pick<PageProps<"/pencairan">, "searchParams">) {
  await getCurrentAdmin();
  const status = (param(await searchParams, "status") || "PENDING") as PayoutStatus;
  const all = await listPayouts();
  const pendingTotal = all.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount - p.fee, 0);

  return (
    <>
      <FilterTabs
        basePath="/pencairan"
        current={status}
        tabs={TABS.map((t) => ({ ...t, count: all.filter((p) => p.status === t.value).length }))}
      />
      {status === "PENDING" && pendingTotal > 0 && (
        <div className="mb-4">
          <Notice>
            Total yang perlu ditransfer: <b>{formatRupiah(pendingTotal)}</b> (setelah biaya transfer).
          </Notice>
        </div>
      )}
      <DataTable columns={COLUMNS} rows={all.filter((p) => p.status === status)} rowKey={(p) => p.id} empty="Tidak ada pengajuan di status ini." />
    </>
  );
}
