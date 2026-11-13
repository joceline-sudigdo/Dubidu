# Finalist Changelog

Perubahan dari **`submission-24h`** (commit `f2fbb03`, 1 November 2026) menuju **`finalist-release`**.

Seluruh perubahan berada dalam lingkup refinement yang diizinkan: perbaikan bug, deployment & stabilisasi,
UI/UX polishing, peningkatan performa, keamanan dasar, dan dokumentasi. **Tidak ada fitur inti, peran pengguna,
atau alur bisnis baru**: produk tetap aplikasi pendampingan ABK dengan smart matching, pemantauan perkembangan,
konsultasi psikolog, komunitas, dan pembayaran lewat QRIS / transfer bank yang dikonfirmasi admin.

Bandingkan kode: https://github.com/joceline-sudigdo/Dubidu/compare/submission-24h...finalist-release

## Ringkasan

| Kategori | Jumlah perubahan |
| --- | --- |
| Bug fixing | 8 |
| Deployment & stabilisasi | 4 |
| UI/UX polishing | 4 |
| Performance improvement | 5 |
| Keamanan dasar | 6 |
| Dokumentasi | 4 |

## 1. Bug fixing

| Perubahan | Sebelum | Sesudah | Berkas utama |
| --- | --- | --- | --- |
| Format tanggal lahir saat registrasi | Aplikasi mengirim `DD/MM/YYYY`, server menunggu `YYYY-MM-DD`, sehingga pendaftaran dengan tanggal lahir gagal | Tanggal dikonversi sebelum dikirim | `src/components/ui/date-field.tsx`, `src/lib/auth.ts`, `src/lib/children-store.ts` |
| Daftar "Lewati" di Cari Teacher bisa habis | Teacher yang dilewati hilang selamanya; di kota dengan sedikit teacher daftar menjadi kosong | Teacher yang dilewati pindah ke belakang antrean | `backend/src/routes/matching.ts`, `src/lib/matching-store.ts` |
| Gambar QR tertimpa saat QRIS diedit di web admin | Form "Ubah" tidak punya kolom gambar QR, sehingga gambar diganti gambar maskot | Kolom gambar QR ditambahkan; dikosongkan = gambar lama tetap dipakai | `admin/src/lib/actions/payments.ts`, `admin/src/app/(dashboard)/pembayaran/tujuan/page.tsx` |
| Halaman sisa template masih bisa dibuka | `/explore` dan `/home` ("Halaman beranda sedang disiapkan") ikut ter-build | Halaman dan komponen template yang tidak dipakai dihapus | `src/app/explore.tsx`, `src/app/home.tsx`, 14 berkas pendukung |
| Error TypeScript & lint | 8 error TypeScript dan 3 error lint | 0 error TypeScript, 0 error lint | `src/app/chat/[id].tsx` dan berkas template di atas |
| Uji otomatis "Lewati" tidak sesuai perilaku baru | 1 dari 31 skenario gagal | 36 dari 36 skenario lulus | `backend/tests/flow.test.ts` |
| Pesan upload file terlalu besar tidak jelas | Server membalas error umum | Pesan "Ukuran file maksimal 4 MB" | `backend/src/lib/upload.ts`, `backend/src/lib/http.ts` |
| Berhenti langganan Plus pada akun demo | Tidak bisa diulang untuk demonstrasi | Akun demo bisa menghentikan Plus agar alur langganan bisa dicoba lagi (akun sungguhan tetap aktif sampai akhir periode) | `backend/src/routes/payments.ts`, `src/app/plus.tsx` |

## 2. Deployment & stabilisasi

| Perubahan | Keterangan |
| --- | --- |
| Server tidak lagi "tertidur" | Jadwal GitHub Actions memanggil `/api/health` tiap 5 menit, sehingga permintaan pertama tidak lagi menunggu ±5 detik (`.github/workflows/keep-warm.yml`) |
| Akun demo tahan dipakai banyak penguji | Akun demo tidak bisa dihapus, diganti, atau direset kata sandinya (lihat Keamanan) |
| Migrasi database | `performance_indexes` dan `dynamic_qris` diterapkan otomatis saat deploy (`prisma migrate deploy`) |
| Uji otomatis diperluas | 4 skenario baru: QRIS dinamis (CRC, validasi, sisip nominal, baca gambar QR) dan kunci akun demo |

## 3. UI/UX polishing

