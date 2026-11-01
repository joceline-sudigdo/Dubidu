# DUBIDU

Aplikasi yang mempertemukan orang tua anak berkebutuhan khusus (ABK) dengan shadow teacher lewat smart matching, dilengkapi pemantauan perkembangan anak, konsultasi psikolog, komunitas, kontrak pendampingan, dan transaksi.

| Folder     | Isi                                                             | Teknologi                            |
| ---------- | --------------------------------------------------------------- | ------------------------------------ |
| `/` (root) | Aplikasi mobile orang tua, shadow teacher, psikolog             | Expo (React Native) + Expo Router    |
| `admin/`   | Web admin (verifikasi, pembayaran, pencairan, moderasi, konten) | Next.js                              |
| `backend/` | API + database                                                  | Node.js, Express, Prisma, PostgreSQL |

Akun demo (dari seed backend, password `dubidu123`): `devi@dubidu.id` (orang tua), `pras@dubidu.id` (teacher), `amanda@dubidu.id` (psikolog). Admin: `admin@dubidu.id` / `admin12345`.

---

## Backend

**Stack:** Node.js 20+ · Express 5 · TypeScript · Prisma 7 · PostgreSQL · Socket.IO

```
backend/
├── prisma/
│   ├── schema.prisma      ← struktur database (sumber kebenaran)
│   ├── migrations/        ← file SQL hasil `db:migrate`
│   └── seed.ts            ← master data + akun demo
├── src/
│   ├── index.ts           ← server HTTP + Socket.IO
│   ├── app.ts             ← daftar semua route
│   ├── config.ts, db.ts
│   ├── lib/               ← auth, matching + AI matching, pembayaran (transfer manual / Midtrans), email, video call, push, upload
│   └── routes/            ← satu file per fitur
├── tests/flow.test.ts     ← uji alur lengkap (29 skenario)
└── docs/
    ├── DATABASE.md        ← ERD & penjelasan tabel
    ├── API.md             ← daftar endpoint + pemetaan data dummy frontend
    └── frontend-api-client.ts ← contoh kode untuk frontend Expo
```

### Menjalankan

```bash
cd backend
npm install
cp .env.example .env          # isi DATABASE_URL & JWT_SECRET
npm run db:migrate            # buat tabel
npm run db:seed               # isi master data + akun demo
npm run dev                   # http://localhost:4000/api/health
npm test                      # uji 29 alur utama
```

### Script

| Perintah                                            | Fungsi                                  |
| --------------------------------------------------- | --------------------------------------- |
| `npm run dev`                                       | server mode pengembangan (auto-restart) |
| `npm run build` / `npm start`                       | build & jalankan versi produksi         |
| `npm run db:migrate`                                | buat/terapkan migrasi baru (lokal)      |
| `npm run db:deploy`                                 | terapkan migrasi di produksi            |
| `npm run db:seed`                                   | isi data awal                           |
| `npm run db:studio`                                 | lihat/edit isi database lewat browser   |
| `npm run admin:create -- <email> <password> "Nama"` | buat / reset akun admin                 |
| `npm test`                                          | jalankan uji API                        |

Lihat [backend/docs/API.md](backend/docs/API.md) untuk daftar endpoint dan [backend/docs/DATABASE.md](backend/docs/DATABASE.md) untuk rancangan database.

### Deploy ke Vercel (gratis, tanpa kartu)

File khusus: `index.js` (titik masuk serverless), `vercel.json` (install + build + migrasi), `.vercelignore`, `public/`.

```bash
cd backend
npx vercel@latest login
npx vercel@latest link        # sekali, buat project "dubidu-api"
npx vercel@latest --prod      # setiap ada perubahan
```

Environment Variables diisi di vercel.com → project → Settings → Environment Variables (lihat `backend/.env.example`). Di Vercel chat tidak realtime (pakai `?after=` untuk cek pesan baru) dan upload maks ±4 MB (wajib Cloudinary).

---

## Aplikasi mobile

**Stack:** Expo SDK 58 · React Native 0.88 · TypeScript · Expo Router (typed routes) · Reanimated 4

