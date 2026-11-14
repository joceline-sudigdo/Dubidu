import { Ban, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { BackLink } from "@/components/shared/back-link";
import { DataTable, type Column } from "@/components/shared/data-table";
import { CheckboxField, Field, SelectField } from "@/components/shared/form-fields";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { cancelRedemptionAction, saveMissionAction, saveRewardAction } from "@/lib/actions/content";
import { getRewardsData } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { param, REDEMPTION_STATUS } from "@/lib/labels";
import type { ContentRole, Mission, Redemption, Reward } from "@/types/content";

import { LevelEditor } from "./level-editor";

export const metadata: Metadata = { title: "Rewards & Voucher" };

const ROLE_OPTIONS = [
  { value: "parent", label: "Orang tua" },
  { value: "teacher", label: "Shadow teacher" },
];

function RewardFields({ r, role }: { r?: Reward; role: ContentRole }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nama hadiah" name="title" defaultValue={r?.title} required className="sm:col-span-2" />
      <Field label="Keterangan" name="subtitle" defaultValue={r?.subtitle} placeholder="Fore & Kopi Kenangan" className="sm:col-span-2" />
      <SelectField label="Untuk" name="role" defaultValue={r?.role ?? role} options={ROLE_OPTIONS} />
      <SelectField
        label="Kategori"
        name="category"
        defaultValue={r?.category ?? "Voucher"}
        options={["Voucher", "Cashback", "Kesehatan"].map((c) => ({ value: c, label: c }))}
      />
      <Field label="Harga (ikan)" name="cost" type="number" min={10} defaultValue={r?.cost ?? 300} required />
      <Field label="Stok" name="stock" type="number" min={0} defaultValue={r?.stock ?? ""} hint="Kosongkan untuk tanpa batas" />
      <Field label="Terbuka mulai level" name="minLevel" type="number" min={1} max={5} defaultValue={r?.minLevel ?? 1} />
      <Field label="Ikon (Feather)" name="icon" defaultValue={r?.icon ?? "gift"} hint="Nama ikon di aplikasi, misal coffee" />
      <CheckboxField label="Tampilkan di aplikasi" name="active" defaultChecked={r?.active ?? true} className="sm:col-span-2" />
    </div>
  );
}

function MissionFields({ m, role }: { m?: Mission; role: ContentRole }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Judul misi" name="title" defaultValue={m?.title} required className="sm:col-span-2" />
      <Field label="Keterangan" name="subtitle" defaultValue={m?.subtitle} className="sm:col-span-2" />
      <SelectField label="Untuk" name="role" defaultValue={m?.role ?? role} options={ROLE_OPTIONS} />
      <Field label="Hadiah (ikan)" name="reward" type="number" min={1} max={1000} defaultValue={m?.reward ?? 30} required />
      <Field label="Label tombol" name="actionLabel" defaultValue={m?.actionLabel ?? "Kerjakan"} />
      <CheckboxField label="Aktif" name="active" defaultChecked={m?.active ?? true} className="self-end pb-2" />
    </div>
  );
}

const rewardColumns = (role: ContentRole): Column<Reward>[] => [
  {
    key: "title",
    header: "Hadiah",
    cell: (r) => (
      <div className="min-w-48">
        <p className="font-semibold">{r.title}</p>
        <p className="text-xs text-muted-foreground">{r.subtitle}</p>
      </div>
    ),
  },
  { key: "cat", header: "Kategori", className: "text-sm", cell: (r) => r.category },
  { key: "cost", header: "Harga", className: "whitespace-nowrap font-semibold text-warning-foreground", cell: (r) => `${r.cost.toLocaleString("id-ID")} ikan` },
  { key: "level", header: "Level", className: "text-sm", cell: (r) => (r.minLevel ? `Lv ${r.minLevel}+` : "Semua") },
  { key: "stock", header: "Stok", className: "text-sm", cell: (r) => (r.stock === null ? "∞" : r.stock) },
  { key: "status", header: "Status", cell: (r) => <StatusBadge label={r.active ? "Aktif" : "Nonaktif"} tone={r.active ? "success" : "neutral"} /> },
  {
    key: "act",
    header: "",
    className: "text-right",
    cell: (r) => (
      <ActionDialog
        action={saveRewardAction}
        hidden={{ id: r.id }}
        triggerLabel="Ubah"
        triggerIcon={<Pencil />}
        triggerSize="sm"
        title={`Ubah ${r.title}`}
        submitLabel="Simpan"
        reason={{ label: "Alasan perubahan" }}
        wide>
        <RewardFields r={r} role={role} />
      </ActionDialog>
    ),
  },
];