| Perubahan | Keterangan |
| --- | --- |
| QRIS dengan nominal terisi otomatis | Metode pembayaran QRIS yang sudah ada kini menampilkan QR yang nominalnya (termasuk kode unik) langsung terisi saat di-scan, sehingga pengguna tidak salah mengetik jumlah. Konfirmasi tetap oleh admin seperti sebelumnya (`backend/src/lib/qris.ts`, `src/components/ui/qr-code.tsx`, `src/app/pembayaran/[id].tsx`) |
| Status QRIS di web admin | Kartu tujuan transfer menampilkan apakah QR terbaca sebagai QRIS dan nama merchant-nya |
| Foto profil pada akun demo | Avatar inisial diganti foto pada kartu teacher & psikolog contoh (`src/data/images.ts`) |
| Petunjuk pembayaran | Langkah bayar menyesuaikan metode (scan QRIS atau transfer bank) |

## 4. Performance improvement

| Perubahan | Sebelum | Sesudah |
| --- | --- | --- |
| Permintaan pertama setelah server diam | ±5,2 detik | ±0,2 detik (server dijaga tetap aktif) |
| Pemeriksaan status akun di setiap request | 1–2 query database per request | Di-cache 30 detik di memori server; pembaruan "terakhir aktif" tidak lagi ditunggu |
| Indeks database | Query riwayat pembayaran, langganan, daftar chat, komentar, laporan, antrean verifikasi memindai tabel | 9 indeks baru pada kolom yang paling sering dicari |
| Ukuran aset aplikasi | 27 MB (foto & ilustrasi beresolusi jauh di atas ukuran tampil) | 10 MB (diperkecil ke resolusi tampil, kualitas visual sama) |
| Muat data awal orang tua | 2 permintaan menunggu giliran | Semua permintaan berjalan paralel |

## 5. Keamanan dasar

| Perubahan | Keterangan |
| --- | --- |
| Kunci akun demo | `DELETE /auth/me`, ganti kata sandi, dan reset kata sandi ditolak untuk akun demo, supaya satu penguji tidak bisa mengunci penguji lain |
| Pembatasan laju login | Hanya percobaan gagal yang dihitung (20 per 15 menit), sehingga login normal tidak pernah terblokir |
| Pembatasan pendaftaran & kode reset | 30 per jam per alamat IP |
| Batas umum API | 1.500 request per 5 menit per alamat IP |
| Validasi unggahan | Maksimal 4 MB dan satu berkas per request; jenis berkas dibatasi |
| Kredensial admin dihapus dari README | Kata sandi admin bawaan tidak lagi ditulis di repo publik |

## 6. Dokumentasi

| Perubahan | Keterangan |
| --- | --- |
| README final | Tautan produk, cara mencoba untuk juri, cara kerja Smart Matching, keamanan dasar, kontribusi tim, known limitations, deklarasi AI & pihak ketiga diperbarui |
| Finalist Changelog | Dokumen ini |
| Dokumentasi API | Endpoint QRIS dinamis, kunci akun demo, dan pembatasan laju (`backend/docs/API.md`) |
| Penjelasan matching | Bobot skor, sumber data, peran verifikasi admin & psikolog, dan rencana validasi (menjawab masukan juri) |

## Tanggapan atas masukan juri

| Masukan | Tindak lanjut dalam rilis ini |
| --- | --- |
| Parameter validasi keahlian terapis perlu diselaraskan dengan standar klinis | README menjelaskan bahwa level keahlian ditetapkan admin setelah rekomendasi psikolog (bukan klaim teacher), berikut rencana rubrik kompetensi. Penyelarasan dengan standar klinis dicatat sebagai known limitation |
| Validasi kualitas matching masih diperlukan | Rumus dan bobot matching didokumentasikan terbuka, beserta metrik yang akan dipakai untuk validasi |
| Skalabilitas ketersediaan shadow teacher & profesional | Dicatat sebagai known limitation; daftar "Lewati" tidak lagi habis di kota dengan sedikit pendamping |

## Yang tidak berubah

- Peran pengguna (orang tua, shadow teacher, psikolog, admin) dan seluruh alur utamanya.
- Model data inti dan rumus dasar matching.
- Cara pembayaran dikonfirmasi (manual oleh admin).
- Tech stack (Expo, Next.js, Express, Prisma, PostgreSQL).
