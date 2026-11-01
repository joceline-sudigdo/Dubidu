import {
  ArrowRight,
  Banknote,
  Crown,
  Flag,
  GraduationCap,
  HeartHandshake,
  ReceiptText,
  ShieldCheck,
  Stethoscope,
  UserX,
  Users,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuditLogTable } from "@/components/audit/audit-log-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardStats, listAuditLogs } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Ringkasan" };

export default function RingkasanPage() {
  return (
    <>
      <PageHeader title="Ringkasan" description="Antrean yang perlu ditangani, kondisi pengguna, dan pendapatan. Semua angka agregat dari akun sungguhan (akun demo tidak dihitung), tanpa data anak." />
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">Aktivitas admin terbaru</h2>
        <Link href="/audit-log" className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
          Lihat semua <ArrowRight className="size-4" />
        </Link>
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <RecentActivity />
      </Suspense>
    </>
  );
}

async function Stats() {
  await getCurrentAdmin();
  const s = await getDashboardStats();
  const queueTotal = s.queues.verification + s.queues.payment + s.queues.payout + s.queues.report;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">
          Perlu ditangani <span className="text-sm font-normal text-muted-foreground">({queueTotal} antrean)</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Verifikasi teacher" value={String(s.queues.verification)} hint="menunggu keputusan" icon={ShieldCheck} tone="warning" href="/verifikasi" />
          <StatCard label="Bukti transfer" value={String(s.queues.payment)} hint="perlu dicek" icon={ReceiptText} tone="warning" href="/pembayaran" />
          <StatCard label="Pencairan dana" value={String(s.queues.payout)} hint="menunggu transfer" icon={Banknote} tone="warning" href="/pencairan" />
          <StatCard label="Laporan pengguna" value={String(s.queues.report)} hint="belum ditindak" icon={Flag} tone="danger" href="/moderasi" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">Pengguna</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Orang tua" value={String(s.users.parent)} icon={Users} href="/pengguna?role=PARENT" />
          <StatCard label="Shadow teacher" value={String(s.users.teacher)} icon={GraduationCap} href="/pengguna?role=TEACHER" />
          <StatCard label="Psikolog mitra" value={String(s.users.psychologist)} icon={Stethoscope} href="/pengguna?role=PSYCHOLOGIST" />
          <StatCard label="Akun nonaktif" value={String(s.users.suspended)} icon={UserX} tone="danger" href="/pengguna?status=suspended" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">Transaksi</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Pembayaran lunas" value={formatRupiah(s.revenue.paidTotal)} hint={`${s.revenue.paidCount} transaksi`} icon={Wallet} tone="success" />
          <StatCard label="Pendapatan platform" value={formatRupiah(s.revenue.platformFee)} hint="dari biaya kontrak" icon={Banknote} tone="success" />
          <StatCard label="Langganan Plus" value={formatRupiah(s.revenue.subscription)} hint={`${s.users.plus} pengguna Plus aktif`} icon={Crown} tone="warning" />
          <StatCard label="Kontrak aktif" value={String(s.activeEngagements)} hint="pendampingan berjalan" icon={HeartHandshake} />
        </div>
      </section>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, j) => (
              <Skeleton key={j} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

async function RecentActivity() {
  await getCurrentAdmin();
  const logs = await listAuditLogs({ limit: 6 });
  return <AuditLogTable logs={logs} compact />;
}
