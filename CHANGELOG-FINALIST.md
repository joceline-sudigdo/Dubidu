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
| Bug fixing | 24 |
| Deployment & stabilisasi | 6 |
| UI/UX polishing | 19 |
| Performance improvement | 6 |
| Keamanan dasar | 8 |
| Dokumentasi | 5 |

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
| Riwayat transaksi menampilkan data contoh | Daftar transaksi berasal dari data statis di aplikasi | Diambil dari server: pembayaran, pendapatan teacher/psikolog, dan pencairan dana, lengkap dengan status | `backend/src/routes/payments.ts` (`GET /payments/history`), `src/lib/transactions-store.ts`, `src/app/riwayat-transaksi.tsx`, `src/app/pencairan.tsx` |
| Kalender laporan, report card & growth timeline memakai data contoh | Nilai dan grafik tidak sesuai laporan yang ditulis teacher; aplikasi crash bila anak belum punya laporan | Diambil dari laporan sesi di server, grafik mingguan & per aspek dihitung dari laporan asli; tampilan kosong yang jelas bila belum ada laporan | `src/lib/reports-store.ts`, `src/components/parent/report-calendar.tsx`, `src/app/report-card/[id].tsx`, `src/data/growth.ts`, `src/app/growth-timeline.tsx` |
| Detail kontrak memakai data contoh | Hari, jam, dan jadwal sesi berikutnya tidak sesuai kontrak di server | Dibentuk dari kontrak & sesi di server; bisa dibuka langsung dari tautan | `src/lib/contracts-sync.ts`, `src/data/contracts.ts`, `src/app/kontrak/[id].tsx` |
| Jadwal shadow teacher memakai data contoh | Teacher baru melihat jadwal milik orang lain; tanpa murid aplikasi error | Jadwal diambil dari server (±60 hari); tampilan kosong + tombol Cari Anak bila belum ada murid | `src/lib/sync.ts`, `src/app/teacher/(tabs)/jadwal.tsx`, `src/data/teacher.ts` |
| Laporan harian teacher tidak terkirim | Form hanya menyimpan di HP, orang tua tidak pernah menerima laporan | Laporan (catatan, skor per aspek, foto) dikirim ke sesi terkait di server dan langsung muncul di report card orang tua | `src/app/teacher/laporan-harian.tsx`, `backend/src/routes/engagements.ts` |
| Berhenti langganan Plus pada akun demo | Tidak bisa diulang untuk demonstrasi | Akun demo bisa menghentikan Plus agar alur langganan bisa dicoba lagi (akun sungguhan tetap aktif sampai akhir periode) | `backend/src/routes/payments.ts`, `src/app/plus.tsx` |
| "Teacher saat ini" tampil sebagai tombol putih kosong | Server mengirim sesi berikutnya `null` (sesi sudah lewat), sehingga pill jadwal kosong | Teks "Belum dijadwalkan" dengan ikon kalender; berlaku juga di Riwayat orang tua & teacher | `src/lib/sync.ts`, `src/app/(tabs)/beranda.tsx` |
| Titik merah notifikasi selalu muncul | Indikator di ikon lonceng tetap tampil walau semua notifikasi sudah dibaca | Hanya muncul bila ada notifikasi belum dibaca, di ketiga peran; notifikasi teacher & psikolog kini punya tanda belum dibaca dan "tandai semua dibaca" | `src/lib/notification-store.ts`, beranda & `notifikasi.tsx` ketiga peran |
| Pesan error berbahasa Inggris | Validasi server tampil apa adanya, mis. "Too small: expected string to have >=3 characters" | Diterjemahkan, mis. "Tulisan minimal 3 karakter."; pesan jaringan, upload, dan sesi login juga berbahasa Indonesia | `src/lib/api.ts`, `src/lib/chat-store.ts`, `src/lib/pdf.ts` |
| Profil teacher crash tanpa profil anak & skor "NaN%" | Membuka profil teacher dari akun tanpa anak membuat aplikasi error; anak tanpa kebutuhan menghasilkan NaN | Ajakan "Tambah Anak" dan skor aman dari pembagian nol | `src/app/profil-teacher/[id].tsx`, `src/data/teachers.ts` |
| Jadwal hari ini teacher "- • Sesi dengan Belum ada sesi!" | Teks gabungan placeholder | "Belum ada sesi hari ini. Waktunya istirahat!"; progress target tidak lagi NaN% untuk akun baru | `src/app/teacher/(tabs)/beranda.tsx`, `src/lib/sync.ts` |
| Avatar anak selalu perempuan | Sinkronisasi memaksa `gender: 'female'` untuk semua anak | Gender asli dikirim server dan dipakai di seluruh tampilan anak | `backend/src/routes/applications.ts`, `engagements.ts`, `psychologists.ts`, `src/lib/sync.ts`, `src/lib/children-store.ts` |
| Skip hanya bisa di sebagian kartu matching | Tombol Lewati nonaktif untuk teacher/anak yang pernah dihubungi | Semua kartu bisa dilewati; Connect menampilkan status "Menghubungkan..." sehingga tidak terkirim dobel | `src/components/parent/teacher-match-card.tsx`, `child-match-card.tsx`, `src/app/cari-teacher.tsx`, `src/app/teacher/cari-anak.tsx` |
| Data kosong tampil janggal | Muncul "0 tahun", "Kelas -", dan "- - AUTISM" | Bagian yang belum diisi disembunyikan | `src/app/teacher/anak/[id].tsx`, `src/app/teacher/(tabs)/riwayat.tsx`, `src/app/kontrak/[id].tsx`, `src/lib/sync.ts` |
| Teks keluar dari kartu | Nominal pendapatan, nama + gelar panjang, kota + harga, dan nilai Info Layanan bisa melewati batas kartu | Dibungkus / dikecilkan otomatis | beranda teacher & psikolog, `profil-teacher/[id].tsx`, `teacher-match-card.tsx` |
| Psikolog tidak bisa melihat dokumen pendaftar | Mengetuk dokumen di halaman Tinjau hanya membuka penampil kosong | Dokumen dibuka dari file aslinya: PDF di penampil dokumen, foto (KTP) di penampil gambar | `src/app/psikolog/tinjau/[id].tsx`, `src/data/psychologist.ts` |
| Batas ukuran upload tidak sama dengan server | Aplikasi menulis maks. 5 MB, server menolak di atas 4 MB, sehingga file 4–5 MB gagal tanpa alasan jelas | Aplikasi memakai batas 4 MB yang sama dengan server | `src/components/ui/upload-box.tsx` |