```
/
├── app.json               ← nama aplikasi, scheme, package, plugin, EAS projectId
├── eas.json               ← profil build EAS + alamat backend per profil
├── assets/images/         ← maskot Doobie, ilustrasi splash/onboarding, ikon navbar
└── src/
    ├── app/               ← layar (file-based routing)
    │   ├── (auth)/        ← login, daftar orang tua & shadow teacher, lupa sandi
    │   ├── (tabs)/        ← tab orang tua: Beranda, Chat, Riwayat, Jadwal, Komunitas
    │   ├── teacher/       ← tab & layar shadow teacher
    │   └── psikolog/      ← tab & layar psikolog
    ├── components/        ← komponen UI (parent/, shared/, ui/, navigation/)
    ├── constants/theme.ts ← warna, font, radius
    ├── data/              ← bentuk data tiap layar (diisi dari server saat login)
    └── lib/
        ├── api.ts         ← koneksi ke backend + token login
        ├── auth.ts        ← login, daftar, lupa sandi, logout
        ├── sync.ts        ← memuat data akun dari server ke src/data
        ├── push.ts        ← push notification
        └── *-store.ts     ← state per fitur (chat, matching, komunitas, pembayaran, dst.)
```

### Menjalankan

```bash
cp .env.example .env      # EXPO_PUBLIC_API_URL = alamat backend
npm install
npx expo start
```

- Default backend: `https://dubidu-api.vercel.app`. Untuk backend lokal dari HP fisik pakai IP laptop, misalnya `http://192.168.1.10:4000`.
- Tombol **Coba dengan Akun Demo** di layar login memakai akun demo di atas.
- Push notification, voice note, dan video call hanya bisa dicoba di HP sungguhan dari build EAS (bukan Expo Go).

### Script

| Perintah                          | Fungsi                                              |
| --------------------------------- | --------------------------------------------------- |
| `npx expo start`                  | jalankan Metro, buka di Expo Go / development build |
| `npm run android` / `npm run ios` | buka langsung di emulator                           |
| `npm run lint`                    | cek kode dengan ESLint                              |
| `npx tsc --noEmit`                | cek tipe TypeScript                                 |
| `npx expo install <paket>`        | tambah paket dengan versi yang cocok dengan SDK     |
| `npx expo-doctor`                 | cek konfigurasi & versi paket                       |

### Build APK

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

Profil build ada di `eas.json`: `development` (development build), `preview` (APK untuk dibagikan), `production`. Alamat backend sudah diisi untuk tiap profil, dan `projectId` EAS sudah ada di `app.json`.

### Fitur

| Peran          | Fitur utama                                                                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orang tua      | registrasi profil kebutuhan anak, smart matching shadow teacher (bandingkan, skip, hubungkan), kontrak & pembayaran (QRIS / transfer), report card & growth timeline, laporan observasi psikolog, konsultasi psikolog, tambah anak (Plus) |
| Shadow teacher | pendaftaran & verifikasi, cari anak, tawaran jadwal di chat, laporan harian & akhir, pencairan pendapatan                                                                                                                                 |
| Psikolog       | jadwal & sesi konsultasi (video/voice/onsite), kirim hasil observasi, rekomendasi verifikasi shadow teacher, pencairan pendapatan                                                                                                         |
| Semua          | chat (gambar & jadwal), komunitas (posting, komentar, simpan), Doobie (asisten topik + voice note), Doobie Rewards (ikan, misi, voucher), Dubidu Plus, notifikasi, unduh PDF                                                              |

---

## Web admin

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI)

Satu role saja: super admin. Akun admin dibuat lewat backend (`npm run admin:create`), tanpa halaman registrasi.

```
admin/src/
├── app/
│   ├── (auth)/login/      ← halaman masuk
│   └── (dashboard)/       ← layout sidebar + header, halaman yang butuh login
│       ├── page.tsx       ← Ringkasan (statistik agregat + aktivitas terbaru)
│       ├── verifikasi/    ← verifikasi teacher (rekomendasi psikolog → keputusan admin)
│       ├── pembayaran/    ← bukti transfer manual + tujuan transfer
│       ├── pencairan/     ← pencairan dana teacher & psikolog
│       ├── pengguna/      ← status akun + buat akun psikolog
│       ├── moderasi/      ← laporan, postingan & komentar, ulasan
│       ├── konten/        ← legal, FAQ, template Doobie, rewards, paket Plus & promo
│       └── audit-log/     ← jejak semua aksi admin
├── proxy.ts               ← cek cepat cookie sesi (Next 16: pengganti middleware)
├── components/            ← ui/ (shadcn), shared/, layout/, audit/, moderation/
├── lib/
│   ├── api.ts             ← fetch ke BACKEND_API_URL dengan token admin dari sesi
│   ├── actions/           ← Server Action per fitur (login, verifikasi, pembayaran, dst.)
│   ├── dal.ts             ← getCurrentAdmin(): validasi sesi di setiap halaman/aksi
│   └── session.ts         ← cookie httpOnly bertanda tangan HMAC (berisi token backend)
└── types/                 ← tipe data (mengikuti skema backend)
```

