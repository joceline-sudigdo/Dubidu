import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import type { StatusTone } from "./status-badge";

const ICON_TONES: Record<StatusTone, string> = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-foreground",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-muted text-muted-foreground",
};

// kartu angka ringkas di dashboard; href opsional untuk langsung ke antreannya
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: StatusTone;
  href?: string;
}) {
  const body = (
    <div
      className={cn(
        "flex h-full items-start gap-4 rounded-2xl border bg-white p-5 shadow-sm shadow-brand-dark/5",
        href && "transition hover:-translate-y-0.5 hover:shadow-md"
      )}>
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", ICON_TONES[tone])}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
