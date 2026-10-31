# Referensi API DUBIDU

Base URL: `https://dubidu-api.vercel.app/api` (lokal: `http://localhost:4000/api`)

- Semua body & respons berformat JSON.
- Endpoint bertanda 🔒 butuh header `Authorization: Bearer <token>` (token dari login/register).
- Error selalu berbentuk `{ "error": "pesan bahasa Indonesia", "details"?: [...] }`.
- Waktu disimpan UTC; label jam (`"15:00"`) sudah dikonversi ke WIB.
- **Akun demo vs user sungguhan:** akun dari seed demo punya `isDemo: true` dan hanya melihat sesama akun demo. User yang mendaftar sendiri (`isDemo: false`) hanya melihat user sungguhan, berlaku untuk rekomendasi matching, daftar psikolog, booking, profil teacher, dan komunitas. Akses ke data dunia lain → 404. Admin melihat semuanya.

## Pemetaan data dummy frontend → endpoint

| Data dummy di `src/data/parent.ts` / `lib/auth.ts` | Ganti dengan |
|---|---|
| `login()` dari `dummy-accounts.json` | `POST /auth/login` |
| `ParentRegistration` (context) → `TODO(backend)` di `child-needs.tsx` | `POST /auth/register` |
| `parentProfile` | `GET /auth/me` |
| `children`, `activeTeachers`, `quickQuestion` | `GET /home/parent` |
| `notifications` | `GET /notifications` |
| `sessionReports` | `GET /children/:childId/reports?month=YYYY-MM` |
| `reportDetail` | `GET /reports/:id` |
| `chatThreads` (daftar) | `GET /conversations` |
| `chatThreads[i].messages` | `GET /conversations/:id/messages` |
| `communityPosts` | `GET /posts?topic=` |
| `psychologists` | `GET /psychologists?category=` |
| `consultationDates`, `consultationTimes` | `GET /psychologists/:id/availability` |
| `PROMO_CODE`, `finalPrice()` | `POST /consultations/quote` |
| `activeMatches` | `GET /engagements?status=ACTIVE` |
| `applications` | `GET /applications` |
| Check-in & "Klaim madu" | `GET /checkins/week`, `POST /checkins` |
| Doobie | `POST /doobie/chat` |

## Auth

| Method | Path | Body / Query | Keterangan |
|---|---|---|---|
| POST | `/auth/register` | `{ role: "PARENT"\|"TEACHER", fullName, contact, password, nickname?, domicile?, latitude?, longitude?, child?: { name, birthDate?: "2016-05-21", gender?: "MALE"\|"FEMALE", schoolLevel?: "TK"\|"SD"\|"SMP", grade?, domicile?, diagnosis?, conditions: string[] } }` | `contact` = email **atau** no. HP. Balikan `{ token, user, children }` |
| POST | `/auth/login` | `{ contact, password }` | `{ token, user }` |
| GET 🔒 | `/auth/me` | | profil + `children` + `plan` + `stats` |
| PATCH 🔒 | `/auth/me` | `{ fullName?, nickname?, domicile?, avatarUrl?, ktpUrl?, latitude?, longitude?, pushToken? }` | |
| POST 🔒 | `/auth/change-password` | `{ oldPassword, newPassword }` | |
| POST | `/auth/forgot-password` | `{ email }` | kirim kode OTP 6 digit ke email (berlaku 15 menit). Selalu 200 |
| POST | `/auth/reset-password` | `{ email, code, newPassword }` | balikan `{ token, user }` (langsung login) |
| POST 🔒 | `/auth/devices` | `{ token: "ExponentPushToken[...]", platform: "ios"\|"android" }` | daftarkan HP untuk push notification |
| DELETE 🔒 | `/auth/devices` | `{ token }` | panggil saat logout |

## Master data & upload

