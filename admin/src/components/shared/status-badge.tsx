import { cn } from "@/lib/utils";

export type StatusTone = "brand" | "success" | "warning" | "danger" | "neutral";

const TONES: Record<StatusTone, string> = {
  brand: "bg-brand-soft text-brand-dark",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-foreground",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-muted text-muted-foreground",
};

// label status berwarna: hijau = beres/terverifikasi, kuning = menunggu, merah = ditolak/berisiko
export function StatusBadge({ label, tone = "neutral", className }: { label: string; tone?: StatusTone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        TONES[tone],
        className
      )}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
