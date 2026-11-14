import { ChevronRight, FileCheck2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { listApplications } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { DECISION, param, RECOMMENDATION } from "@/lib/labels";
import type { DecisionStatus, TeacherApplication } from "@/types/verification";

export const metadata: Metadata = { title: "Verifikasi Teacher" };

const TABS: { label: string; value: DecisionStatus }[] = [
  { label: "Menunggu", value: "PENDING" },
  { label: "Perlu revisi", value: "REVISION" },
  { label: "Terverifikasi", value: "VERIFIED" },
  { label: "Ditolak", value: "REJECTED" },
];

const COLUMNS: Column<TeacherApplication>[] = [
  {
    key: "name",
    header: "Pendaftar",
    cell: (a) => (
      <div className="min-w-48">
        <p className="font-semibold">{a.fullName}</p>
        <p className="text-xs text-muted-foreground">{a.education}</p>
      </div>
    ),
  },
  {
    key: "spec",
    header: "Spesialisasi",
    cell: (a) => (
      <div className="flex max-w-64 flex-wrap gap-1">
        {a.specializations.slice(0, 2).map((s) => (
          <span key={s} className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-dark">
            {s}
          </span>
        ))}
        {a.specializations.length > 2 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">+{a.specializations.length - 2}</span>
        )}
      </div>
    ),
  },
  {
    key: "docs",
    header: "Dokumen",
    cell: (a) => {
      const done = a.documents.filter((d) => d.url).length;
      return (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-sm">
          <FileCheck2 className={done === a.documents.length ? "size-4 text-success" : "size-4 text-warning-foreground"} />
          {done}/{a.documents.length}
        </span>
      );
    },
  },
  {
    key: "psy",
    header: "Rekomendasi psikolog",
    cell: (a) =>
      a.psychologistReview ? (
        <StatusBadge {...RECOMMENDATION[a.psychologistReview.recommendation]} />
      ) : (
        <span className="text-xs text-muted-foreground">Belum diinterview</span>
      ),
  },
  { key: "status", header: "Status", cell: (a) => <StatusBadge {...DECISION[a.status]} /> },
  {
    key: "date",
    header: "Diajukan",
    className: "whitespace-nowrap text-muted-foreground",
    cell: (a) => formatDateTime(a.submittedAt),
  },
  {
    key: "go",
    header: "",
    cell: (a) => (
      <Link href={`/verifikasi/${a.id}`} className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand hover:underline">
        Tinjau <ChevronRight className="size-4" />
      </Link>
    ),
  },
];

export default function VerifikasiPage(props: PageProps<"/verifikasi">) {
  return (
    <>
      <PageHeader
        title="Verifikasi Teacher"
        description="Psikolog menilai kompetensi lewat interview, admin memeriksa dokumen dan memberi keputusan akhir."
      />
      <Suspense fallback={<TableSkeleton />}>
        <VerifikasiContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function VerifikasiContent({ searchParams }: Pick<PageProps<"/verifikasi">, "searchParams">) {
  await getCurrentAdmin();
  const status = (param(await searchParams, "status") || "PENDING") as DecisionStatus;
  const all = await listApplications();
  const rows = all.filter((a) => a.status === status);

  return (
    <>
      <FilterTabs
        basePath="/verifikasi"
        current={status}
        tabs={TABS.map((t) => ({ ...t, count: all.filter((a) => a.status === t.value).length }))}
      />
      <DataTable columns={COLUMNS} rows={rows} rowKey={(a) => a.id} empty="Tidak ada pengajuan di status ini." />
    </>
  );
}
