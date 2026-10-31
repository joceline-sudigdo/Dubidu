import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Logo } from "@/components/shared/logo";
import { getSessionAdmin } from "@/lib/dal";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

// admin yang sesinya masih valid langsung ke dashboard
async function RedirectIfLoggedIn() {
  if (await getSessionAdmin()) redirect("/");
  return null;
}

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>

      {/* panel brand (disembunyikan di layar kecil) */}
      <section className="relative hidden overflow-hidden bg-linear-to-br from-brand to-brand-dark p-12 text-white lg:flex lg:flex-col">
        <Logo light />
        <div className="relative z-10 mt-auto max-w-md space-y-4">
          <h1 className="text-4xl font-bold leading-tight">Menjaga setiap pendampingan tetap aman & terpercaya.</h1>
          <p className="text-white/80">
            Verifikasi shadow teacher, konfirmasi pembayaran, dan kelola konten aplikasi dari satu tempat.
          </p>
        </div>
        <Image
          src="/brand/doobie.png"
          alt="Doobie, maskot DUBIDU"
          width={420}
          height={280}
          className="pointer-events-none absolute left-8 top-[18%] w-[340px] opacity-95"
        />
        <div className="absolute -bottom-24 -left-24 size-80 rounded-full bg-white/10" />
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <Logo className="lg:hidden" />
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-brand-dark">Selamat datang kembali</h2>
            <p className="text-sm text-muted-foreground">Masuk dengan akun admin DUBIDU kamu.</p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Akun admin hanya dibuat oleh tim teknis. Lupa kata sandi? Hubungi tim teknis untuk mengatur ulang.
          </p>
        </div>
      </section>
    </main>
  );
}
