"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { NAV_GROUPS } from "./nav-items";

// daftar menu samping; dipakai di sidebar desktop dan sheet tablet
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return <NavList pathname={usePathname()} onNavigate={onNavigate} />;
}

// versi tanpa hook: dipakai sebagai fallback Suspense saat prerender (belum ada menu aktif)
export function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="space-y-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </p>
          {group.items.map(({ label, href, icon: Icon, ready }) => {
            const active = isActive(href);
            const className = cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand text-white shadow-sm shadow-brand/30"
                : ready
                  ? "text-foreground hover:bg-brand-soft hover:text-brand-dark"
                  : "cursor-not-allowed text-muted-foreground/70"
            );
            const content = (
              <>
                <Icon className="size-4.5 shrink-0" />
                <span className="flex-1">{label}</span>
                {!ready && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Segera
                  </span>
                )}
              </>
            );
            return ready ? (
              <Link key={href} href={href} onClick={onNavigate} className={className} aria-current={active ? "page" : undefined}>
                {content}
              </Link>
            ) : (
              <span key={href} className={className} aria-disabled>
                {content}
              </span>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
