// laporan observasi psikolog yang diterima orang tua (setelah sesi konsultasi selesai)
import type { Tone } from '@/components/parent/tones';

export type AreaStatus = 'baik' | 'berkembang' | 'perhatian';

export const AREA_STATUS: Record<AreaStatus, { label: string; tone: Tone }> = {
  baik: { label: 'Sesuai usia', tone: 'green' },
  berkembang: { label: 'Berkembang', tone: 'blue' },
  perhatian: { label: 'Perlu perhatian', tone: 'yellow' },
};

// jenis rekomendasi menentukan ikon & tombol lanjutan di halaman laporan
export type RecKind = 'rumah' | 'sekolah' | 'teacher' | 'terapi' | 'asesmen';

export type ObservationReport = {
  id: string;
  consultationId?: string;
  psychologist: string;
  psychologistTitle: string;
  chatId?: string; // chat orang tua dengan psikolog
  child: string;
  date: string;
  time: string;
  mode: string;
  duration: string;
  complaint: string;
  summary: string;
  areas: { label: string; status: AreaStatus; note: string }[];
  strengths: string[];
  concerns: string[];
  recommendations: { title: string; detail: string; kind: RecKind }[];
  nextStep: string | null;
};

export const observationReports: ObservationReport[] = [
  {
    id: 'obs-elisya',
    psychologist: 'Amanda Putri, M.Psi.',
    psychologistTitle: 'Psikolog Anak & Sensori',
    chatId: 'amanda',
    child: 'Elisya',
    date: 'Senin, 26 Oktober 2026',
    time: '10:00 – 11:00',
    mode: 'Video call',
    duration: '60 menit',
    complaint:
      'Elisya sudah 8 sesi didampingi shadow teacher. Kami ingin tahu apakah perkembangannya sesuai, dan latihan apa yang bisa dilakukan di rumah.',
    summary:
      'Elisya menunjukkan kemajuan yang baik dalam fokus belajar dan kemandirian. Respons terhadap suara keras masih menjadi pemicu utama, sehingga strategi regulasi sensori perlu dilanjutkan secara konsisten di rumah dan sekolah.',
    areas: [
      { label: 'Fokus & atensi', status: 'berkembang', note: 'Bertahan 20–25 menit dengan timer visual, naik dari 10 menit di awal pendampingan.' },
      { label: 'Komunikasi', status: 'baik', note: 'Mampu menyampaikan kebutuhan dengan kalimat lengkap dan menjawab pertanyaan terbuka.' },
      { label: 'Interaksi sosial', status: 'berkembang', note: 'Mulai melakukan kontak mata spontan dan mau berbagi saat diajak.' },
      { label: 'Regulasi sensori', status: 'perhatian', note: 'Menutup telinga dan gelisah saat bel atau suasana kelas ramai.' },
      { label: 'Kemandirian', status: 'baik', note: 'Mengikuti rutinitas pagi dengan jadwal bergambar tanpa banyak pengingat.' },
    ],
    strengths: ['Inisiatif tinggi saat tugas visual (puzzle, mencocokkan)', 'Senang dipuji, cepat termotivasi', 'Rutinitas pagi sudah mandiri'],
    concerns: ['Transisi mendadak dan suara keras', 'Mudah lelah setelah 2 jam aktivitas kelas'],
    recommendations: [
      { title: 'Lanjutkan shadow teacher', detail: 'Pendampingan 2x seminggu masih dibutuhkan sampai akhir semester, fokus pada regulasi sensori saat transisi.', kind: 'teacher' },
      { title: 'Aba-aba sebelum transisi', detail: 'Beri tahu 5 menit sebelum aktivitas berganti. Gunakan timer visual yang sama di rumah dan sekolah.', kind: 'rumah' },
      { title: 'Pojok tenang di kelas', detail: 'Diskusikan dengan wali kelas: sediakan headphone peredam dan tempat duduk jauh dari pintu.', kind: 'sekolah' },
      { title: 'Terapi okupasi (sensori integrasi)', detail: 'Disarankan 1x seminggu selama 3 bulan untuk membantu toleransi terhadap suara.', kind: 'terapi' },
    ],
    nextStep: 'Konsultasi lanjutan disarankan dalam 6–8 minggu untuk mengevaluasi regulasi sensori.',
  },
  {
    id: 'obs-cheryl',
    psychologist: 'Dimas Wicaksono, S.Psi., Psikolog',
    psychologistTitle: 'Psikolog Perkembangan',
    child: 'Cheryl',
    date: 'Sabtu, 10 Oktober 2026',
    time: '09:00 – 09:45',
    mode: 'Tatap muka',
    duration: '45 menit',
    complaint: 'Cheryl sudah bisa sekitar 40 kata tapi masih jarang menyusun kalimat. Apakah perlu terapi wicara?',
    summary:
      'Kosakata reseptif Cheryl sesuai usia, namun kemampuan menyusun kalimat (ekspresif) masih tertinggal sekitar 6–9 bulan. Kondisi ini masih bisa dikejar dengan stimulasi terarah dan terapi wicara.',
    areas: [
      { label: 'Bahasa reseptif', status: 'baik', note: 'Memahami instruksi dua langkah dan menunjuk gambar dengan tepat.' },
      { label: 'Bahasa ekspresif', status: 'perhatian', note: 'Dominan satu kata, kalimat dua kata muncul sesekali.' },
      { label: 'Interaksi sosial', status: 'baik', note: 'Hangat, mau bermain bergantian dengan pemeriksa.' },
    ],
    strengths: ['Pemahaman bahasa baik', 'Ekspresif lewat gestur dan mimik'],
    concerns: ['Kalimat dua kata belum konsisten'],
    recommendations: [
      { title: 'Terapi wicara', detail: '2x seminggu, fokus pada perluasan kalimat dan artikulasi.', kind: 'terapi' },
      { title: 'Teknik expansion di rumah', detail: 'Saat Cheryl berkata "mobil", jawab dengan "mobil merah besar" untuk memberi contoh kalimat.', kind: 'rumah' },
      { title: 'Asesmen lanjutan', detail: 'Evaluasi ulang kemampuan bahasa 3 bulan lagi.', kind: 'asesmen' },
    ],
    nextStep: null,
  },
];

// penjelasan singkat untuk rekomendasi pilihan psikolog (src/data/psychologist.ts RECOMMENDATIONS)
export const RECOMMENDATION_INFO: Record<string, { detail: string; kind: RecKind }> = {
  'Lanjutkan shadow teacher': { detail: 'Pendampingan yang berjalan sudah tepat, lanjutkan secara konsisten.', kind: 'teacher' },
  'Butuh shadow teacher': { detail: 'Anak akan terbantu dengan pendamping di sekolah. Cari teacher yang cocok di Dubidu.', kind: 'teacher' },
  'Terapi wicara': { detail: 'Latihan bersama terapis wicara untuk kemampuan bicara dan bahasa.', kind: 'terapi' },
  'Terapi okupasi': { detail: 'Latihan motorik dan sensori bersama terapis okupasi.', kind: 'terapi' },
  'Asesmen lanjutan': { detail: 'Pemeriksaan lebih lengkap untuk memastikan kondisi anak.', kind: 'asesmen' },
  'Jadwal bergambar di rumah': { detail: 'Buat jadwal harian bergambar agar rutinitas lebih mudah ditebak anak.', kind: 'rumah' },
  'Latihan fokus bertahap': { detail: 'Mulai dari 5 menit dengan timer visual, tambah perlahan setiap minggu.', kind: 'rumah' },
};
