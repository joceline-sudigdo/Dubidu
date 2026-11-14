"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/shared/logo";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { SidebarNav } from "./sidebar-nav";

// menu samping untuk tablet/layar kecil (sidebar desktop disembunyikan di bawah lg)
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Buka menu"
        className="flex size-10 items-center justify-center rounded-xl border bg-white text-foreground hover:bg-brand-soft lg:hidden">
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 p-5">
        <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
        <Logo className="mb-8" />
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