## 2. Deployment & stabilisasi

| Perubahan | Keterangan |
| --- | --- |
| Server tidak lagi "tertidur" | Jadwal GitHub Actions memanggil `/api/health` tiap 5 menit, sehingga permintaan pertama tidak lagi menunggu ±5 detik (`.github/workflows/keep-warm.yml`) |
| Akun demo tahan dipakai banyak penguji | Akun demo tidak bisa dihapus, diganti, atau direset kata sandinya (lihat Keamanan) |
| Migrasi database | `performance_indexes` dan `dynamic_qris` diterapkan otomatis saat deploy (`prisma migrate deploy`) |
| Uji otomatis diperluas | 4 skenario baru: QRIS dinamis (CRC, validasi, sisip nominal, baca gambar QR) dan kunci akun demo |
| Data demo shadow teacher | Akun demo teacher mendapat anak contoh di Cari Anak dan kuota "Lewati" dihitung di perangkat, sehingga alur lewati 5× → halaman Dubidu Plus selalu bisa didemokan; tombol "Ulang demo skip" untuk mengulang (sama seperti akun demo orang tua) (`src/lib/child-matching-store.ts`, `src/data/teacher.ts`) |
| Akun demo teacher kedua | `ayas@dubidu.id` (Ayas Sudigdo, terverifikasi, level keahlian terisi) ditambahkan ke daftar akun demo dan dibuat otomatis oleh seed bila belum ada di database, supaya juri bisa mencoba dua teacher berbeda (`backend/prisma/seed.ts`, `src/data/dummy-accounts.json`) |

## 3. UI/UX polishing

