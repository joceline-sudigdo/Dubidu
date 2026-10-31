// template jawaban Doobie per topik (ganti isinya dengan data final nanti)
import type { PlusRole } from './plus';

export type DoobieTopic = {
  id: string;
  // label chip di kartu Doobie & di chat
  label: string;
  // pertanyaan yang tampil sebagai pesan user saat topik dipilih
  question: string;
  // jawaban Doobie, tiap item = satu gelembung chat
  answer: string[];
};

export const doobieTopics: Record<PlusRole, DoobieTopic[]> = {
  parent: [
    {
      id: 'progress',
      label: 'Pantau progress anak',
      question: 'Doobie, gimana cara memantau progress anakku?',
      answer: [
        'Siap! Progress si kecil bisa dipantau dari menu Jadwal → pilih tanggal sesi untuk membuka Report Card harian dari shadow teacher. 📋',
        'Di Report Card ada skor fokus, sosial, dan sensori, catatan teacher, serta tips untuk di rumah. Ketuk "Lihat Growth Timeline Lengkap" untuk melihat grafik perkembangan dari minggu ke minggu.',
        'Tips Doobie: baca catatan teacher bersama pasangan setiap akhir pekan, lalu pilih satu tips untuk dicoba di rumah. Konsisten kecil-kecilan lebih ampuh daripada banyak sekaligus! 💙',
      ],
    },
    {
      id: 'tumbuh-kembang',
      label: 'Tumbuh Kembang',
      question: 'Apa saja tanda tumbuh kembang yang perlu aku perhatikan?',
      answer: [
        'Setiap anak punya tempo masing-masing, jadi bandingkan si kecil dengan dirinya sendiri, bukan dengan anak lain ya. 🌱',
        'Hal yang baik dipantau: kemampuan bicara & memahami instruksi, kontak mata dan interaksi dengan teman, fokus saat bermain, serta reaksi terhadap suara atau sentuhan.',
        'Kalau ada kemampuan yang mundur atau kamu merasa khawatir, catat contohnya lalu diskusikan dengan psikolog mitra. Deteksi lebih awal membuat pendampingan lebih tepat sasaran.',
      ],
    },
    {
      id: 'konsultasi',
      label: 'Konsultasi',
      question: 'Kapan sebaiknya aku konsultasi ke psikolog?',
      answer: [
        'Konsultasi bagus dilakukan saat kamu butuh kepastian kondisi anak, sebelum memilih shadow teacher, atau saat ada perubahan perilaku yang bikin khawatir. 🩺',
        'Caranya: Beranda → Konsultasi Psikolog → pilih psikolog → atur jadwal & jenis sesi (video, chat, atau tatap muka) → bayar lewat QRIS/VA.',
        'Pengguna Dubidu Plus dapat diskon konsultasi 20%. Siapkan catatan perilaku dan rekam medis (kalau ada) supaya sesi lebih efektif ya!',
      ],
    },
  ],
  teacher: [
    {
      id: 'laporan',
      label: 'Laporan harian',
      question: 'Doobie, bagaimana cara menulis laporan harian yang baik?',
      answer: [
        'Laporan yang baik itu spesifik dan bisa ditindaklanjuti orang tua. ✍️',
        'Gunakan pola: (1) apa yang terjadi, misalnya "fokus 25 menit saat puzzle kata"; (2) pemicu atau konteksnya; (3) strategi yang kamu pakai; (4) satu tips untuk di rumah.',
        'Isi laporan di menu Riwayat → pilih anak → Isi Laporan, paling lambat 2 jam setelah sesi. Laporan tepat waktu juga memberi kamu ikan tambahan! 🐟',
      ],
    },
    {
      id: 'jadwal',
      label: 'Jadwal sesi',
      question: 'Bagaimana cara mengatur jadwal sesi?',
      answer: [
        'Semua sesi kamu ada di tab Jadwal, lengkap dengan lokasi dan nama anak. 📅',
        'Untuk sesi trial, kirim usulan jadwal lewat chat dengan orang tua. Orang tua bisa menyetujui atau mengusulkan jadwal lain langsung dari kartu jadwal.',
        'Tips: atur ketersediaan di Profil → Harga & Ketersediaan supaya orang tua hanya mengajukan jam yang memang kosong.',
      ],
    },
    {
      id: 'tips',
      label: 'Tips pendampingan',
      question: 'Ada tips pendampingan untuk anak yang sensitif suara?',
      answer: [
        'Tentu! Untuk anak yang sensitif suara, persiapan transisi itu kuncinya. 🎧',
        'Beri tahu 5 menit sebelum bel atau aktivitas ramai, sediakan headphone peredam, dan siapkan pojok tenang. Teknik deep pressure dan napas perut 40 detik bisa membantu saat anak mulai gelisah.',
        'Catat pemicu yang kamu temukan di laporan harian supaya orang tua bisa melakukan strategi yang sama di rumah.',
      ],
    },
  ],
};

// jawaban saat user mengetik bebas (belum ada AI, jadi arahkan ke topik)
export const doobieFallback = [
  'Terima kasih sudah bertanya! Doobie masih belajar menjawab pertanyaan bebas. 🐻',
  'Sementara ini, pilih salah satu topik di bawah ya, Doobie siap bantu jelaskan.',
];

// jawaban dummy untuk voice note
export const doobieVoiceReply = [
  'Doobie sudah dengar voice note kamu! 🎧',
  'Fitur jawaban suara masih disiapkan. Untuk sekarang, coba pilih salah satu topik di bawah supaya Doobie bisa bantu lebih tepat.',
];
