# DUBIDU

Aplikasi yang mempertemukan orang tua anak berkebutuhan khusus dengan shadow teacher dan psikolog.

| Folder | Isi | Teknologi |
|---|---|---|
| `/` (root) | Aplikasi mobile orang tua, shadow teacher, psikolog | Expo (React Native) + Expo Router |
| `admin/` | Web admin (verifikasi, pembayaran, pencairan, moderasi, konten) | Next.js |
| `backend/` | API + database | Node.js, Express, Prisma, PostgreSQL (lihat `backend/README.md`) |

## Menjalankan aplikasi mobile

```bash
cp .env.example .env      # EXPO_PUBLIC_API_URL = alamat backend
npm install
npx expo start
```

- Default backend: `https://dubidu-api.vercel.app`. Untuk backend lokal dari HP fisik pakai IP laptop, misalnya `http://192.168.1.10:4000`.
- Akun demo (tombol **Coba dengan Akun Demo** di layar login): `devi@dubidu.id`, `pras@dubidu.id`, `amanda@dubidu.id`, password `dubidu123`.
- Push notification dan video call hanya bisa dicoba di HP sungguhan dari build EAS (bukan Expo Go).

## Build APK

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build -p android --profile preview
```

Profil build ada di `eas.json` (alamat backend sudah diisi untuk tiap profil).

## Struktur aplikasi mobile

```
src/
  app/          layar (file-based routing)
  components/   komponen UI
  data/         bentuk data tiap layar (diisi dari server saat login)
  lib/
    api.ts      koneksi ke backend + token login
    auth.ts     login, daftar, lupa sandi, logout
    sync.ts     memuat data akun dari server ke src/data
    push.ts     push notification
    *-store.ts  state per fitur (chat, matching, komunitas, pembayaran, dst.)
```
