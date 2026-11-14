import { Suspense } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { NavList, SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Logo } from "@/components/shared/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentAdmin } from "@/lib/dal";

// sesi dibaca di dalam Suspense supaya kerangka halaman tetap tampil duluan
async function CurrentAdminMenu() {
  const admin = await getCurrentAdmin();
  return <UserMenu name={admin.fullName} email={admin.email} />;
}

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-72 shrink-0 flex-col border-r bg-white p-5 lg:flex">
        <Logo className="mb-8" />
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={<NavList pathname="" />}>
            <SidebarNav />
          </Suspense>
        </div>
        <p className="pt-4 text-[11px] text-muted-foreground">Data anak & isi chat tidak ditampilkan di panel ini.</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white/85 px-4 backdrop-blur md:px-8">
          <MobileNav />
          <Logo className="lg:hidden" />
          <div className="ml-auto">
            <Suspense fallback={<Skeleton className="h-10 w-44 rounded-full" />}>
              <CurrentAdminMenu />
            </Suspense>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">
            {/* tiap halaman punya batas Suspense sendiri lewat loading.tsx */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
