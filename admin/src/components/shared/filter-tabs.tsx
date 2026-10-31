import Link from "next/link";

import { cn } from "@/lib/utils";

export type FilterTab = { label: string; value: string; count?: number };

// tab filter berbasis URL (?param=value), bisa dibuka langsung & di-bookmark
export function FilterTabs({
  tabs,
  current,
  basePath,
  param = "status",
  keep = {},
}: {
  tabs: FilterTab[];
  current: string;
  basePath: string;
  param?: string;
  keep?: Record<string, string | undefined>;
}) {
  const href = (value: string) => {
    const sp = new URLSearchParams();
    Object.entries(keep).forEach(([k, v]) => v && sp.set(k, v));
    if (value) sp.set(param, value);
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = t.value === current;
        return (
          <Link
            key={t.value || "all"}
            href={href(t.value)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active ? "border-brand bg-brand text-white shadow-sm shadow-brand/30" : "bg-white hover:bg-brand-soft"
            )}>
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                )}>
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
