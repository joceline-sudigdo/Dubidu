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
