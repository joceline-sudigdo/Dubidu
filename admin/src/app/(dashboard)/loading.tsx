import { Skeleton } from "@/components/ui/skeleton";

// kerangka halaman selagi data (dan sesi) dibaca
export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
