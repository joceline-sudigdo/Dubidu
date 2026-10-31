import "server-only";

import type {
  AppSettings,
  DoobieTopic,
  Faq,
  LegalDoc,
  Mission,
  PlusPlan,
  PromoCode,
  Redemption,
  Reward,
  RewardLevel,
} from "@/types/content";

// isi awal = salinan data aplikasi (src/data/legal.ts, bantuan.tsx, doobie.ts, rewards.ts, plus.ts)

export const mockLegal: LegalDoc[] = [
  {
    type: "terms",
    title: "Syarat & Ketentuan",
    version: 1,
    updatedAt: "2026-11-01T00:00:00.000Z",
    updatedByName: null,
    sections: [
      { h: "1. Tentang Dubidu", p: "Dubidu adalah platform yang mempertemukan orang tua dengan shadow teacher dan psikolog mitra untuk mendampingi anak berkebutuhan khusus. Dubidu bukan penyedia layanan medis dan tidak menggantikan diagnosis profesional." },
      { h: "2. Akun pengguna", p: "Kamu wajib memberikan data yang benar saat mendaftar dan menjaga kerahasiaan kata sandi. Satu akun hanya untuk satu orang. Dubidu berhak menangguhkan akun yang melanggar ketentuan." },
      { h: "3. Verifikasi pendamping", p: "Shadow teacher dan psikolog melalui verifikasi dokumen identitas, pendidikan, dan sertifikasi. Meski begitu, orang tua tetap disarankan melakukan sesi trial sebelum kontrak dimulai." },
      { h: "4. Pembayaran & kontrak", p: "Pembayaran kontrak disimpan di rekening bersama (escrow) dan dicairkan ke shadow teacher per termin setelah laporan sesi diterima. Biaya platform 10% (5% untuk pengguna Plus) dipotong dari setiap pencairan." },
      { h: "5. Dubidu Plus", p: "Langganan Plus diperpanjang otomatis sesuai paket (bulanan/tahunan) dan bisa dihentikan kapan saja dari menu Dubidu Plus. Biaya yang sudah dibayar tidak dapat dikembalikan untuk periode berjalan." },
      { h: "6. Ikan & hadiah", p: "Ikan adalah poin loyalitas yang tidak dapat diuangkan. Voucher hasil penukaran berlaku 30 hari dan tunduk pada ketentuan mitra penyedia hadiah." },
      { h: "7. Perilaku di komunitas", p: "Dilarang membagikan foto atau data anak lain tanpa izin, ujaran kebencian, promosi tanpa izin, dan informasi medis yang menyesatkan. Postingan yang melanggar dapat dihapus." },
    ],
  },
  {
    type: "privacy",
    title: "Kebijakan Privasi",
    version: 1,
    updatedAt: "2026-11-01T00:00:00.000Z",
    updatedByName: null,
    sections: [
      { h: "Data yang kami kumpulkan", p: "Nama, kontak, domisili, foto KTP untuk verifikasi, profil dan kondisi anak, rekam medis yang kamu unggah (opsional), riwayat chat, laporan sesi, dan data transaksi." },
      { h: "Untuk apa data dipakai", p: "Mencocokkan anak dengan pendamping yang tepat, menampilkan report card, memproses pembayaran, menjaga keamanan akun, dan meningkatkan layanan. Kami tidak menjual data kamu." },
      { h: "Siapa yang bisa melihat", p: "Profil kebutuhan anak hanya ditampilkan sebagai inisial kepada shadow teacher sampai kamu menyetujui koneksi. Rekam medis hanya bisa dibuka oleh psikolog atau teacher yang kamu izinkan." },
      { h: "Keamanan", p: "Data dienkripsi saat dikirim dan disimpan. Akses internal dibatasi hanya untuk tim yang membutuhkan, misalnya tim verifikasi dan dukungan pelanggan." },
      { h: "Hak kamu", p: "Kamu bisa mengubah data profil, mengunduh laporan, menonaktifkan notifikasi, dan meminta penghapusan akun kapan saja dari menu Pengaturan." },
    ],
  },
];