| Method | Path | Keterangan |
|---|---|---|
| GET | `/meta/needs` | kategori + pilihan kebutuhan anak (label dipakai di `conditions` & `specializations`) |
| GET | `/meta/app` | mood check-in, hadiah Madu, topik komunitas, tipe konsultasi |
| POST 🔒 | `/uploads?folder=ktp` | `multipart/form-data` field `file` (JPG/PNG/WEBP/HEIC/PDF, maks 10 MB) → `{ url }` |

Alur registrasi dengan file: `POST /auth/register` → simpan token → `POST /uploads?folder=ktp` → `PATCH /auth/me { ktpUrl }` → `POST /uploads?folder=rekam-medis` → `PATCH /children/:id { medicalRecordUrl }`.

## Beranda

| Method | Path | Keterangan |
|---|---|---|
| GET 🔒 | `/home/parent?childId=` | `greeting`, `points`, `unreadNotifications`, `children[]`, `selectedChildId`, `quickQuestion`, `activeTeachers[]`, `checkin{ days[7], todayDone }` |
| GET 🔒 | `/home/teacher?childId=` | `greeting`, `verified`, `children[]`, `todaySchedule[]`, `applications[]`, `earnings{ month, weekGrowthPercent }`, `sessions{ doneThisMonth, target, percent }`, `checkin` |

## Anak (orang tua)

| Method | Path | Keterangan |
|---|---|---|
| GET 🔒 | `/children` | |
| POST 🔒 | `/children` | body sama dengan `child` di register. Akun gratis maks. 1 anak (402) |
| GET 🔒 | `/children/:id` | orang tua / teacher / psikolog terkait |
| PATCH 🔒 | `/children/:id` | kirim `conditions` untuk mengganti seluruh kebutuhan |
| DELETE 🔒 | `/children/:id` | |

## Matching berbasis profil (layar Cari Teacher / Cari Anak / Bandingkan)

Tidak ada swipe. Skor = 75% kecocokan keahlian (level teacher 0–100 di bidang yang dibutuhkan anak) + 15% rating + 10% lokasi, lalu digabung dengan penilaian AI (40% skor dasar + 60% AI) bila `ANTHROPIC_API_KEY` diisi.

Bidang keahlian (kunci): `speech`, `communication`, `adhd`, `sensory`, `social`, `autism`, `academic` (sama dengan `SKILL_LABELS` di frontend; daftar lengkap di `GET /meta/app` → `skills`).

| Method | Path | Keterangan |
|---|---|---|
| GET 🔒 | `/matching/teachers?childId=` | (orang tua) **5 teacher paling cocok**: `{ child: { skills[] }, matchCount, skipsLeft, aiPending, cards[] }`. Kartu = `Teacher` di frontend: `id, name, city, price, rating, reviews, experience, responseRate, sessions, about, skills{speech:..}`, plus `matchPercent`, `ruleScore`, `ai: { score, reasons[], caution } \| null`, `connected`. `skipsLeft: null` = tanpa batas (Plus) |
| POST 🔒 | `/matching/teachers/:teacherId/skip` | `{ childId }` — **Lewati**; balikan daftar baru (kandidat berikutnya masuk). Gratis 5×/hari → 429 kalau habis |
| POST 🔒 | `/matching/teachers/:teacherId/connect` | `{ childId, message? }` — **Hubungkan**: pengajuan + chat langsung terbuka dengan pesan penawaran otomatis → `{ application, conversationId }` |
| GET 🔒 | `/matching/teachers/compare?childId=&teacherIds=a,b` | **Bandingkan Teacher**: `{ teachers[2], recommendedId, reason }` |
| GET 🔒 | `/matching/children` | (teacher terverifikasi) **5 anak paling cocok**, data dianonimkan: `id, initials, age, grade, city, distanceKm, parent, needs[] (kunci bidang), needLabels[], matchPercent, ai, connected, requestId` |
| POST 🔒 | `/matching/children/:childId/skip` | Lewati anak |
| POST 🔒 | `/matching/children/:childId/connect` | `{ message? }` — teacher menawarkan diri → chat terbuka |
| GET 🔒 | `/matching/children/compare?childIds=a,b` | **Bandingkan Anak** |