| Perubahan | Keterangan |
| --- | --- |
| QRIS dengan nominal terisi otomatis | Metode pembayaran QRIS yang sudah ada kini menampilkan QR yang nominalnya (termasuk kode unik) langsung terisi saat di-scan, sehingga pengguna tidak salah mengetik jumlah. Konfirmasi tetap oleh admin seperti sebelumnya (`backend/src/lib/qris.ts`, `src/components/ui/qr-code.tsx`, `src/app/pembayaran/[id].tsx`) |
| Ikon aplikasi & notifikasi DUBIDU | Ikon aplikasi, ikon adaptif Android, ikon notifikasi, dan favicon masih memakai logo template Expo; kini memakai logo DUBIDU (cincin puzzle + beruang) dari aset splash yang sudah ada. Ikon notifikasi berupa siluet putih sesuai aturan Android (`assets/images/`, `app.json`) |
| Status QRIS di web admin | Kartu tujuan transfer menampilkan apakah QR terbaca sebagai QRIS dan nama merchant-nya |
| Foto profil pada akun demo | Avatar inisial diganti foto pada kartu teacher & psikolog contoh (`src/data/images.ts`) |
| Alasan kecocokan di kartu matching | Setiap kartu teacher menampilkan "Kenapa cocok?": keahlian terkuat yang sesuai kebutuhan anak, kota/jarak, rating, dan catatan bila ada kebutuhan yang belum dikuasai. Diturunkan dari rumus skor yang sama, bukan fitur baru (`backend/src/lib/matching.ts`, `src/components/parent/teacher-match-card.tsx`) |
| Petunjuk pembayaran | Langkah bayar menyesuaikan metode (scan QRIS atau transfer bank) |
| Posting komunitas lewat kartu geser | Pilih foto → kartu kecil muncul di bawah dengan panah "Geser ke atas untuk tulis caption" → lembar berisi caption (penghitung minimal 3 karakter), foto, dan topik. Fitur posting yang sama, alur unggahnya dirapikan (`src/components/shared/post-composer-sheet.tsx`, `community-screen.tsx`) |
| Transisi Komunitas | Pergantian kolom pencarian ↔ posting memakai crossfade dengan durasi sama; hasil filter/pencarian memudar halus, tidak melompat |
| Foto profil tidak terpotong | Semua foto di-crop persegi dengan wajah di tengah (kepala Nielsen Dave dkk. tidak lagi terpotong di lingkaran); akun demo Devi, Prasetyo, Dimas Wicaksono, dan beberapa orang tua contoh kini berfoto; nama file = nama orang (`assets/images/avatars/`) |
| Avatar anak | Ilustrasi child-boy / child-girl sesuai gender di sisi orang tua (Beranda, Profil, Report Card) dan teacher |
| Foto profil Doobie | Maskot beruang (pita pink untuk orang tua, dasi biru untuk teacher) di header chat Doobie |
| Halaman kosong di tengah layar | Chat, Riwayat, Jadwal, Verifikasi, Notifikasi, Postingan Tersimpan, Laporan Observasi, Riwayat Transaksi, dan halaman "tidak ditemukan"; empty state baru untuk "Teacher saat ini", konsultasi hari ini, dan notifikasi orang tua |
| Kartu horizontal sejajar | Label status (Pending / Ditolak) di "Pengajuan Aktif" dan jadwal di "Teacher saat ini" selalu di dasar kartu |
| Badge Verified | Di Beranda teacher & psikolog cukup ikon centang, tanpa tulisan |
| Kartu Dubidu Plus | Chip fitur rata tengah; "Skip ∞" menjadi "Unlimited skip" |
| Tab Riwayat | Label ringkas "Diasuh/Didampingi (n)" & "Pengajuan (n)"; tebal huruf kedua tab sama sehingga teks tidak melompat |
| Daftar akun demo | Menampilkan peran tiap akun (Orang Tua / Shadow Teacher / Psikolog) dengan ikon |
| Dokumen diunggah sebagai PDF | Ijazah, sertifikat, dan CV saat pendaftaran teacher, serta rekam medis anak saat pendaftaran orang tua, kini memakai pemilih dokumen (PDF), bukan galeri foto; dokumen tampil sebagai kartu nama file yang bisa dibuka. KTP tetap foto (`src/components/ui/upload-box.tsx`, `src/app/(auth)/daftar-teacher/pendidikan.tsx`, `pengalaman.tsx`, `src/app/(auth)/parent/child-needs.tsx`, `src/lib/auth.ts`) |
| Pill & kartu di baris geser tidak terpotong | Filter (Semua/Masuk/Keluar), chip anak, kartu Pengajuan Aktif, dan topik Doobie sebelumnya terpotong bagian bawah/bayangannya oleh ScrollView; kini diberi ruang tanpa mengubah jarak antarelemen (`src/components/parent/edge-scroll.tsx`, `src/components/shared/doobie-card.tsx`) |

## 4. Performance improvement

| Perubahan | Sebelum | Sesudah |
| --- | --- | --- |
| Permintaan pertama setelah server diam | ±5,2 detik | ±0,2 detik (server dijaga tetap aktif) |
| Pemeriksaan status akun di setiap request | 1–2 query database per request | Di-cache 30 detik di memori server; pembaruan "terakhir aktif" tidak lagi ditunggu |
| Indeks database | Query riwayat pembayaran, langganan, daftar chat, komentar, laporan, antrean verifikasi memindai tabel | 9 indeks baru pada kolom yang paling sering dicari |
| Ukuran aset aplikasi | 27 MB (foto & ilustrasi beresolusi jauh di atas ukuran tampil) | 10 MB (diperkecil ke resolusi tampil, kualitas visual sama) |
| Muat data awal orang tua | 2 permintaan menunggu giliran | Semua permintaan berjalan paralel |
| Foto profil | Foto stok ukuran penuh (hingga 2781 px) dimuat untuk avatar 40–110 px | Versi crop 480 px; foto asli disimpan di `avatars/_source/` dan tidak ikut ter-bundle |

