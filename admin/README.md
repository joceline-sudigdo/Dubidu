# Admin DUBIDU

Panel admin (satu role: super admin) untuk aplikasi DUBIDU. Next.js App Router + TypeScript + Tailwind + shadcn/ui.

## Menjalankan

```bash
cp .env.example .env.local   # lalu isi SESSION_SECRET
npm install
npm run dev
```

Buka http://localhost:3000.

### Login

Semua data diambil dari backend DUBIDU (`BACKEND_API_URL`, default `https://dubidu-api.vercel.app`).
Login memakai akun **ADMIN** di backend, dibuat dengan:

```bash
cd ../backend
npm run admin:create -- <email> <password> "Nama"
```

Untuk mencoba dengan backend lokal: jalankan `npm run dev` di folder `backend`, lalu isi
`BACKEND_API_URL=http://localhost:4000` di `.env.local`.

## Struktur

```
src/
  app/
    (auth)/login/          halaman masuk + form (useActionState)
    (dashboard)/           layout sidebar + header, halaman yang butuh login
      page.tsx             Ringkasan (statistik agregat + aktivitas terbaru)
      verifikasi/          Verifikasi teacher (rekomendasi psikolog → keputusan admin)
      pembayaran/          Bukti transfer manual + tujuan transfer
      pencairan/           Pencairan dana teacher & psikolog
      pengguna/            Status akun + buat akun psikolog
      moderasi/            Laporan, postingan & komentar, ulasan
      konten/              Legal, FAQ, template Doobie, rewards, paket Plus & promo
      audit-log/           Audit Log
  proxy.ts                 cek cepat cookie sesi (Next 16: pengganti middleware)
  components/
    ui/                    komponen shadcn
    shared/                PageHeader, StatusBadge, StatCard, DataTable, Logo
    layout/                sidebar, menu tablet, menu admin
    audit/                 tabel audit log
  lib/
    api.ts                 lapisan data: fetch ke BACKEND_API_URL dengan token admin dari sesi
    actions/               Server Action (login, logout, dst.)
    dal.ts                 getCurrentAdmin(): validasi sesi di setiap halaman/aksi
    session.ts             cookie httpOnly bertanda tangan HMAC (berisi token backend)
    env.ts                 env server-only
  types/                   tipe data (mengikuti skema backend)
```

## Aturan

- Data anak, laporan perkembangan, hasil asesmen, dan isi chat **tidak** ditampilkan.
- Setiap aksi yang mengubah data wajib memanggil `createAuditLog()` (siapa, aksi, target, alasan, waktu).
- Fetch ke backend hanya dari server (Server Component / Server Action), tidak dari komponen `"use client"`.