### Menjalankan

```bash
cd admin
cp .env.example .env.local    # isi SESSION_SECRET (min. 32 karakter acak)
npm install
npm run dev                   # http://localhost:3000
```

Data diambil dari `BACKEND_API_URL` (default `https://dubidu-api.vercel.app`). Untuk backend lokal isi `BACKEND_API_URL=http://localhost:4000`. Saat di-deploy, tambahkan alamat web admin ke `CORS_ORIGINS` backend.

### Script

| Perintah                      | Fungsi                          |
| ----------------------------- | ------------------------------- |
| `npm run dev`                 | server pengembangan             |
| `npm run build` / `npm start` | build & jalankan versi produksi |
| `npm run lint`                | cek kode dengan ESLint          |

### Aturan

- Data anak, laporan perkembangan, hasil asesmen, dan isi chat **tidak** ditampilkan.
- Setiap aksi yang mengubah data tercatat di audit log (siapa, aksi, target, alasan, waktu). Aksi berisiko wajib diisi alasannya.
- Fetch ke backend hanya dari server (Server Component / Server Action), tidak dari komponen `"use client"`.

---

## AI Use and Third-Party Declaration

### Penggunaan AI dalam pengembangan

- **Claude (Anthropic) lewat Claude Code** dipakai sebagai asisten pemrograman untuk menulis dan merapikan kode aplikasi mobile, web admin, dan backend: menerjemahkan mockup desain ke layar, membuat komponen dan state per fitur, alur navigasi, serta audit fitur web admin.
- **Aset visual** (maskot Doobie, ilustrasi puzzle & onboarding, ikon navbar, foto banner) dibuat dengan bantuan **AI generatif**, lalu dipilih dan disesuaikan oleh tim.
- Semua keluaran AI ditinjau, diuji, dan disesuaikan oleh tim sebelum digabung. Keputusan produk, desain UI/UX, dan alur bisnis ditentukan oleh tim.

### Penggunaan AI di dalam produk

- **Doobie** (asisten di aplikasi) dan **AI matching** (skor & alasan kecocokan anak–teacher) memakai **Anthropic Claude API** dari sisi backend. Model diatur lewat env `DOOBIE_MODEL` dan `MATCHING_MODEL`; kalau `ANTHROPIC_API_KEY` kosong, Doobie memakai balasan bawaan dan matching hanya memakai skor aturan.
- Nama dan kontak pengguna tidak dikirim ke AI. Skor akhir matching = 40% skor aturan + 60% skor AI.

### Pustaka & layanan pihak ketiga

| Jenis             | Nama                                                                                                                                                                             | Lisensi / ketentuan                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Framework mobile  | Expo SDK (expo-router, expo-image, expo-audio, expo-notifications, expo-print, expo-secure-store, dll.), React Native, React                                                     | MIT                                    |
| Animasi & gesture | react-native-reanimated, react-native-worklets, react-native-gesture-handler                                                                                                     | MIT                                    |
| Web admin         | Next.js, Tailwind CSS, shadcn/ui, Base UI, lucide-react                                                                                                                          | MIT / ISC                              |
| Backend           | Express, Prisma, Socket.IO, Zod, jsonwebtoken, bcryptjs, multer, nodemailer, helmet, expo-server-sdk, Anthropic SDK                                                              | MIT / Apache 2.0                       |
| Font              | Poppins, Lato, Fredoka One (via `@expo-google-fonts` & Google Fonts)                                                                                                             | SIL Open Font License 1.1              |
| Ikon              | Feather & Material Community Icons (via `@expo/vector-icons`)                                                                                                                    | MIT / Apache 2.0                       |
| Layanan           | Expo EAS (build & push notification), Vercel (hosting API & admin), PostgreSQL (Neon / Supabase), Cloudinary (file), Midtrans (pembayaran), Daily.co (video call), Anthropic API | sesuai ketentuan layanan masing-masing |

## Lisensi

Lihat [`LICENSE`](LICENSE).
