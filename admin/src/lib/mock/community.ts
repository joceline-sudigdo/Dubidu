import "server-only";

import type { CommunityPost, ContentReport, Review } from "@/types/community";

// postingan publik komunitas (dari src/data/parent.ts di aplikasi), tanpa foto anak
export const mockPosts: CommunityPost[] = [
  {
    id: "p0",
    authorId: "u_laras",
    authorName: "Laras Setiawati",
    authorRole: "Orang Tua",
    topic: "ADHD",
    text: "Bunda-bunda, mau berbagi tips pojok tenang di rumah. Kami pakai tenda kecil + lampu redup, anak jadi lebih cepat tenang setelah sekolah.",
    photoCount: 0,
    likeCount: 48,
    comments: [
      { id: "c1", authorName: "Rahma Aulia", authorRole: "Orang Tua", text: "Terima kasih tipsnya Bu, langsung saya coba minggu ini 🙏", status: "VISIBLE", createdAt: "2026-10-31T06:15:00.000Z" },
      { id: "c2", authorName: "Pras Karunia, S.Pd", authorRole: "Shadow Teacher", text: "Setuju! Pojok tenang sangat membantu murid saya juga.", status: "VISIBLE", createdAt: "2026-10-31T06:30:00.000Z" },
    ],
    status: "VISIBLE",
    hiddenReason: null,
    reportCount: 0,
    createdAt: "2026-10-31T05:00:00.000Z",
  },
  {
    id: "p-teacher",
    authorId: "u_pras",
    authorName: "Pras Karunia, S.Pd",
    authorRole: "Shadow Teacher",
    topic: "Autism",
    text: "Hari ini murid saya berhasil antre di kantin tanpa bantuan untuk pertama kalinya. Social story yang kami latih seminggu akhirnya berhasil!",
    photoCount: 1,
    likeCount: 112,
    comments: [
      { id: "c3", authorName: "Sarah Wijaya", authorRole: "Orang Tua", text: "Makasih Kak Pras, anak saya cerita senang banget hari ini 🥰", status: "VISIBLE", createdAt: "2026-10-31T03:00:00.000Z" },
    ],
    status: "VISIBLE",
    hiddenReason: null,
    reportCount: 0,
    createdAt: "2026-10-31T01:00:00.000Z",
  },
  {
    id: "p-promo",
    authorId: "u_alvin",
    authorName: "Alvin Pratama",
    authorRole: "Orang Tua",
    topic: "Speech Delay",
    text: "Terapi wicara murah meriah, hubungi WA 08xx-xxxx-xxxx. Dijamin anak langsung lancar bicara dalam 2 minggu!!!",
    photoCount: 0,
    likeCount: 2,
    comments: [
      { id: "c8", authorName: "Wulan Anggita", authorRole: "Orang Tua", text: "Ini promosi ya? Klaimnya berlebihan.", status: "VISIBLE", createdAt: "2026-10-30T11:00:00.000Z" },
    ],
    status: "VISIBLE",
    hiddenReason: null,
    reportCount: 3,
    createdAt: "2026-10-30T10:00:00.000Z",
  },
  {
    id: "p3",
    authorId: "u_ratna",
    authorName: "Ratna Sari",
    authorRole: "Orang Tua",
    topic: "ADHD",
    text: "Anak saya susah fokus mengerjakan PR lebih dari 5 menit. Ada saran dari para pendamping?",
    photoCount: 0,
    likeCount: 15,
    comments: [
      { id: "c7", authorName: "Nielsen Dave, S.Pd", authorRole: "Shadow Teacher", text: "Coba timer visual 10 menit + jeda gerak 2 menit, Bun.", status: "VISIBLE", createdAt: "2026-10-30T09:00:00.000Z" },
      { id: "c9", authorName: "Anonim", authorRole: "Orang Tua", text: "Anak kayak gitu mah salah didikan orang tuanya.", status: "VISIBLE", createdAt: "2026-10-30T09:30:00.000Z" },
    ],
    status: "VISIBLE",
    hiddenReason: null,
    reportCount: 1,
    createdAt: "2026-10-30T05:00:00.000Z",
  },
];

