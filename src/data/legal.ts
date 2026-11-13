// isi Syarat & Ketentuan dan Kebijakan Privasi (versi ringkas untuk prototipe)
export type LegalType = 'terms' | 'privacy';

export const legalDocs: Record<LegalType, { title: string; updated: string; sections: { h: string; p: string }[] }> = {
  terms: {
    title: 'Syarat & Ketentuan',
    updated: 'Terakhir diperbarui 1 November 2026',
    sections: [
      {
        h: '1. Tentang Dubidu',
        p: 'Dubidu adalah platform yang mempertemukan orang tua dengan shadow teacher dan psikolog mitra untuk mendampingi anak berkebutuhan khusus. Dubidu bukan penyedia layanan medis dan tidak menggantikan diagnosis profesional.',
      },
      {
        h: '2. Akun pengguna',
        p: 'Kamu wajib memberikan data yang benar saat mendaftar dan menjaga kerahasiaan kata sandi. Satu akun hanya untuk satu orang. Dubidu berhak menangguhkan akun yang melanggar ketentuan.',
      },
      {
        h: '3. Verifikasi pendamping',
        p: 'Shadow teacher dan psikolog melalui verifikasi dokumen identitas, pendidikan, dan sertifikasi. Meski begitu, orang tua tetap disarankan melakukan sesi trial sebelum kontrak dimulai.',
      },
      {
        h: '4. Pembayaran & kontrak',
        p: 'Pembayaran kontrak disimpan di rekening bersama (escrow) dan dicairkan ke shadow teacher per termin setelah laporan sesi diterima. Biaya platform 10% (5% untuk pengguna Plus) dipotong dari setiap pencairan.',
      },
      {
        h: '5. Dubidu Plus',
        p: 'Langganan Plus diperpanjang otomatis sesuai paket (bulanan/tahunan) dan bisa dihentikan kapan saja dari menu Dubidu Plus. Biaya yang sudah dibayar tidak dapat dikembalikan untuk periode berjalan.',
      },
      {
        h: '6. Ikan & hadiah',
        p: 'Ikan adalah poin loyalitas yang tidak dapat diuangkan. Voucher hasil penukaran berlaku 30 hari dan tunduk pada ketentuan mitra penyedia hadiah.',
      },
      {
        h: '7. Perilaku di komunitas',
        p: 'Dilarang membagikan foto atau data anak lain tanpa izin, ujaran kebencian, promosi tanpa izin, dan informasi medis yang menyesatkan. Postingan yang melanggar dapat dihapus.',
      },
      {
        h: '8. Pelanggaran & pencabutan penugasan shadow teacher',
        p: 'Shadow teacher dilarang melakukan kekerasan fisik maupun verbal, perundungan, pelecehan, hukuman yang merendahkan, atau tindakan tidak wajar lainnya terhadap anak. Dubidu dan lembaga tempat pendampingan (sekolah atau pusat terapi) berhak memberi peringatan, menghentikan sementara, atau mencabut penugasan shadow teacher secara langsung bila pelanggaran terbukti dari laporan orang tua, lembaga, atau hasil pemeriksaan tim Dubidu. Pencabutan dapat disertai penonaktifan akun, penahanan dana termin yang sedang berjalan, dan pelaporan ke pihak berwenang. Riwayat pelanggaran dicatat dan dipakai dalam verifikasi, sehingga shadow teacher yang melanggar tidak dapat menerima penugasan baru.',
      },
    ],
  },
  privacy: {
    title: 'Kebijakan Privasi',
    updated: 'Terakhir diperbarui 1 November 2026',
    sections: [
      {
        h: 'Data yang kami kumpulkan',
        p: 'Nama, kontak, domisili, foto KTP untuk verifikasi, profil dan kondisi anak, rekam medis yang kamu unggah (opsional), riwayat chat, laporan sesi, dan data transaksi.',
      },
      {
        h: 'Untuk apa data dipakai',
        p: 'Mencocokkan anak dengan pendamping yang tepat, menampilkan report card, memproses pembayaran, menjaga keamanan akun, dan meningkatkan layanan. Kami tidak menjual data kamu.',
      },
      {
        h: 'Siapa yang bisa melihat',
        p: 'Profil kebutuhan anak hanya ditampilkan sebagai inisial kepada shadow teacher sampai kamu menyetujui koneksi. Rekam medis hanya bisa dibuka oleh psikolog atau teacher yang kamu izinkan.',
      },
      {
        h: 'Keamanan',
        p: 'Data dienkripsi saat dikirim dan disimpan. Akses internal dibatasi hanya untuk tim yang membutuhkan, misalnya tim verifikasi dan dukungan pelanggan.',
      },
      {
        h: 'Hak kamu',
        p: 'Kamu bisa mengubah data profil, mengunduh laporan, menonaktifkan notifikasi, dan meminta penghapusan akun kapan saja dari menu Pengaturan.',
      },
    ],
  },
};