**Permintaan & Terima Tawaran:** permintaan dari orang tua muncul di `GET /applications?status=PENDING` (`initiatedBy: "PARENT"`). Tombol **Terima Tawaran** = `PATCH /applications/:id { status: "ACCEPTED" }`, yang otomatis mengirim pesan balasan di chat. Sebelum diterima, teacher hanya melihat inisial anak.

## Pengajuan, kontrak, sesi, jadwal

| Method | Path | Keterangan |
|---|---|---|
| GET 🔒 | `/applications?status=PENDING` | riwayat pengajuan |
| GET 🔒 | `/applications/:id` | |
| PATCH 🔒 | `/applications/:id` | `{ status: "ACCEPTED"\|"REJECTED"\|"CANCELLED" }` → `conversationId` saat diterima |
| POST 🔒 | `/engagements` | `{ applicationId, ratePerSession, totalSessions, frequency?, location?, phase?, startDate?, endDate? }` |
| GET 🔒 | `/engagements?status=ACTIVE` | bentuk `activeMatches` |
| GET 🔒 | `/engagements/:id` | + `sessions[]`, `payments[]` |
| PATCH 🔒 | `/engagements/:id` | `{ status?, phase?, location?, frequency? }` |
| POST 🔒 | `/engagements/:id/sessions` | `{ sessions: [{ startAt, endAt, location? }] }` (ISO, mis. `2026-11-02T08:00:00+07:00`) |
| POST 🔒 | `/engagements/:id/payments` | (orang tua) `{ sessions }` → Payment |
| PATCH 🔒 | `/sessions/:id` | `{ status?, startAt?, endAt?, location? }` |
| GET 🔒 | `/schedule?from=2026-11-01&to=2026-11-30` | tab Jadwal: sesi + konsultasi |

## Report card

| Method | Path | Keterangan |
|---|---|---|
| POST 🔒 | `/sessions/:sessionId/report` | (teacher) `{ dailyNote, achievement?, sensoryNote?, homeTip?, improved[], attention[], needsAttention?, scores: [{ aspect, value 1–5 }], photos: [{ url, caption? }] }` |
| GET 🔒 | `/children/:childId/reports?month=2026-09` | bentuk `sessionReports` |
| GET 🔒 | `/reports/:id` | bentuk `reportDetail` (+ tren vs laporan sebelumnya) |

## Chat & respon cepat

| Method | Path | Keterangan |
|---|---|---|
| GET 🔒 | `/conversations` | daftar chat + `unread` |
| GET 🔒 | `/conversations/:id/messages?before=&after=&limit=50` | bentuk `ChatMessage`. `after=<createdAt pesan terakhir>` → hanya pesan baru (dipakai untuk cek berkala tiap 3–5 detik saat layar chat terbuka) |
| POST 🔒 | `/conversations/:id/messages` | `{ type: "TEXT", text }` / `{ type: "IMAGE", imageUrl }` / `{ type: "SCHEDULE", schedule: { title, date, hours, place } }` |
| POST 🔒 | `/conversations/:id/read` | tandai dibaca |
| GET 🔒 | `/quick-questions?pending=true` | |
| POST 🔒 | `/quick-questions` | (teacher) `{ childId, text }` |
| POST 🔒 | `/quick-questions/:id/answer` | (orang tua) `{ answer: "YES"\|"NO" }` |

**Push notification:** setiap notifikasi (chat, booking, laporan, pengajuan) otomatis dikirim ke semua HP user yang terdaftar lewat `/auth/devices`. `data.link` berisi rute tujuan; Android `channelId`: `chat`, `booking`, `laporan`, `default`.

