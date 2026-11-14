import { Skeleton } from "@/components/ui/skeleton";

// placeholder tabel selagi data dimuat
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-2xl border bg-white p-4">
      <Skeleton className="h-8 w-full rounded-lg" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}
