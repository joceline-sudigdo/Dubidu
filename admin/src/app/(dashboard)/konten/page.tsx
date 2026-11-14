import { Bot, ChevronRight, Crown, FileText, Gift, HelpCircle, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Konten" };

const SECTIONS: { href: string; title: string; description: string; icon: LucideIcon; tone: string }[] = [
  { href: "/konten/legal", title: "Legal", description: "Syarat & Ketentuan dan Kebijakan Privasi, lengkap dengan versi.", icon: FileText, tone: "bg-brand-soft text-brand" },
  { href: "/konten/faq", title: "FAQ Bantuan", description: "Pertanyaan yang tampil di Pusat Bantuan aplikasi.", icon: HelpCircle, tone: "bg-success-soft text-success" },
  { href: "/konten/doobie", title: "Template Doobie", description: "Topik dan jawaban Doobie untuk orang tua dan teacher.", icon: Bot, tone: "bg-brand-soft text-brand-dark" },
  { href: "/konten/rewards", title: "Rewards & Voucher", description: "Katalog hadiah, misi harian, level ikan, dan voucher yang ditukar.", icon: Gift, tone: "bg-warning-soft text-warning-foreground" },
  { href: "/konten/plus", title: "Paket Plus & Promo", description: "Harga Dubidu Plus, kode promo, dan biaya platform.", icon: Crown, tone: "bg-warning-soft text-warning-foreground" },
];

export default function KontenPage() {
  return (
    <>
      <PageHeader title="Konten" description="Konten dan konfigurasi yang tampil di aplikasi. Setiap perubahan tercatat di audit log." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map(({ href, title, description, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm shadow-brand-dark/5 transition hover:-translate-y-0.5 hover:shadow-md">
            <span className={`flex size-11 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="size-5" />
            </span>
            <div className="space-y-1">
              <p className="flex items-center gap-1 font-semibold text-brand-dark">
                {title} <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
              </p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