**Server di Vercel (serverless): Socket.IO tidak aktif.** Saat layar chat terbuka, panggil `GET /conversations/:id/messages?after=...` tiap 3–5 detik; daftar chat & notifikasi cukup di-refresh saat layar dibuka / ditarik ke bawah. Push notification ke HP tetap jalan. Upload file maks ±4 MB per file.

**Realtime (Socket.IO, hanya kalau server dijalankan sebagai server biasa — laptop/Render)** — `io(BASE_URL_TANPA_/api, { auth: { token } })`, event: `message:new`, `message:read`, `notification:new`.

## Psikolog & konsultasi

| Method | Path | Keterangan |
|---|---|---|
| GET 🔒 | `/psychologists?category=ADHD` | bentuk `Psychologist` |
| GET 🔒 | `/psychologists/:id` | + `reviewsList` |
| GET 🔒 | `/psychologists/:id/availability?days=7` | `[{ date, day, dayOfMonth, status: open\|few\|full, times: [{ slotId, time, status: open\|last\|full }] }]` |
| POST 🔒 | `/psychologists/me/slots` | (psikolog) `{ startAts: ["2026-11-02T09:00:00+07:00"] }` |
| DELETE 🔒 | `/psychologists/me/slots/:slotId` | |
| POST 🔒 | `/consultations/quote` | `{ psychologistId, promoCode? }` → harga akhir |
| POST 🔒 | `/consultations` | `{ psychologistId, slotId, type: "VIDEO"\|"CALL"\|"CHAT", childId?, promoCode?, complaint? }` → `{ consultation, payment }` |
| GET 🔒 | `/consultations?status=` | |
| GET 🔒 | `/consultations/:id` | |
| POST 🔒 | `/consultations/:id/cancel` | |
| GET 🔒 | `/consultations/:id/join` | link video/voice call pribadi `{ url, provider, opensAt, closesAt }` — dibuka 15 menit sebelum jadwal (425 kalau terlalu awal) |
| PATCH 🔒 | `/consultations/:id/result` | (psikolog) `{ observation, recommendation, followUp? }` |

## Pembayaran & Dubidu Plus

| Method | Path | Keterangan |
|---|---|---|
| GET 🔒 | `/payments` | riwayat transaksi |
| GET 🔒 | `/payments/:id` | |
| GET 🔒 | `/payments/methods` | daftar QRIS & rekening tujuan yang aktif |
| POST 🔒 | `/payments/:id/checkout` | **manual:** `{ mode: "manual", amount, uniqueCode, amountDue, expiresAt, methods[], steps[] }` · **midtrans:** `{ mode, snapToken, redirectUrl }` · **mock:** `{ mode: "mock" }` |
| POST 🔒 | `/payments/:id/proof` | (manual) `{ methodId, proofUrl, senderName, note? }` → status `VERIFYING` |
| POST 🔒 | `/payments/:id/refresh` | cek status ke Midtrans setelah user kembali dari halaman bayar |
| POST 🔒 | `/payments/:id/pay` | **hanya mode mock** (server tanpa kunci Midtrans) — langsung lunas |
| POST | `/payments/midtrans/notification` | **webhook Midtrans** (diverifikasi `signature_key`) — isi di Dashboard Midtrans |
| GET | `/payments/finish` | halaman setelah bayar → kembali ke aplikasi (`dubidu://pembayaran`) |
| GET 🔒 | `/subscription` | status Plus + harga |
| POST 🔒 | `/subscription` | `{ plan: "MONTHLY"\|"YEARLY" }` → `{ subscription, payment }` |

## Komunitas, notifikasi, check-in, Doobie, ulasan

