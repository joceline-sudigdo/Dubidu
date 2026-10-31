import { ChevronRight, Landmark } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { listPayments } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { param, PAYMENT_PURPOSE, PAYMENT_STATUS } from "@/lib/labels";
import type { Payment, PaymentStatus } from "@/types/finance";

export const metadata: Metadata = { title: "Bukti Transfer" };

const TABS: { label: string; value: PaymentStatus }[] = [
  { label: "Perlu dicek", value: "VERIFYING" },
  { label: "Menunggu transfer", value: "PENDING" },
  { label: "Lunas", value: "PAID" },
  { label: "Kedaluwarsa", value: "EXPIRED" },
];

const COLUMNS: Column<Payment>[] = [
  {
    key: "invoice",
    header: "Invoice",
    cell: (p) => (
      <div className="min-w-40">
        <p className="font-mono text-xs font-semibold">{p.invoiceNo}</p>
        <p className="text-sm">{p.userName}</p>
      </div>
    ),
  },
  {
    key: "item",
    header: "Untuk",
    cell: (p) => (
      <div className="min-w-48">
        <p className="text-xs font-semibold text-brand">{PAYMENT_PURPOSE[p.purpose]}</p>
        <p className="text-sm">{p.description}</p>
      </div>
    ),
  },
  {
    key: "amount",
    header: "Nominal transfer",
    className: "whitespace-nowrap",
    cell: (p) => (
      <div>
        <p className="font-semibold">{formatRupiah(p.amountDue ?? p.amount)}</p>
        {p.uniqueCode && <p className="text-xs text-muted-foreground">kode unik {p.uniqueCode}</p>}
      </div>
    ),
  },
  { key: "method", header: "Tujuan", className: "whitespace-nowrap text-sm", cell: (p) => p.manualMethodLabel ?? "—" },
  {
    key: "date",
    header: "Bukti diunggah",
    className: "whitespace-nowrap text-muted-foreground",
    cell: (p) => (p.proofSubmittedAt ? formatDateTime(p.proofSubmittedAt) : "—"),
  },
  { key: "status", header: "Status", cell: (p) => <StatusBadge {...PAYMENT_STATUS[p.status]} /> },
  {
    key: "go",
    header: "",
    cell: (p) => (
      <Link href={`/pembayaran/${p.id}`} className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand hover:underline">
        {p.status === "VERIFYING" ? "Periksa" : "Detail"} <ChevronRight className="size-4" />
      </Link>
    ),
  },
];

export default function PembayaranPage(props: PageProps<"/pembayaran">) {
  return (
    <>
      <PageHeader
        title="Bukti Transfer"
        description="Cocokkan bukti transfer manual dengan mutasi rekening DUBIDU, lalu konfirmasi atau tolak."
        actions={
          <Link
            href="/pembayaran/tujuan"
            className="flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-brand-soft">
            <Landmark className="size-4" /> Tujuan transfer
          </Link>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <PembayaranContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function PembayaranContent({ searchParams }: Pick<PageProps<"/pembayaran">, "searchParams">) {
  await getCurrentAdmin();
  const status = (param(await searchParams, "status") || "VERIFYING") as PaymentStatus;
  const all = await listPayments();

  return (
    <>
      <FilterTabs
        basePath="/pembayaran"
        current={status}
        tabs={TABS.map((t) => ({ ...t, count: all.filter((p) => p.status === t.value).length }))}
      />
      <DataTable
        columns={COLUMNS}
        rows={all.filter((p) => p.status === status)}
        rowKey={(p) => p.id}
        empty="Tidak ada pembayaran di status ini."
      />
    </>
  );
}
