"use client";

import { AlertCircle, CheckCircle2, Copy, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { Field } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { createPsychologistAction } from "@/lib/actions/users";

// kategori keahlian untuk filter di halaman konsultasi aplikasi
const CATEGORIES = ["ADHD", "Autisme", "Speech Delay", "Sensori", "Perilaku", "Sosial", "Akademik"];

export function PsychologistForm() {
  const [state, action, pending] = useActionState(createPsychologistAction, undefined);
  const [copied, setCopied] = useState(false);

  if (state?.ok) {
    return (
      <div className="max-w-xl space-y-4 rounded-2xl border bg-white p-6">
        <p className="flex items-center gap-2 text-lg font-semibold text-success">
          <CheckCircle2 className="size-5" /> Akun psikolog dibuat
        </p>
        <p className="text-sm text-muted-foreground">
          Kirim kata sandi sementara ini ke <b className="text-foreground">{state.email}</b>. Psikolog wajib menggantinya saat login pertama.
          Kata sandi hanya tampil sekali.
        </p>
        <div className="flex items-center gap-2 rounded-xl bg-surface p-3">
          <code className="flex-1 font-mono text-base font-semibold">{state.tempPassword}</code>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={async () => {
              await navigator.clipboard.writeText(state.tempPassword);
              setCopied(true);
            }}>
            <Copy /> {copied ? "Tersalin" : "Salin"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Link href={`/pengguna/${state.userId}`} className="flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white">
            Lihat akun
          </Link>
          <Link href="/pengguna" className="flex h-10 items-center rounded-xl border px-4 text-sm font-semibold">
            Kembali ke daftar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="max-w-3xl space-y-6 rounded-2xl border bg-white p-6">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-brand-dark">Data akun</legend>
        <Field label="Nama lengkap & gelar" name="fullName" placeholder="Amanda Putri, M.Psi." required />
        <Field label="Email" name="email" type="email" placeholder="nama@klinik.id" required />
        <Field label="Nomor HP" name="phone" inputMode="tel" placeholder="0812xxxxxxxx" required />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-semibold text-brand-dark">Profil praktik</legend>
        <Field label="Jabatan" name="title" placeholder="Psikolog Anak & Sensori" required />
        <Field label="Tempat praktik" name="place" placeholder="Klinik Tumbuh Kembang Malang" />
        <Field label="Pengalaman (tahun)" name="experienceYears" type="number" min={0} defaultValue={1} />
        <Field label="Durasi sesi (menit)" name="durationMinutes" type="number" min={15} step={15} defaultValue={45} />
        <Field label="Tarif konsultasi (Rp)" name="basePrice" type="number" min={50000} step={1000} defaultValue={250000} required />
        <Field label="Diskon (%)" name="discountPercent" type="number" min={0} max={50} defaultValue={0} />
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium">Keahlian</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <label
                key={c}
                className="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand-dark">
                <input type="checkbox" name="categories" value={c} className="size-3.5 accent-brand" />
                {c}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {state?.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11 rounded-xl px-5 font-semibold">
        {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
        Buat akun
      </Button>
    </form>
  );
}