| Method | Path | Keterangan |
|---|---|---|
| GET 🔒 | `/posts?topic=&cursor=` | `{ posts[], nextCursor }` |
| POST 🔒 | `/posts` | `{ text, topic, photos?[] }` |
| DELETE 🔒 | `/posts/:id` | |
| POST 🔒 | `/posts/:id/like` | toggle |
| GET/POST 🔒 | `/posts/:id/comments` | `{ text }` |
| GET 🔒 | `/notifications?category=CHAT` | `{ unread, items[] }` (`group`: today/yesterday/week/older) |
| POST 🔒 | `/notifications/:id/read`, `/notifications/read-all` | |
| GET 🔒 | `/checkins/week?childId=` | |
| POST 🔒 | `/checkins` | `{ childId, mood: "SENANG"\|"TENANG"\|"BIASA"\|"REWEL"\|"SEDIH", note? }` → `{ pointsEarned, points }` |
| POST 🔒 | `/doobie/chat` | `{ message, childId?, topic? }` → `{ reply }` |
| GET 🔒 | `/doobie/history?childId=` | |
| GET 🔒 | `/teachers/:userId` | profil publik teacher |
| PATCH 🔒 | `/teachers/me` | (teacher) profil terstandar + `specializations: string[]` + **`skills: { speech: 90, adhd: 70, ... }`** (penilaian diri 0–100, wajib sebelum diverifikasi) |
| POST 🔒 | `/teachers/me/documents` | `{ type: "KTP"\|"IJAZAH"\|"SERTIFIKAT"\|"CV"\|"LAINNYA", url }` |
| POST 🔒 | `/reviews` | (orang tua) `{ targetUserId, rating 1–5, comment? }` |

## Admin

| Method | Path | Keterangan |
|---|---|---|
| GET 🔒 | `/admin/stats?demo=false` | angka user sungguhan (default) + `demoUsers`; `demo=true` untuk angka data demo |
| GET 🔒 | `/admin/teachers?status=PENDING` | antrian verifikasi |
| PATCH 🔒 | `/admin/teachers/:userId/verification` | `{ status: "VERIFIED"\|"REJECTED", note? }` — VERIFIED ditolak (400) kalau teacher belum mengisi level keahlian |
| PATCH 🔒 | `/admin/teachers/:userId/skills` | `{ skills: { speech: 80, ... } }` — admin menyesuaikan level setelah cek dokumen/interview (nilai ini yang dipakai matching). `GET /admin/teachers` menampilkan `skillLevels: { speech: { self, level, adminAdjusted } }` |
| POST 🔒 | `/admin/psychologists` | buat akun psikolog |
| PATCH 🔒 | `/admin/users/:id` | `{ isActive }` |
| GET 🔒 | `/admin/users?role=&q=&demo=&page=&pageSize=` | daftar user (cari nama/email/HP). `demo=true`/`false` untuk memfilter; tiap user punya `isDemo` → tampilkan label "Demo" |
| GET 🔒 | `/admin/payments?status=VERIFYING&page=` | transaksi (+ bukti transfer, metode) + ringkasan pendapatan. `VERIFYING` = antrian cek bukti |
| POST 🔒 | `/admin/payments/:id/confirm` | dana sudah masuk di mutasi → lunas + semua efeknya |
| POST 🔒 | `/admin/payments/:id/reject` | `{ reason }` → user diminta upload ulang |
| GET/POST 🔒 | `/admin/payment-methods` | kelola QRIS (`type: "QRIS", label, accountName, qrImageUrl`) & rekening (`type: "BANK_TRANSFER", label, bankName, accountNumber, accountName`) |
| PATCH/DELETE 🔒 | `/admin/payment-methods/:id` | ubah / nonaktifkan |
| GET 🔒 | `/admin/consultations?status=&page=` | semua konsultasi |
| GET 🔒 | `/admin/engagements?status=&page=` | semua kontrak pendampingan |

Web admin: login biasa lewat `POST /auth/login` dengan akun ADMIN, lalu kirim token di header. Isi `CORS_ORIGINS` dengan alamat web admin (mis. `https://admin-dubidu.vercel.app`).