## 5. Keamanan dasar

| Perubahan | Keterangan |
| --- | --- |
| Kunci akun demo | `DELETE /auth/me`, ganti kata sandi, dan reset kata sandi ditolak untuk akun demo, supaya satu penguji tidak bisa mengunci penguji lain |
| Pembatasan laju login | Hanya percobaan gagal yang dihitung (20 per 15 menit), sehingga login normal tidak pernah terblokir |
| Pembatasan pendaftaran & kode reset | 30 per jam per alamat IP |
| Batas umum API | 1.500 request per 5 menit per alamat IP |
| Validasi unggahan | Maksimal 4 MB dan satu berkas per request; jenis berkas dibatasi |
| Kredensial admin dihapus dari README | Kata sandi admin bawaan tidak lagi ditulis di repo publik |
| Hak pencabutan penugasan shadow teacher | Syarat & Ketentuan ditambah poin 8: Dubidu dan lembaga tempat pendampingan berhak memberi peringatan, menghentikan sementara, dan mencabut penugasan shadow teacher yang terbukti melakukan kekerasan atau tindakan tidak wajar terhadap anak; riwayat pelanggaran dipakai menyaring pendamping. Dicantumkan dasar hukumnya: UU Perlindungan Anak, UU Penyandang Disabilitas, UU TPKS, dan UU Pelindungan Data Pribadi (`backend/src/lib/content.ts`, `src/data/legal.ts`) |
| S&K Shadow Teacher wajib dibaca sebelum mendaftar | Memilih peran Shadow Teacher kini membuka halaman Syarat & Ketentuan Shadow Teacher (kode etik, larangan, hak pemberhentian, proses laporan, sanksi, dasar hukum). Tombol lanjut baru aktif setelah dibaca sampai akhir dan disetujui; persetujuan akhir pendaftaran ditambah poin "Siap ditindak bila melanggar" (`src/app/(auth)/daftar-teacher/syarat.tsx`, `src/app/(auth)/register.tsx`, `src/app/(auth)/daftar-teacher/persetujuan.tsx`, `src/components/ui/form-screen.tsx`) |

## 6. Dokumentasi

| Perubahan | Keterangan |
| --- | --- |
| README final | Tautan produk, cara mencoba untuk juri, cara kerja Smart Matching, keamanan dasar, kontribusi tim, known limitations, deklarasi AI & pihak ketiga diperbarui |
| Finalist Changelog | Dokumen ini |
| Dokumentasi API | Endpoint QRIS dinamis, kunci akun demo, dan pembatasan laju (`backend/docs/API.md`) |
| Penjelasan matching | Bobot skor, sumber data, peran verifikasi admin & psikolog, dan rencana validasi (menjawab masukan juri) |
| README: tech stack & arsitektur | Tabel tech stack beserta alasan pemilihan, diagram arsitektur, tabel akun demo per peran, dan known limitations tambahan |

## Tanggapan atas masukan juri

| Masukan | Tindak lanjut dalam rilis ini |
| --- | --- |
| Parameter validasi keahlian terapis perlu diselaraskan dengan standar klinis | README menjelaskan bahwa level keahlian ditetapkan admin setelah rekomendasi psikolog (bukan klaim teacher), berikut rencana rubrik kompetensi. Penyelarasan dengan standar klinis dicatat sebagai known limitation |
| Validasi kualitas matching masih diperlukan | Rumus dan bobot matching didokumentasikan terbuka, setiap kartu kini menunjukkan alasan kecocokannya sehingga orang tua dan juri bisa memeriksa hasilnya, dan metrik validasi (tingkat penerimaan tawaran, ulasan setelah pendampingan) dicatat di README |
| Skalabilitas ketersediaan shadow teacher & profesional | Dicatat sebagai known limitation; daftar "Lewati" tidak lagi habis di kota dengan sedikit pendamping |

## Yang tidak berubah

- Peran pengguna (orang tua, shadow teacher, psikolog, admin) dan seluruh alur utamanya.
- Model data inti dan rumus dasar matching.
- Cara pembayaran dikonfirmasi (manual oleh admin).
- Tech stack (Expo, Next.js, Express, Prisma, PostgreSQL).
