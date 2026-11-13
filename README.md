# DUBIDU

Aplikasi yang mempertemukan orang tua anak berkebutuhan khusus (ABK) dengan shadow teacher lewat smart matching, dilengkapi pemantauan perkembangan anak, konsultasi psikolog, komunitas, kontrak pendampingan, dan transaksi.

| Folder     | Isi                                                             | Teknologi                            |
| ---------- | --------------------------------------------------------------- | ------------------------------------ |
| `/` (root) | Aplikasi mobile orang tua, shadow teacher, psikolog             | Expo (React Native) + Expo Router    |
| `admin/`   | Web admin (verifikasi, pembayaran, pencairan, moderasi, konten) | Next.js                              |
| `backend/` | API + database                                                  | Node.js, Express, Prisma, PostgreSQL |

## Daftar isi

[Tautan](#tautan) · [Cara mencoba](#cara-mencoba-untuk-juri) · [Tech stack](#tech-stack) · [Arsitektur](#arsitektur) · [Backend](#backend) · [Aplikasi mobile](#aplikasi-mobile) · [Web admin](#web-admin) · [Smart Matching](#cara-kerja-smart-matching) · [Keamanan](#keamanan-dasar) · [Kontribusi tim](#kontribusi-tim) · [Known limitations](#known-limitations) · [AI & pihak ketiga](#ai-use-and-third-party-declaration)

## Tautan

| | |
| --- | --- |
| Rilis finalis (APK Android) | [Releases › `finalist-release`](https://github.com/joceline-sudigdo/Dubidu/releases/tag/finalist-release) |
| Backend API | https://dubidu-api.vercel.app/api/health |
| Web admin | https://dubidu-admin.vercel.app/login |
| Perubahan sejak submission 24 jam | [CHANGELOG-FINALIST.md](CHANGELOG-FINALIST.md) |

## Cara mencoba (untuk juri)

1. Pasang APK dari halaman rilis, lalu di layar login tekan **Coba dengan Akun Demo**. Daftar akun menampilkan peran tiap akun.
2. Akun demo (password `dubidu123`):

   | Email | Peran | Catatan |
   | --- | --- | --- |
   | `devi@dubidu.id` | Orang tua | Sudah berlangganan Dubidu Plus (skip tanpa batas, multi anak) |
   | `pras@dubidu.id` | Shadow teacher | Akun gratis: cocok untuk mendemokan batas 5× skip → halaman Dubidu Plus |
   | `ayas@dubidu.id` | Shadow teacher | Akun teacher kedua |
   | `amanda@dubidu.id` | Psikolog | Jadwal konsultasi, verifikasi teacher |

3. Alur yang bisa dicoba dari awal sampai akhir:
   - **Orang tua:** Cari Teacher → Connect → chat → Konsultasi psikolog → pilih jadwal → bayar lewat QRIS (nominal terisi otomatis) → unggah bukti.
   - **Admin:** Bukti Transfer → Konfirmasi → status di aplikasi berubah menjadi lunas.
   - **Psikolog:** Jadwal → buka jam konsultasi → mulai sesi (video call) → kirim hasil observasi.
   - **Shadow teacher:** Cari Anak → ajukan diri / lewati (5× → halaman Dubidu Plus, tombol **Ulang demo skip** untuk mengulang), isi level keahlian di Profil, Pencairan pendapatan.
   - **Semua peran:** Komunitas → ikon foto → pilih foto → geser kartu ke atas → tulis caption → Bagikan.
4. Akun demo dipakai bersama, jadi tidak bisa dihapus atau diganti kata sandinya. Untuk mencoba pendaftaran, verifikasi, dan lupa kata sandi, buat akun baru dari tombol **Daftar di sini**.
5. Akun demo dan akun sungguhan terpisah: akun yang baru didaftarkan tidak melihat data contoh (teacher/psikolog demo), dan sebaliknya.

Akun admin untuk juri dikirim lewat formulir pengumpulan (tidak ditulis di repo publik).

---

## Tech stack

| Lapisan | Teknologi | Alasan dipilih |
| --- | --- | --- |
| Aplikasi mobile | Expo SDK 58, React Native 0.88, React 19, TypeScript, Expo Router, Reanimated 4 | Satu kode untuk Android & iOS, build APK lewat EAS tanpa Android Studio |
| Web admin | Next.js 16 (App Router), Tailwind CSS 4, shadcn/ui, TanStack Table, Recharts | Dashboard internal; data diambil dari server Next.js sehingga token admin tidak terekspos ke browser |
| Backend | Node.js 20, Express 5, TypeScript, Zod, Socket.IO | API REST yang dipakai bersama aplikasi & web admin; validasi input di satu tempat |
| Database | PostgreSQL (Neon) + Prisma 7 | Data relasional (anak, kontrak, sesi, pembayaran) dengan migrasi terversi |
| AI | Anthropic Claude API (Doobie & AI matching) | Opsional: tanpa kunci API, aplikasi tetap berjalan dengan balasan bawaan & skor aturan |
| Layanan | Vercel (hosting), Cloudinary (file), Daily.co / Jitsi (video call), Expo Push, Gmail SMTP, GitHub Actions | Paket gratis, cukup untuk skala MVP |

## Arsitektur

```
┌──────────────────────┐        ┌───────────────────────┐
│ Aplikasi mobile Expo │──HTTPS─▶│                       │──▶ PostgreSQL (Neon)
│ orang tua · teacher  │        │  Backend Express API  │──▶ Cloudinary (foto, bukti bayar)
│ · psikolog           │◀─push──│  (Vercel serverless)  │──▶ Claude API (Doobie, AI matching)
└──────────────────────┘        │                       │──▶ Daily.co (video call)
┌──────────────────────┐        │                       │──▶ Expo Push / Gmail SMTP
│ Web admin Next.js    │──HTTPS─▶│                       │
└──────────────────────┘        └───────────────────────┘
```

Aplikasi dan web admin tidak pernah mengakses database langsung; semua lewat API dengan token JWT dan pengecekan kepemilikan data.

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
├── tests/                 ← flow.test.ts (alur lengkap lewat API) + qris.test.ts (QRIS dinamis)
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
npm test                      # 36 skenario: alur utama lewat API + QRIS dinamis
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

Environment Variables diisi di vercel.com → project → Settings → Environment Variables (lihat `backend/.env.example`). Di Cloudinary aktifkan **Settings → Security → Allow delivery of PDF and ZIP files** supaya dokumen PDF (ijazah, sertifikat) bisa dibuka psikolog & admin. Di Vercel chat tidak realtime (pakai `?after=` untuk cek pesan baru) dan upload maks ±4 MB (wajib Cloudinary).

---

## Aplikasi mobile

**Stack:** Expo SDK 58 · React Native 0.88 · TypeScript · Expo Router (typed routes) · Reanimated 4

```
/
├── app.json               ← nama aplikasi, scheme, package, plugin, EAS projectId
├── eas.json               ← profil build EAS + alamat backend per profil
├── assets/images/         ← maskot Doobie, ilustrasi splash/onboarding, ikon navbar
│   └── avatars/           ← foto profil (crop wajah, nama file = nama orang); _source/ = foto asli
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
| Shadow teacher | pendaftaran & verifikasi (ijazah & sertifikat dalam PDF), cari anak, tawaran jadwal di chat, laporan harian & akhir, pencairan pendapatan                                                                                                                                 |
| Psikolog       | jadwal & sesi konsultasi (video/voice/onsite), kirim hasil observasi, rekomendasi verifikasi shadow teacher, pencairan pendapatan                                                                                                         |
| Semua          | chat (gambar & jadwal), komunitas (posting foto + caption lewat kartu geser, komentar, simpan), Doobie (asisten topik + voice note), Doobie Rewards (ikan, misi, voucher), Dubidu Plus, notifikasi, unduh PDF                         |

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

Data diambil dari `BACKEND_API_URL` (default `https://dubidu-api.vercel.app`). Untuk backend lokal isi `BACKEND_API_URL=http://localhost:4000`. Web admin memanggil backend dari server Next.js (bukan dari browser), jadi `CORS_ORIGINS` tidak perlu diubah.

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

## Cara kerja Smart Matching

Matching dihitung di server (`backend/src/lib/matching.ts`) dan hasilnya bisa dijelaskan ke pengguna:

| Komponen | Bobot | Sumber data |
| --- | --- | --- |
| Kecocokan keahlian | 75% | rata-rata level teacher (0–100) pada bidang yang dibutuhkan anak |
| Rating | 15% | ulasan orang tua (teacher baru tanpa ulasan dianggap 70) |
| Lokasi | 10% | kota sama 100, ≤ 30 km 75, lebih jauh 45 |

- **Kebutuhan anak** diambil dari pilihan kebutuhan saat registrasi dan kata kunci di keterangan diagnosis, lalu dipetakan ke 7 bidang: Speech Delay, Komunikasi, ADHD & Fokus, Sensori, Interaksi Sosial, Autisme, Akademik.
- **Level keahlian teacher bukan klaim sepihak.** Teacher mengisi penilaian diri, psikolog mitra memberi rekomendasi setelah interview, dan admin menetapkan nilai akhir saat verifikasi (web admin › Verifikasi › Level keahlian). Nilai dari admin yang dipakai matching; penilaian diri tetap disimpan sebagai pembanding, dan setiap perubahan tercatat di audit log.
- Hanya teacher berstatus **terverifikasi** yang muncul di hasil matching.
- Setiap kartu teacher menampilkan **"Kenapa cocok?"**: keahlian terkuat yang sesuai kebutuhan anak, jarak/kota, dan rating, plus catatan bila ada kebutuhan anak yang keahlian teacher-nya masih di bawah 50. Alasan ini diturunkan langsung dari rumus skor di atas, jadi orang tua bisa memeriksa sendiri.
- Bila `ANTHROPIC_API_KEY` diisi, 5 kandidat teratas juga dinilai model bahasa (alasan kecocokan dalam kalimat) dan skor akhir menjadi 40% skor aturan + 60% skor model. Tanpa kunci, matching sepenuhnya memakai skor aturan di atas.

Rencana validasi: level keahlian diselaraskan dengan rubrik kompetensi yang disusun bersama psikolog mitra, dan kualitas matching diukur dari tingkat penerimaan tawaran serta ulasan setelah pendampingan.

---

## Keamanan dasar

- Kata sandi disimpan sebagai hash bcrypt; token login JWT disimpan terenkripsi di perangkat (expo-secure-store).
- Pembatasan laju: percobaan login gagal (20 / 15 menit), pendaftaran & kode reset (30 / jam), dan batas umum per alamat IP.
- Akun yang dinonaktifkan admin langsung kehilangan akses; akun demo tidak bisa dihapus atau diganti kata sandinya.
- Akses data dicek per pemilik (anak, chat, pembayaran, laporan); teacher hanya melihat inisial anak sampai tawaran diterima.
- Unggahan dibatasi jenis file (JPG, PNG, WEBP, HEIC, PDF) dan ukuran 4 MB.
- Web admin: sesi cookie httpOnly bertanda tangan, semua aksi tercatat di audit log, data anak & isi chat tidak ditampilkan.

---

## Kontribusi tim

| Anggota | Peran | Kontribusi |
| --- | --- | --- |
| Joceline Sudigdo | Frontend & desain | UI/UX aplikasi mobile (orang tua, shadow teacher, psikolog), web admin, aset visual, konfigurasi build |
| Ni Putu Saraswati | Backend & database | skema database, API, pembayaran, integrasi aplikasi & web admin dengan backend, deployment, pengujian |

---

## Known limitations

- **Pembayaran dikonfirmasi manual.** QRIS dinamis mengisi nominal otomatis, tetapi lunas/tidaknya tetap dicek admin dari mutasi rekening (belum ada callback otomatis dari bank).
- **Chat belum realtime penuh.** Di hosting serverless, pesan baru diambil tiap ±4 detik (polling), bukan lewat websocket.
- **Push notification dan video call** hanya berjalan di APK hasil build (bukan Expo Go); push notification iOS belum dikonfigurasi.
- **Server paket gratis bisa "tertidur".** Sebuah jadwal ping tiap 5 menit menjaga server tetap responsif; bila ping terlambat, permintaan pertama bisa butuh beberapa detik.
- **Klaim misi Doobie Rewards** masih memakai data contoh di aplikasi (poin & penukaran hadiah sudah tersimpan di server).
- **Ketersediaan pendamping.** Hasil matching bergantung pada jumlah shadow teacher dan psikolog terverifikasi di tiap kota; akun sungguhan di kota tanpa pendamping akan melihat daftar kosong.
- **Level keahlian** belum memakai rubrik klinis baku (lihat rencana validasi di bagian Smart Matching).
- **Ukuran unggahan** maksimal 4 MB per file.
- **Kuota "Lewati" akun demo** dihitung di perangkat (bukan server) dan ditambah anak/teacher contoh, supaya alur skip → Dubidu Plus selalu bisa didemokan. Akun sungguhan memakai kuota dari server.
- **Avatar anak** memakai ilustrasi sesuai gender (bukan foto asli anak) untuk menjaga privasi; foto profil akun demo adalah foto stok.
- **Bahasa** aplikasi hanya Bahasa Indonesia; pesan error teknis dari server diterjemahkan di aplikasi.

---

## AI Use and Third-Party Declaration

### Penggunaan AI dalam pengembangan

- **Claude (Anthropic) lewat Claude Code** dipakai sebagai asisten pemrograman untuk menulis dan merapikan kode aplikasi mobile, web admin, dan backend: menerjemahkan mockup desain ke layar, membuat komponen dan state per fitur, alur navigasi, serta audit fitur web admin.
- **Aset visual** (maskot Doobie, ilustrasi puzzle & onboarding, ikon navbar) dibuat dengan bantuan **AI generatif**, lalu dipilih dan disesuaikan oleh tim.
- **Foto** (foto profil akun demo dan foto banner) **bukan** buatan AI: semuanya foto stok gratis dari Magnific (lihat tabel di bawah).
- Pada tahap finalis, Claude Code juga dipakai untuk audit UI/UX & bug (tampilan kosong, teks keluar kartu, pesan error berbahasa Inggris), menyelesaikan merge conflict, serta menyusun draf README dan changelog ini.
- Foto profil di-crop otomatis ke area wajah dengan skrip Python (Pillow); posisi wajah ditentukan manual oleh tim.
- Semua keluaran AI ditinjau, diuji, dan disesuaikan oleh tim sebelum digabung. Keputusan produk, desain UI/UX, dan alur bisnis ditentukan oleh tim.

### Penggunaan AI di dalam produk

- **Doobie** (asisten di aplikasi) dan **AI matching** (skor & alasan kecocokan anak–teacher) memakai **Anthropic Claude API** dari sisi backend. Model diatur lewat env `DOOBIE_MODEL` dan `MATCHING_MODEL`; kalau `ANTHROPIC_API_KEY` kosong, Doobie memakai balasan bawaan dan matching hanya memakai skor aturan.
- Nama dan kontak pengguna tidak dikirim ke AI. Skor akhir matching = 40% skor aturan + 60% skor AI.

### Pustaka & layanan pihak ketiga

| Jenis             | Nama                                                                                                                                                                             | Lisensi / ketentuan                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Framework mobile  | Expo SDK (expo-router, expo-image, expo-audio, expo-notifications, expo-print, expo-secure-store, expo-document-picker, dll.), React Native, React                                                     | MIT                                    |
| Animasi & gesture | react-native-reanimated, react-native-worklets, react-native-gesture-handler                                                                                                     | MIT                                    |
| Web admin         | Next.js, Tailwind CSS, shadcn/ui, Base UI, lucide-react                                                                                                                          | MIT / ISC                              |
| Backend           | Express, Prisma, Socket.IO, Zod, jsonwebtoken, bcryptjs, multer, nodemailer, helmet, express-rate-limit, expo-server-sdk, Anthropic SDK, jsqr, pngjs                             | MIT / Apache 2.0                       |
| QR                | qrcode-generator (menggambar QRIS di aplikasi), jsqr + pngjs (membaca QRIS dari gambar di server)                                                                                | MIT / Apache 2.0                       |
| Foto              | Foto profil contoh pada akun demo (`assets/images/avatars/`, asli di `avatars/_source/`) & foto banner Beranda (`assets/images/images/`): foto stok gratis dari [Magnific](https://www.magnific.com) (sebelumnya Freepik). Nama orang pada profil demo fiktif dan tidak merujuk ke model di foto. **Designed by Magnific** | Lisensi Free Magnific: boleh dipakai komersial dengan atribusi |
| Font              | Poppins, Lato, Fredoka One (via `@expo-google-fonts` & Google Fonts)                                                                                                             | SIL Open Font License 1.1              |
| Ikon              | Feather & Material Community Icons (via `@expo/vector-icons`)                                                                                                                    | MIT / Apache 2.0                       |
| Layanan           | Expo EAS (build & push notification), Firebase Cloud Messaging (push Android), Vercel (hosting API & admin), Neon (PostgreSQL), Cloudinary (file), Daily.co / Jitsi (video call), Gmail SMTP (email reset), GitHub Actions (ping server), Anthropic API (opsional), Midtrans (opsional, belum diaktifkan) | sesuai ketentuan layanan masing-masing |

## Lisensi

Lihat [`LICENSE`](LICENSE).
