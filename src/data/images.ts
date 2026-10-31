/**
 * DAFTAR FOTO YANG BISA DIGANTI
 *
 * Cara ganti:
 * 1. Taruh file foto di folder assets, misal: assets/images/people/devi.jpg
 * 2. Ganti `null` di bawah dengan require(...) ke file tersebut, contoh:
 *      'Devi Anggraini': require('@/assets/images/people/devi.jpg'),
 * 3. Simpan. Selama masih `null`, aplikasi pakai avatar inisial / placeholder.
 *
 * Nama di kiri harus sama dengan nama orangnya (gelar setelah koma boleh diabaikan).
 */

type Photo = number | null;

// ===== foto profil orang =====
export const personPhotos: Record<string, Photo> = {
  // orang tua (akun yang login)
  "Devi Anggraini": null,

  // shadow teacher (akun yang login)
  "Pras Karunia": null,

  // shadow teacher yang dilihat orang tua
  "Nielsen Dave": null,
  "Larasati Sudigdo": null,
  "Sarah Aulia": null,
  "Sarah Putri": null,
  "Rina Kartika": null,
  "Dimas Prasetyo": null,
  "Nadia Putri": null,
  "Bayu Saputra": null,
  "Citra Maharani": null,
  "Citra Sari": null,
  "Kevin Aditya": null,
  "Maya Lestari": null,
  "Fajar Nugroho": null,
  "Intan Permata": null,
  "Galih Ramadhan": null,
  "Wulan Sari": null,

  // psikolog
  "Amanda Putri": null,
  "Dimas Wicaksono": null,
  "dr. Reni Anggraini": require("@/assets/images/images/reni.jpg"),
  "dr. Farhan Alatas": null,

  // orang yang muncul di sisi psikolog
  "Kak Ayas": null,
  "Dimas Saputra": null,
  "Rizky Ananda": null,
  "Kirana Wulan": null,
  "Fitri Handayani": null,
  "Lia Kartika": null,

  // anak milik orang tua (untuk teacher, anak selalu pakai gambar beruang)
  "Elisya Effriani": null,
  "Cheryl Anindita": null,
  "Kiyoko Hana": null,

  // orang tua yang muncul di sisi teacher, ulasan, dan komunitas
  "Sarah Wijaya": null,
  "Laras Setiawati": null,
  "Rini Hartati": null,
  "Saras Elizabeth": null,
  "Larasita Hadi": null,
  "Alvin Pratama": null,
  "Rahma Aulia": null,
  "Wulan Anggita": null,
  "Ratna Sari": null,
};

// ===== banner di beranda =====
export const bannerPhotos: { parentHome: Photo; teacherHome: Photo } = {
  parentHome: require("@/assets/images/images/parent-hero.jpg"), // foto ibu & anak belajar
  teacherHome: require("@/assets/images/images/teacher-hero.jpeg"), // foto anak-anak bermain puzzle
};

// ===== foto postingan komunitas (key = id postingan di data/parent.ts) =====
export const communityPhotos: Record<string, Photo[]> = {
  p2: [null, null, null],
  "p-teacher": [null],
  p3: [null],
};

// ===== dokumentasi sesi di laporan =====
export const reportPhotos: Photo[] = [null, null];

// ===== gambar hadiah di Doobie Rewards > Tukar Hadiah (key = id hadiah di data/rewards.ts) =====
// kosong (null) = pakai ikon bawaan
export const rewardPhotos: Record<string, Photo> = {
  // hadiah orang tua
  "r-kopi": null, // Voucher Kopi Rp25rb
  "r-belanja": null, // Voucher Belanja Rp50rb
  "r-cashback": null, // Cashback Sesi 10%
  "r-terapi": null, // Diskon Terapi 20%
  "r-mainan": null, // Paket Mainan Edukatif
  "r-psikolog": null, // Psikolog GRATIS

  // hadiah teacher
  "tr-kopi": null, // Voucher Kopi Rp25rb
  "tr-fee": null, // Potongan Biaya Platform
  "tr-boost": null, // Boost Profil 7 Hari
  "tr-kelas": null, // Kelas Sertifikasi 30%
  "tr-alat": null, // Paket Alat Peraga
  "tr-konsul": null, // Supervisi Psikolog
};

const normalize = (name: string) => name.split(",")[0].trim().toLowerCase();

// cari foto berdasarkan nama, nama depan saja juga bisa (misal "Larasati")
export function photoFor(name: string): number | undefined {
  const target = normalize(name);
  const keys = Object.keys(personPhotos);
  const exact = keys.find((k) => normalize(k) === target);
  const key =
    exact ??
    (!target.includes(" ")
      ? keys.find((k) => normalize(k).split(" ")[0] === target)
      : undefined);
  return (key && personPhotos[key]) || undefined;
}
