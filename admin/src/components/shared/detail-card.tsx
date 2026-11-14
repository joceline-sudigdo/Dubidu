import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// kartu berjudul untuk halaman detail
export function DetailCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-white p-5 shadow-sm shadow-brand-dark/5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-brand-dark">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// baris label : nilai
export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b py-2.5 last:border-0 sm:flex-row sm:items-start sm:gap-4">
      <dt className="w-44 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm font-medium">{children}</dd>
    </div>
  );
}

// pemberitahuan kecil (info/peringatan)
export function Notice({ tone = "brand", children }: { tone?: "brand" | "warning" | "danger"; children: ReactNode }) {
  const tones = {
    brand: "bg-brand-soft text-brand-dark",
    warning: "bg-warning-soft text-warning-foreground",
    danger: "bg-danger-soft text-danger",
  };
  return <div className={cn("rounded-xl px-4 py-3 text-sm", tones[tone])}>{children}</div>;
}