export const mockFaqs: Faq[] = [
  { id: "faq_1", category: "Matching", order: 1, published: true, question: "Bagaimana sistem matching bekerja?", answer: "Dubidu mencocokkan kebutuhan anak dengan keahlian shadow teacher, lalu mempertimbangkan rating dan lokasi. Kamu akan melihat 5 kandidat paling cocok setiap hari." },
  { id: "faq_2", category: "Keamanan", order: 2, published: true, question: "Apakah shadow teacher sudah terverifikasi?", answer: "Ya. Setiap teacher melewati verifikasi identitas, sertifikat, dan observasi sebelum bisa menerima pendampingan." },
  { id: "faq_3", category: "Pembayaran", order: 3, published: true, question: "Bagaimana pembayaran dilakukan?", answer: "Orang tua membayar per termin. Dana ditahan aman oleh Dubidu dan baru dicairkan ke teacher setelah sesi dan laporan selesai." },
  { id: "faq_4", category: "Kontrak", order: 4, published: true, question: "Bisakah saya mengganti teacher?", answer: "Bisa. Hubungi tim Dubidu lewat chat bantuan, kami bantu proses penggantian dan penyesuaian kontrak." },
  { id: "faq_5", category: "Matching", order: 5, published: true, question: "Kenapa skip dibatasi 5 kali sehari?", answer: "Supaya proses pencocokan lebih bijak. Pengguna Dubidu Plus bisa melihat lebih banyak kandidat tanpa batas." },
];

export const mockDoobieTopics: DoobieTopic[] = [
  { id: "progress", role: "parent", order: 1, label: "Pantau progress anak", question: "Doobie, gimana cara memantau progress anakku?", answer: [
    "Siap! Progress si kecil bisa dipantau dari menu Jadwal → pilih tanggal sesi untuk membuka Report Card harian dari shadow teacher. 📋",
    "Di Report Card ada skor fokus, sosial, dan sensori, catatan teacher, serta tips untuk di rumah. Ketuk \"Lihat Growth Timeline Lengkap\" untuk melihat grafik perkembangan dari minggu ke minggu.",
    "Tips Doobie: baca catatan teacher bersama pasangan setiap akhir pekan, lalu pilih satu tips untuk dicoba di rumah. Konsisten kecil-kecilan lebih ampuh daripada banyak sekaligus! 💙",
  ] },
  { id: "tumbuh-kembang", role: "parent", order: 2, label: "Tumbuh Kembang", question: "Apa saja tanda tumbuh kembang yang perlu aku perhatikan?", answer: [
    "Setiap anak punya tempo masing-masing, jadi bandingkan si kecil dengan dirinya sendiri, bukan dengan anak lain ya. 🌱",
    "Hal yang baik dipantau: kemampuan bicara & memahami instruksi, kontak mata dan interaksi dengan teman, fokus saat bermain, serta reaksi terhadap suara atau sentuhan.",
    "Kalau ada kemampuan yang mundur atau kamu merasa khawatir, catat contohnya lalu diskusikan dengan psikolog mitra. Deteksi lebih awal membuat pendampingan lebih tepat sasaran.",
  ] },
  { id: "konsultasi", role: "parent", order: 3, label: "Konsultasi", question: "Kapan sebaiknya aku konsultasi ke psikolog?", answer: [
    "Konsultasi bagus dilakukan saat kamu butuh kepastian kondisi anak, sebelum memilih shadow teacher, atau saat ada perubahan perilaku yang bikin khawatir. 🩺",
    "Caranya: Beranda → Konsultasi Psikolog → pilih psikolog → atur jadwal & jenis sesi (video, chat, atau tatap muka) → bayar lewat QRIS/VA.",
    "Pengguna Dubidu Plus dapat diskon konsultasi 20%. Siapkan catatan perilaku dan rekam medis (kalau ada) supaya sesi lebih efektif ya!",
  ] },
  { id: "laporan", role: "teacher", order: 1, label: "Laporan harian", question: "Doobie, bagaimana cara menulis laporan harian yang baik?", answer: [
    "Laporan yang baik itu spesifik dan bisa ditindaklanjuti orang tua. ✍️",
    "Gunakan pola: (1) apa yang terjadi; (2) pemicu atau konteksnya; (3) strategi yang kamu pakai; (4) satu tips untuk di rumah.",
    "Isi laporan di menu Riwayat → pilih anak → Isi Laporan, paling lambat 2 jam setelah sesi. Laporan tepat waktu juga memberi kamu ikan tambahan! 🐟",
  ] },
  { id: "jadwal", role: "teacher", order: 2, label: "Jadwal sesi", question: "Bagaimana cara mengatur jadwal sesi?", answer: [
    "Semua sesi kamu ada di tab Jadwal, lengkap dengan lokasi dan nama anak. 📅",
    "Untuk sesi trial, kirim usulan jadwal lewat chat dengan orang tua. Orang tua bisa menyetujui atau mengusulkan jadwal lain langsung dari kartu jadwal.",
    "Tips: atur ketersediaan di Profil → Harga & Ketersediaan supaya orang tua hanya mengajukan jam yang memang kosong.",
  ] },
  { id: "tips", role: "teacher", order: 3, label: "Tips pendampingan", question: "Ada tips pendampingan untuk anak yang sensitif suara?", answer: [
    "Tentu! Untuk anak yang sensitif suara, persiapan transisi itu kuncinya. 🎧",
    "Beri tahu 5 menit sebelum bel atau aktivitas ramai, sediakan headphone peredam, dan siapkan pojok tenang. Teknik deep pressure dan napas perut 40 detik bisa membantu saat anak mulai gelisah.",
    "Catat pemicu yang kamu temukan di laporan harian supaya orang tua bisa melakukan strategi yang sama di rumah.",
  ] },
];

