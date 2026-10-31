import { ChevronRight, Crown, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { SearchForm } from "@/components/shared/search-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { listUsers } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { DECISION, param, ROLE } from "@/lib/labels";
import type { AppUser } from "@/types/user";

export const metadata: Metadata = { title: "Pengguna" };

const ROLE_TABS = [
  { label: "Semua", value: "" },
  { label: "Orang Tua", value: "PARENT" },
  { label: "Shadow Teacher", value: "TEACHER" },
  { label: "Psikolog", value: "PSYCHOLOGIST" },
];

const COLUMNS: Column<AppUser>[] = [
  {
    key: "name",
    header: "Nama",
    cell: (u) => (
      <div className="min-w-48">
        <p className="flex items-center gap-1.5 font-semibold">
          {u.fullName}
          {u.plusActive && <Crown className="size-3.5 text-warning-foreground" aria-label="Pengguna Plus" />}
        </p>
        <p className="text-xs text-muted-foreground">{u.email ?? u.phone}</p>
      </div>
    ),
  },
  { key: "role", header: "Peran", className: "whitespace-nowrap text-sm", cell: (u) => ROLE[u.role] },
  {
    key: "verif",
    header: "Verifikasi",
    cell: (u) => {
      if (u.role !== "TEACHER" || !u.teacher) return <span className="text-xs text-muted-foreground">—</span>;
      const s = u.teacher.verificationStatus;
      return <StatusBadge {...(s === "VERIFIED" ? DECISION.VERIFIED : s === "REJECTED" ? DECISION.REJECTED : DECISION.PENDING)} />;
    },
  },
  {
    key: "status",
    header: "Status akun",
    cell: (u) => <StatusBadge label={u.isActive ? "Aktif" : "Nonaktif"} tone={u.isActive ? "success" : "danger"} />,
  },
  { key: "joined", header: "Bergabung", className: "whitespace-nowrap text-muted-foreground", cell: (u) => formatDateTime(u.createdAt) },
  {
    key: "go",
    header: "",
    cell: (u) => (
      <Link href={`/pengguna/${u.id}`} className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand hover:underline">
        Detail <ChevronRight className="size-4" />
      </Link>
    ),
  },
];

export default function PenggunaPage(props: PageProps<"/pengguna">) {
  return (
    <>
      <PageHeader
        title="Pengguna"
        description="Kelola status akun orang tua, shadow teacher, dan psikolog. Data anak dan isi chat tidak ditampilkan."
        actions={
          <Link
            href="/pengguna/psikolog-baru"
            className="flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
            <UserPlus className="size-4" /> Buat akun psikolog
          </Link>
        }
      />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <PenggunaContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function PenggunaContent({ searchParams }: Pick<PageProps<"/pengguna">, "searchParams">) {
  await getCurrentAdmin();
  const sp = await searchParams;
  const role = param(sp, "role") as AppUser["role"] | "";
  const q = param(sp, "q");
  const status = param(sp, "status") as "active" | "suspended" | "";
  const all = await listUsers({ q, status: status || undefined });
  const rows = all.filter((u) => !role || u.role === role);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <FilterTabs
          basePath="/pengguna"
          param="role"
          current={role}
          keep={{ q, status }}
          tabs={ROLE_TABS.map((t) => ({ ...t, count: all.filter((u) => !t.value || u.role === t.value).length }))}
        />
        <SearchForm placeholder="Cari nama, email, atau HP" defaultValue={q} keep={{ role, status }} />
      </div>
      <FilterTabs
        basePath="/pengguna"
        current={status}
        keep={{ q, role }}
        tabs={[
          { label: "Semua status", value: "" },
          { label: "Aktif", value: "active" },
          { label: "Nonaktif", value: "suspended" },
        ]}
      />
      <DataTable columns={COLUMNS} rows={rows} rowKey={(u) => u.id} empty="Tidak ada pengguna yang cocok." />
    </>
  );
}