const missionColumns = (role: ContentRole): Column<Mission>[] => [
  {
    key: "title",
    header: "Misi",
    cell: (m) => (
      <div className="min-w-48">
        <p className="font-semibold">{m.title}</p>
        <p className="text-xs text-muted-foreground">{m.subtitle}</p>
      </div>
    ),
  },
  { key: "reward", header: "Hadiah", className: "whitespace-nowrap font-semibold text-warning-foreground", cell: (m) => `+${m.reward} ikan` },
  { key: "btn", header: "Tombol", className: "text-sm", cell: (m) => m.actionLabel },
  { key: "status", header: "Status", cell: (m) => <StatusBadge label={m.active ? "Aktif" : "Nonaktif"} tone={m.active ? "success" : "neutral"} /> },
  {
    key: "act",
    header: "",
    className: "text-right",
    cell: (m) => (
      <ActionDialog
        action={saveMissionAction}
        hidden={{ id: m.id }}
        triggerLabel="Ubah"
        triggerIcon={<Pencil />}
        triggerSize="sm"
        title={`Ubah misi ${m.title}`}
        submitLabel="Simpan"
        reason={{ label: "Alasan perubahan" }}
        wide>
        <MissionFields m={m} role={role} />
      </ActionDialog>
    ),
  },
];

const REDEMPTION_COLUMNS: Column<Redemption>[] = [
  {
    key: "code",
    header: "Kode",
    cell: (r) => (
      <div>
        <p className="font-mono text-xs font-semibold">{r.code}</p>
        <p className="text-sm">{r.rewardTitle}</p>
      </div>
    ),
  },
  { key: "user", header: "Penukar", className: "text-sm", cell: (r) => r.userName },
  { key: "cost", header: "Ikan", className: "text-sm", cell: (r) => r.cost },
  { key: "date", header: "Ditukar", className: "whitespace-nowrap text-muted-foreground", cell: (r) => formatDateTime(r.redeemedAt) },
  { key: "exp", header: "Berlaku sampai", className: "whitespace-nowrap text-muted-foreground", cell: (r) => formatDateTime(r.expiresAt) },
  { key: "status", header: "Status", cell: (r) => <StatusBadge {...REDEMPTION_STATUS[r.status]} /> },
  {
    key: "act",
    header: "",
    className: "text-right",
    cell: (r) =>
      r.status === "ACTIVE" && (
        <ActionDialog
          action={cancelRedemptionAction}
          hidden={{ id: r.id }}
          triggerLabel="Batalkan"
          triggerIcon={<Ban />}
          triggerTone="danger"
          triggerSize="sm"
          title="Batalkan voucher?"
          description={`Voucher ${r.code} tidak bisa dipakai lagi. ${r.cost} ikan dikembalikan ke ${r.userName}.`}
          submitLabel="Batalkan voucher"
          submitTone="danger"
          reason={{ label: "Alasan", required: true, quick: ["Stok mitra habis", "Permintaan pengguna", "Penukaran ganda"] }}
        />
      ),
  },
];

export default function RewardsPage(props: PageProps<"/konten/rewards">) {
  return (
    <>
      <BackLink href="/konten" label="Konten" />
      <PageHeader title="Rewards & Voucher" description="Katalog hadiah ikan, misi harian, level, dan voucher yang sudah ditukar pengguna." />
      <Suspense fallback={<TableSkeleton />}>
        <RewardsContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function RewardsContent({ searchParams }: Pick<PageProps<"/konten/rewards">, "searchParams">) {
  await getCurrentAdmin();
  const sp = await searchParams;
  const tab = param(sp, "tab") || "hadiah";
  const role = (param(sp, "role") || "parent") as ContentRole;
  const { rewards, missions, levels, redemptions } = await getRewardsData();
  const withRole = tab === "hadiah" || tab === "misi";

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <FilterTabs
          basePath="/konten/rewards"
          param="tab"
          current={tab}
          keep={{ role }}
          tabs={[
            { label: "Hadiah", value: "hadiah", count: rewards.length },
            { label: "Misi harian", value: "misi", count: missions.length },
            { label: "Level", value: "level" },
            { label: "Voucher ditukar", value: "voucher", count: redemptions.length },
          ]}
        />
        {tab === "hadiah" && (
          <ActionDialog action={saveRewardAction} triggerLabel="Tambah hadiah" triggerIcon={<Plus />} triggerTone="primary" title="Tambah hadiah" submitLabel="Simpan" wide>
            <RewardFields role={role} />
          </ActionDialog>
        )}
        {tab === "misi" && (
          <ActionDialog action={saveMissionAction} triggerLabel="Tambah misi" triggerIcon={<Plus />} triggerTone="primary" title="Tambah misi" submitLabel="Simpan" wide>
            <MissionFields role={role} />
          </ActionDialog>
        )}
      </div>
      {withRole && (
        <FilterTabs
          basePath="/konten/rewards"
          param="role"
          current={role}
          keep={{ tab }}
          tabs={ROLE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
        />
      )}
      {tab === "hadiah" && <DataTable columns={rewardColumns(role)} rows={rewards.filter((r) => r.role === role)} rowKey={(r) => r.id} />}
      {tab === "misi" && <DataTable columns={missionColumns(role)} rows={missions.filter((m) => m.role === role)} rowKey={(m) => m.id} />}
      {tab === "level" && <LevelEditor levels={levels} />}
      {tab === "voucher" && <DataTable columns={REDEMPTION_COLUMNS} rows={redemptions} rowKey={(r) => r.id} empty="Belum ada voucher ditukar." />}
    </>
  );
}