export const mockRewards: Reward[] = [
  { id: "r-kopi", role: "parent", title: "Voucher Kopi Rp25rb", subtitle: "Fore & Kopi Kenangan", cost: 300, category: "Voucher", icon: "coffee", minLevel: null, stock: 120, active: true },
  { id: "r-belanja", role: "parent", title: "Voucher Belanja Rp50rb", subtitle: "Superindo / Alfagift", cost: 600, category: "Voucher", icon: "shopping-bag", minLevel: null, stock: 80, active: true },
  { id: "r-cashback", role: "parent", title: "Cashback Sesi 10%", subtitle: "Sesi shadow teacher", cost: 400, category: "Cashback", icon: "percent", minLevel: null, stock: null, active: true },
  { id: "r-terapi", role: "parent", title: "Diskon Terapi 20%", subtitle: "Wicara & Okupasi", cost: 500, category: "Kesehatan", icon: "activity", minLevel: null, stock: null, active: true },
  { id: "r-mainan", role: "parent", title: "Paket Mainan Edukatif", subtitle: "Kit motorik anak", cost: 900, category: "Voucher", icon: "gift", minLevel: null, stock: 25, active: true },
  { id: "r-psikolog", role: "parent", title: "Psikolog GRATIS", subtitle: "1x Sesi 45 Menit", cost: 2500, category: "Kesehatan", icon: "heart", minLevel: 5, stock: 10, active: true },
  { id: "tr-kopi", role: "teacher", title: "Voucher Kopi Rp25rb", subtitle: "Fore & Kopi Kenangan", cost: 300, category: "Voucher", icon: "coffee", minLevel: null, stock: 120, active: true },
  { id: "tr-fee", role: "teacher", title: "Potongan Biaya Platform", subtitle: "0% untuk 1 termin", cost: 700, category: "Cashback", icon: "percent", minLevel: null, stock: null, active: true },
  { id: "tr-boost", role: "teacher", title: "Boost Profil 7 Hari", subtitle: "Tampil paling atas", cost: 500, category: "Cashback", icon: "trending-up", minLevel: null, stock: null, active: true },
  { id: "tr-kelas", role: "teacher", title: "Kelas Sertifikasi 30%", subtitle: "Pelatihan ABA & PECS", cost: 900, category: "Kesehatan", icon: "award", minLevel: null, stock: 40, active: true },
  { id: "tr-alat", role: "teacher", title: "Paket Alat Peraga", subtitle: "Kartu & media visual", cost: 1200, category: "Voucher", icon: "gift", minLevel: null, stock: 15, active: true },
  { id: "tr-konsul", role: "teacher", title: "Supervisi Psikolog", subtitle: "1x Sesi 45 Menit", cost: 2500, category: "Kesehatan", icon: "heart", minLevel: 5, stock: 10, active: true },
];

