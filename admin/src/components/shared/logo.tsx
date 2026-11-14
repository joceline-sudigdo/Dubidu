import Image from "next/image";

import { cn } from "@/lib/utils";

// logo DUBIDU: beruang + tulisan Fredoka, sama seperti splash aplikasi
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image src="/brand/bear.png" alt="" width={40} height={36} className="h-9 w-auto" priority />
      <span className="flex flex-col leading-none">
        <span className={cn("font-logo text-2xl font-bold tracking-wide", light ? "text-white" : "text-brand-dark")}>
          DUBIDU
        </span>
        <span className={cn("text-[11px] font-medium", light ? "text-white/80" : "text-muted-foreground")}>
          Panel Admin
        </span>
      </span>
    </span>
  );
}
