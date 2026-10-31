import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";

import { PsychologistForm } from "./psychologist-form";

export const metadata: Metadata = { title: "Buat Akun Psikolog" };

export default function PsikologBaruPage() {
  return (
    <>
      <Link href="/pengguna" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-brand">
        <ArrowLeft className="size-4" /> Pengguna
      </Link>
      <PageHeader
        title="Buat akun psikolog mitra"
        description="Psikolog tidak bisa mendaftar sendiri. Isi data di bawah, lalu kirim kata sandi sementara ke psikolog lewat jalur resmi."
      />
      <PsychologistForm />
    </>
  );
}