export const mockMissions: Mission[] = [
  { id: "m-report", role: "parent", title: "Isi laporan perkembangan", subtitle: "Evaluasi mingguan si kecil", reward: 30, actionLabel: "Klaim", active: true },
  { id: "m-review", role: "parent", title: "Beri ulasan teacher", subtitle: "Review sesi terakhir", reward: 50, actionLabel: "Kerjakan", active: true },
  { id: "m-webinar", role: "parent", title: "Ikut kelas komunitas", subtitle: "Webinar Sensory Play", reward: 40, actionLabel: "Daftar", active: true },
  { id: "m-invite", role: "parent", title: "Ajak teman bergabung", subtitle: "Bagikan kode undangan", reward: 200, actionLabel: "Bagikan", active: true },
  { id: "t-report", role: "teacher", title: "Kirim laporan harian", subtitle: "Sesi hari ini", reward: 40, actionLabel: "Klaim", active: true },
  { id: "t-review", role: "teacher", title: "Balas ulasan orang tua", subtitle: "Ulasan terbaru", reward: 30, actionLabel: "Kerjakan", active: true },
  { id: "t-match", role: "teacher", title: "Ajukan diri ke 1 anak", subtitle: "Bantu anak yang menunggu", reward: 50, actionLabel: "Cari", active: true },
  { id: "t-invite", role: "teacher", title: "Ajak rekan pendamping", subtitle: "Bagikan kode undangan", reward: 200, actionLabel: "Bagikan", active: true },
];

export const mockLevels: RewardLevel[] = [
  { level: 1, name: "Tunas", min: 0, perk: null },
  { level: 2, name: "Mekar", min: 300, perk: null },
  { level: 3, name: "Bersinar", min: 800, perk: null },
  { level: 4, name: "Bintang", min: 2000, perk: "Cashback 15%" },
  { level: 5, name: "Legenda", min: 4000, perk: "Psikolog gratis" },
];

export const mockRedemptions: Redemption[] = [
  { id: "rd_01", rewardId: "r-kopi", rewardTitle: "Voucher Kopi Rp25rb", userName: "Devi Anggraini", role: "parent", code: "DBD-KOPI-3812", cost: 300, status: "ACTIVE", redeemedAt: "2026-10-24T03:00:00.000Z", expiresAt: "2026-11-23T03:00:00.000Z" },
  { id: "rd_02", rewardId: "tr-boost", rewardTitle: "Boost Profil 7 Hari", userName: "Pras Karunia, S.Pd", role: "teacher", code: "DBD-BOOST-2290", cost: 500, status: "USED", redeemedAt: "2026-10-18T03:00:00.000Z", expiresAt: "2026-11-17T03:00:00.000Z" },
  { id: "rd_03", rewardId: "r-belanja", rewardTitle: "Voucher Belanja Rp50rb", userName: "Sarah Wijaya", role: "parent", code: "DBD-BELANJ-7741", cost: 600, status: "ACTIVE", redeemedAt: "2026-10-29T03:00:00.000Z", expiresAt: "2026-11-28T03:00:00.000Z" },
];

export const mockPlans: PlusPlan[] = [
  { role: "parent", key: "bulanan", title: "Bulanan", price: 59000, note: "per bulan", badge: null },
  { role: "parent", key: "tahunan", title: "Tahunan", price: 590000, note: "per tahun · setara Rp49.100/bln", badge: "Hemat 17%" },
  { role: "teacher", key: "bulanan", title: "Bulanan", price: 49000, note: "per bulan", badge: null },
  { role: "teacher", key: "tahunan", title: "Tahunan", price: 490000, note: "per tahun · setara Rp40.800/bln", badge: "Hemat 17%" },
];

export const mockPromos: PromoCode[] = [
  { code: "DUBIDUSAYANG", discountPercent: 10, appliesTo: "CONSULTATION", active: true, usageCount: 37, expiresAt: null },
  { code: "PLUSBARU", discountPercent: 20, appliesTo: "SUBSCRIPTION", active: false, usageCount: 112, expiresAt: "2026-09-30T16:59:00.000Z" },
];

export const mockSettings: AppSettings = {
  platformFeePercent: 10,
  plusPlatformFeePercent: 5,
  payoutFee: 2500,
  minPayout: 50000,
};
