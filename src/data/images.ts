/**
 * DAFTAR FOTO YANG BISA DIGANTI
 *
 * Foto profil memakai versi crop persegi di assets/images/avatars/<nama-orang>.jpg (wajah di tengah),
 * supaya kepala tidak terpotong dalam lingkaran avatar. Foto asli ukuran penuh ada di
 * assets/images/avatars/_source/ dengan nama yang sama (dipakai kalau perlu crop ulang).
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
  "Devi Anggraini": require("@/assets/images/avatars/devi-anggraini.jpg"),

  // shadow teacher (akun yang login)
  "Pras Karunia": require("@/assets/images/avatars/prasetyo-wibowo.jpg"),
  "Prasetyo Wibowo": require("@/assets/images/avatars/prasetyo-wibowo.jpg"),

  // shadow teacher yang dilihat orang tua
  "Nielsen Dave": require("@/assets/images/avatars/nielsen-dave.jpg"),
  "Larasati Sudigdo": require("@/assets/images/avatars/larasati-sudigdo.jpg"),
  "Ayas Sudigdo": require("@/assets/images/avatars/ayas-sudigdo.jpg"),
  "Sarah Aulia": require("@/assets/images/avatars/sarah-aulia.jpg"),
  "Sarah Putri": require("@/assets/images/avatars/sarah-putri.jpg"),
  "Rina Kartika": require("@/assets/images/avatars/rina-kartika.jpg"),
  "Dimas Prasetyo": require("@/assets/images/avatars/dimas-prasetyo.jpg"),
  "Nadia Putri": require("@/assets/images/avatars/sarah-putri.jpg"),
  "Bayu Saputra": require("@/assets/images/avatars/bayu-saputra.jpg"),
  // nama teacher Bayu di data server
  "Bayu Prakoso": require("@/assets/images/avatars/bayu-saputra.jpg"),
  "Citra Maharani": require("@/assets/images/avatars/citra-maharani.jpg"),
  "Citra Sari": require("@/assets/images/avatars/citra-sari.jpg"),
  "Kevin Aditya": require("@/assets/images/avatars/kevin-aditya.jpg"),
  "Maya Lestari": require("@/assets/images/avatars/maya-lestari.jpg"),
  "Fajar Nugroho": require("@/assets/images/avatars/fajar-nugroho.jpg"),
  "Intan Permata": require("@/assets/images/avatars/intan-permata.jpg"),
  "Galih Ramadhan": require("@/assets/images/avatars/galih-ramadhan.jpg"),
  "Wulan Sari": require("@/assets/images/avatars/wulan-sari.jpg"),

  // psikolog
  "Amanda Putri": require("@/assets/images/avatars/amanda-putri.jpg"),
  "Dimas Wicaksono": require("@/assets/images/avatars/dimas-wicaksono.jpg"),
  "dr. Reni Anggraini": require("@/assets/images/avatars/reni-anggraini.jpg"),
  "dr. Farhan Alatas": null,

  // orang yang muncul di sisi psikolog
  "Kak Ayas": require("@/assets/images/avatars/ayas-sudigdo.jpg"),
  "Dimas Saputra": null,
  "Rizky Ananda": null,
  "Kirana Wulan": require("@/assets/images/avatars/kirana-wulan.jpg"),
  "Fitri Handayani": null,
  "Lia Kartika": null,

  // anak milik orang tua (untuk teacher, anak selalu pakai gambar beruang)
  "Elisya Effriani": null,
  "Cheryl Anindita": null,
  "Kiyoko Hana": null,

  // orang tua yang muncul di sisi teacher, ulasan, dan komunitas
  "Sarah Wijaya": require("@/assets/images/avatars/sarah-wijaya.jpg"),
  "Laras Setiawati": null,
  "Rini Hartati": require("@/assets/images/avatars/rini-hartati.jpg"),
  "Saras Elizabeth": require("@/assets/images/avatars/saras-elizabeth.jpg"),
  "Larasita Hadi": require("@/assets/images/avatars/larasita-hadi.jpg"),
  "Alvin Pratama": require("@/assets/images/avatars/alvin-pratama.jpg"),
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

// ===== foto profil yang diunggah pengguna sendiri (dari server: avatarUrl) =====
// diisi saat data komunitas, matching, dan akun dimuat; dipakai Avatar sebelum foto contoh di atas
const remotePhotos: Record<string, string> = {};

export function rememberPhoto(name: string | null | undefined, url: string | null | undefined) {
  if (name && url) remotePhotos[normalize(name)] = url;
}

export function remotePhotoFor(name: string): string | undefined {
  return remotePhotos[normalize(name)];
}

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
