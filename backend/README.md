# DUBIDU Backend

API untuk aplikasi DUBIDU (orang tua ABK · shadow teacher · psikolog).

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
├── tests/flow.test.ts     ← uji alur lengkap (26 skenario)
└── docs/
    ├── DATABASE.md        ← ERD & penjelasan tabel
    ├── API.md             ← daftar endpoint + pemetaan data dummy frontend
    └── frontend-api-client.ts ← contoh kode untuk frontend Expo
```

## Menjalankan di laptop

```bash
cd backend
npm install
cp .env.example .env          # isi DATABASE_URL & JWT_SECRET
npm run db:migrate            # buat tabel
npm run db:seed               # isi master data + akun demo
npm run dev                   # http://localhost:4000/api/health
npm test                      # uji 26 alur utama
```

Akun demo (password `dubidu123`): `devi@dubidu.id` (orang tua), `pras@dubidu.id` (teacher), `amanda@dubidu.id` (psikolog), `admin@dubidu.id` / `admin12345`.

## Script

| Perintah | Fungsi |
|---|---|
| `npm run dev` | server mode pengembangan (auto-restart) |
| `npm run build` / `npm start` | build & jalankan versi produksi |
| `npm run db:migrate` | buat/terapkan migrasi baru (lokal) |
| `npm run db:deploy` | terapkan migrasi di produksi |
| `npm run db:seed` | isi data awal |
| `npm run db:studio` | lihat/edit isi database lewat browser |
| `npm test` | jalankan uji API |

Lihat [docs/API.md](docs/API.md) untuk daftar endpoint dan [docs/DATABASE.md](docs/DATABASE.md) untuk rancangan database.