// Syarat & Ketentuan khusus shadow teacher: wajib dibaca sampai akhir sebelum mendaftar
// (dibuka di /daftar-teacher/syarat dan /legal/teacher)
export const teacherTerms = {
  title: 'Syarat & Ketentuan Shadow Teacher',
  updated: 'Terakhir diperbarui 14 November 2026',
  intro:
    'Shadow teacher mendampingi anak berkebutuhan khusus yang rentan. Karena itu, sebelum mendaftar kamu wajib membaca dan menyetujui ketentuan berikut.',
  sections: [
    {
      h: '1. Kode etik pendampingan',
      p: 'Mendampingi anak dengan sabar, hangat, dan menghormati martabatnya. Mengikuti arahan orang tua, guru kelas, dan psikolog mitra, serta menjaga sikap profesional selama di sekolah, rumah, maupun di chat.',
    },
    {
      h: '2. Larangan',
      p: 'Dilarang: (a) kekerasan fisik maupun verbal, membentak, mengancam, atau mempermalukan anak; (b) hukuman fisik, mengikat, mengurung, atau menahan makan/minum; (c) pelecehan dalam bentuk apa pun; (d) tindakan tidak wajar atau di luar rencana pendampingan tanpa persetujuan orang tua; (e) memotret, merekam, atau membagikan data dan kondisi anak di luar Dubidu; (f) meminta pembayaran di luar aplikasi; (g) bertugas di bawah pengaruh alkohol atau obat terlarang.',
    },
    {
      h: '3. Hak Dubidu dan lembaga untuk memberhentikan',
      p: 'Dubidu dan lembaga tempat pendampingan (sekolah, pusat terapi, atau institusi mitra) berhak memberi peringatan, menghentikan sementara, atau mencabut penugasan shadow teacher secara langsung, tanpa menunggu kontrak selesai, bila shadow teacher terbukti melanggar ketentuan ini. Lembaga dapat menyampaikan laporan dan permintaan pencabutan kepada Dubidu, dan Dubidu menindaklanjutinya.',
    },
    {
      h: '4. Proses laporan & peringatan',
      p: 'Laporan dapat datang dari orang tua, lembaga, psikolog mitra, atau tim Dubidu. Untuk pelanggaran ringan diberikan peringatan tertulis lewat aplikasi. Untuk pelanggaran berat atau yang membahayakan anak, penugasan langsung dihentikan sementara selama pemeriksaan, dan shadow teacher diberi kesempatan menyampaikan klarifikasi.',
    },
    {
      h: '5. Sanksi',
      p: 'Bila terbukti bersalah: penugasan dicabut, akun dinonaktifkan, dana termin yang sedang berjalan dapat ditahan untuk penyelesaian dengan orang tua, dan pelanggaran yang termasuk tindak pidana dilaporkan ke pihak berwenang. Riwayat pelanggaran dicatat dalam verifikasi, sehingga shadow teacher yang melanggar tidak dapat menerima penugasan baru di Dubidu.',
    },
    {
      h: '6. Verifikasi & kerahasiaan',
      p: 'Kamu bersedia diverifikasi (identitas, ijazah, sertifikat, referensi, dan wawancara dengan psikolog mitra) serta menjaga kerahasiaan kondisi, foto, dan laporan anak selama dan setelah masa pendampingan.',
    },
    {
      h: '7. Laporan sesi & pembayaran',
      p: 'Kamu wajib mengisi laporan harian setiap selesai sesi. Pembayaran dari orang tua ditahan Dubidu dan dicairkan per termin setelah sesi & laporan selesai, dipotong biaya platform 10% (5% untuk pengguna Plus).',
    },
  ],
};