export const mockReviews: Review[] = [
  { id: "rv_01", authorName: "Sarah Wijaya", targetUserId: "u_pras", targetName: "Pras Karunia, S.Pd", targetRole: "TEACHER", rating: 5, comment: "Sabar sekali dan laporannya detail. Anak jadi lebih fokus di kelas.", status: "VISIBLE", hiddenReason: null, createdAt: "2026-10-29T08:00:00.000Z" },
  { id: "rv_02", authorName: "Devi Anggraini", targetUserId: "u_nielsen", targetName: "Nielsen Dave, S.Pd", targetRole: "TEACHER", rating: 5, comment: "Komunikatif, tepat waktu, anak nyaman.", status: "VISIBLE", hiddenReason: null, createdAt: "2026-10-27T08:00:00.000Z" },
  { id: "rv_03", authorName: "Rini Hartati", targetUserId: "u_kevin", targetName: "Kevin Aditya, S.Psi", targetRole: "TEACHER", rating: 1, comment: "Teacher ini bodoh dan tidak becus, jangan dipilih!!! Nomor HP-nya 0813xxxxxxx", status: "VISIBLE", hiddenReason: null, createdAt: "2026-10-25T08:00:00.000Z" },
  { id: "rv_04", authorName: "Rahma Aulia", targetUserId: "u_amanda", targetName: "Amanda Putri, M.Psi.", targetRole: "PSYCHOLOGIST", rating: 5, comment: "Penjelasannya mudah dipahami dan rekomendasinya bisa langsung dipraktikkan.", status: "VISIBLE", hiddenReason: null, createdAt: "2026-10-24T08:00:00.000Z" },
  { id: "rv_05", authorName: "Wulan Anggita", targetUserId: "u_larasati", targetName: "Larasati Sudigdo, S.Psi", targetRole: "TEACHER", rating: 4, comment: null, status: "VISIBLE", hiddenReason: null, createdAt: "2026-10-20T08:00:00.000Z" },
];

export const mockReports: ContentReport[] = [
  { id: "rp_01", targetType: "POST", targetId: "p-promo", targetLabel: "Terapi wicara murah meriah, hubungi WA…", targetUserId: "u_alvin", targetUserName: "Alvin Pratama", reporterName: "Wulan Anggita", reason: "Spam / promosi", detail: "Promosi jasa di luar Dubidu dengan klaim menyesatkan.", status: "OPEN", resolution: null, handledByName: null, handledAt: null, createdAt: "2026-10-30T11:05:00.000Z" },
  { id: "rp_02", targetType: "COMMENT", targetId: "c9", targetLabel: "Anak kayak gitu mah salah didikan orang tuanya.", targetUserId: null, targetUserName: "Anonim", reporterName: "Ratna Sari", reason: "Ujaran merendahkan", detail: null, status: "OPEN", resolution: null, handledByName: null, handledAt: null, createdAt: "2026-10-30T09:40:00.000Z" },
  { id: "rp_03", targetType: "CONVERSATION", targetId: "conv_kevin_rini", targetLabel: "Percakapan Kevin Aditya ↔ Rini Hartati", targetUserId: "u_kevin", targetUserName: "Kevin Aditya, S.Psi", reporterName: "Rini Hartati", reason: "Meminta pembayaran di luar aplikasi", detail: "Teacher meminta transfer langsung ke rekening pribadi.", status: "OPEN", resolution: null, handledByName: null, handledAt: null, createdAt: "2026-10-29T12:00:00.000Z" },
  { id: "rp_04", targetType: "USER", targetId: "u_alvin", targetLabel: "Alvin Pratama", targetUserId: "u_alvin", targetUserName: "Alvin Pratama", reporterName: "Laras Setiawati", reason: "Membagikan foto anak lain tanpa izin", detail: null, status: "RESOLVED", resolution: "Akun dinonaktifkan sementara.", handledByName: "Admin Dubidu", handledAt: "2026-10-26T04:00:00.000Z", createdAt: "2026-10-25T10:00:00.000Z" },
];

// pilihan alasan laporan (sama dengan aplikasi)
export const HIDE_REASONS = ["Spam / promosi", "Ujaran kebencian / merendahkan", "Membagikan data pribadi", "Informasi medis menyesatkan", "Konten tidak pantas"];
