import type { Href } from 'expo-router';

import type { Tone } from '@/components/parent/tones';

import type { ChatThread } from './parent';
import type { Gender } from './teacher';

// ===== akun psikolog yang login =====

export const psychologistProfile = {
  profileId: '', // id PsychologistProfile di server (untuk jadwal)
  name: 'Amanda Putri, M.Psi.',
  shortName: 'Amanda',
  title: 'M.Psi., Psikolog',
  rating: 4.9,
  reviewCount: 34,
  consultationsThisMonth: 18,
  experienceYears: 3,
  earningsThisMonth: 'Rp3,6 Jt',
  verificationsDone: 12,
  about:
    'Psikolog anak yang berfokus pada ADHD, regulasi sensori, dan tumbuh kembang. Senang mendampingi orang tua menyusun langkah kecil yang konsisten di rumah dan sekolah.',
  str: 'STR 3507 2019 0412',
  sipp: 'SIPP 0412-19-2-1',
  specializations: ['Anak & Remaja', 'ADHD', 'Sensori'],
  rate: 160000,
  method: 'Online & Tatap muka',
  schedule: 'Senin–Jumat, 09.00–15.00',
};

// ===== konsultasi =====

export type ConsultMode = 'video' | 'voice' | 'onsite';

export const MODE_LABEL: Record<ConsultMode, string> = {
  video: 'Video call',
  voice: 'Voice call',
  onsite: 'Onsite',
};

export type ConsultReport = { note: string; recommendations: string[] };

export type Consultation = {
  id: string;
  child: string;
  gender: Gender;
  age: number;
  parent: string;
  needs: string[];
  complaint: string;
  day: string;
  today: boolean;
  time: string;
  mode: ConsultMode;
  place?: string;
  companion?: { teacher: string; sessions: number; lastReport: string };
  chatId?: string;
  // konsultasi yang sudah lewat langsung punya laporan
  report?: ConsultReport;
};

export const consultations: Consultation[] = [
  {
    id: 'k-elisa',
    child: 'Elisa',
    gender: 'female',
    age: 8,
    parent: 'Devi Anggraini',
    needs: ['Speech Delay', 'Sulit Fokus'],
    complaint:
      'Elisa sudah 8 sesi didampingi shadow teacher. Kami ingin tahu apakah perkembangannya sesuai, dan latihan apa yang bisa dilakukan di rumah.',
    day: 'Hari ini',
    today: true,
    time: '10:00 – 11:00',
    mode: 'video',
    companion: { teacher: 'Kak Ayas', sessions: 8, lastReport: 'Fokus bertahan hingga 20 menit dengan timer visual.' },
    chatId: 'pc-devi',
  },
  {
    id: 'k-keenan',
    child: 'Keenan',
    gender: 'male',
    age: 7,
    parent: 'Larasita Hadi',
    needs: ['ADHD', 'Sulit Fokus'],
    complaint:
      'Keenan sudah 5 sesi didampingi shadow teacher. Kami ingin tahu apakah perkembangannya sesuai, dan latihan apa yang bisa dilakukan di rumah.',
    day: 'Hari ini',
    today: true,
    time: '13:30 – 14:30',
    mode: 'voice',
    companion: { teacher: 'Kak Gio', sessions: 5, lastReport: 'Mulai bisa menunggu giliran saat bermain kelompok.' },
    chatId: 'pc-larasati',
  },
  {
    id: 'k-bella',
    child: 'Bella',
    gender: 'female',
    age: 6,
    parent: 'Rini Hartati',
    needs: ['Membaca', 'Motorik Halus'],
    complaint: 'Bella masih kesulitan memegang pensil dan cepat lelah saat belajar membaca. Apakah perlu terapi okupasi?',
    day: 'Besok',
    today: false,
    time: '09:00 – 10:00',
    mode: 'onsite',
    place: 'Klinik Dubidu, Kota Malang',
  },
  {
    id: 'k-dafa',
    child: 'Dafa',
    gender: 'male',
    age: 5,
    parent: 'Fitri Handayani',
    needs: ['Speech Delay'],
    complaint: 'Dafa sudah bisa sekitar 30 kata tapi belum menyusun kalimat. Kami ingin tahu target yang wajar untuk usianya.',
    day: 'Jumat, 6 Nov',
    today: false,
    time: '14:00 – 15:00',
    mode: 'video',
  },
  {
    id: 'k-joceline',
    child: 'Joceline',
    gender: 'female',
    age: 9,
    parent: 'Alvin Pratama',
    needs: ['Autisme'],
    complaint: 'Joceline sering tantrum saat rutinitas pagi berubah. Bagaimana cara menyiapkannya?',
    day: 'Senin, 26 Okt',
    today: false,
    time: '11:00 – 12:00',
    mode: 'video',
    chatId: 'pc-alvin',
    report: {
      note: 'Joceline merespons baik pada jadwal bergambar. Perubahan rutinitas sebaiknya diberi aba-aba sehari sebelumnya.',
      recommendations: ['Jadwal bergambar di rumah', 'Asesmen lanjutan'],
    },
  },
  {
    id: 'k-anya',
    child: 'Anya',
    gender: 'female',
    age: 6,
    parent: 'Lia Kartika',
    needs: ['Sensorik', 'Sosial'],
    complaint: 'Anya menutup telinga dan menangis di tempat ramai. Apakah ini wajar?',
    day: 'Kamis, 22 Okt',
    today: false,
    time: '15:00 – 16:00',
    mode: 'onsite',
    place: 'Klinik Dubidu, Kota Malang',
    companion: { teacher: 'Kak Ayas', sessions: 12, lastReport: 'Mulai nyaman memakai ear-muff di kelas.' },
    report: {
      note: 'Anya menunjukkan sensitivitas pendengaran. Ear-muff dan pojok tenang di kelas sudah tepat, lanjutkan secara konsisten.',
      recommendations: ['Lanjutkan shadow teacher', 'Terapi okupasi'],
    },
  },
];

export const RECOMMENDATIONS = [
  'Lanjutkan shadow teacher',
  'Butuh shadow teacher',
  'Terapi wicara',
  'Terapi okupasi',
  'Asesmen lanjutan',
  'Jadwal bergambar di rumah',
  'Latihan fokus bertahap',
];

// ===== verifikasi shadow teacher =====

// hasil tinjauan: verified, perlu perbaikan (dengan peringatan), atau ditolak
export type VerifyStatus = 'verified' | 'revision' | 'rejected';

export type VerifyResult = { status: VerifyStatus; issues: string[]; note: string };

// pilihan peringatan umum di luar dokumen
export const GENERAL_ISSUES = ['Pengalaman belum relevan', 'Perlu interview ulang', 'Data diri tidak lengkap'];

// peringatan per dokumen: belum diunggah atau perlu diperbarui
export function documentIssue(doc: { label: string; uploaded: boolean }) {
  return doc.uploaded ? `${doc.label} tidak jelas / perlu diperbarui` : `${doc.label} belum diunggah`;
}

export type Applicant = {
  id: string;
  name: string;
  education: string;
  experience: string;
  registered: string;
  focus: string;
  skills: string[];
  about: string;
  interview: string | null;
  // url = file yang diunggah pendaftar (foto atau PDF), null untuk data contoh
  documents: { label: string; uploaded: boolean; url?: string | null }[];
  // pengajuan yang sudah selesai ditinjau sebelumnya
  result?: VerifyResult;
};

const docs = (uploaded: boolean[], degree = 'Ijazah') =>
  ['KTP', 'Foto diri', degree, 'Sertifikat pelatihan', 'CV / Portofolio'].map((label, i) => ({
    label,
    uploaded: uploaded[i],
  }));

export const applicants: Applicant[] = [
  {
    id: 'v-dimas',
    name: 'Dimas Saputra',
    education: 'S1 Pendidikan Luar Biasa · Universitas Negeri Malang',
    experience: 'Pengalaman 3 tahun',
    registered: 'Daftar 3 hari lalu',
    focus: 'Autisme & Interaksi Sosial',
    skills: ['Autisme', 'Interaksi Sosial'],
    about: 'Pernah menjadi guru pendamping di SD inklusi selama 3 tahun. Terbiasa memakai jadwal visual dan social story.',
    interview: 'Kamis, 8 Okt · 13:00 (online)',
    documents: docs([true, true, true, true, true], 'Ijazah S1 PLB'),
  },
  {
    id: 'v-nadia',
    name: 'Nadia Putri',
    education: 'S1 Psikologi · Universitas Brawijaya',
    experience: 'Pengalaman 1 tahun',
    registered: 'Daftar kemarin',
    focus: 'Speech Delay & Regulasi Emosi',
    skills: ['Speech Delay', 'Regulasi Emosi'],
    about: 'Asisten terapis wicara di klinik tumbuh kembang. Suka memakai permainan peran untuk melatih ekspresi emosi.',
    interview: 'Jumat, 9 Okt · 10:00 (online)',
    documents: docs([true, true, true, false, true], 'Ijazah S1 Psikologi'),
  },
  {
    id: 'v-rizky',
    name: 'Rizky Ananda',
    education: 'D3 Keperawatan · Poltekkes Malang',
    experience: 'Pengalaman 6 bulan',
    registered: 'Daftar hari ini',
    focus: 'Motorik Halus',
    skills: ['Motorik Halus'],
    about: 'Pernah mendampingi anak dengan keterlambatan motorik di rumah sakit anak selama 6 bulan.',
    interview: null,
    documents: docs([true, true, true, true, false], 'Ijazah D3'),
  },
  {
    id: 'v-kirana',
    name: 'Kirana Wulan',
    education: 'S1 Pendidikan PAUD · Universitas Negeri Malang',
    experience: 'Pengalaman 4 tahun',
    registered: 'Daftar minggu lalu',
    focus: 'Speech Delay & Membaca',
    skills: ['Speech Delay', 'Membaca'],
    about: 'Guru PAUD inklusi selama 4 tahun, berpengalaman melatih kesiapan membaca anak speech delay.',
    interview: 'Senin, 28 Sep · 09:00 (online)',
    documents: docs([true, true, true, true, true], 'Ijazah S1 PAUD'),
    result: { status: 'verified', issues: [], note: 'Komunikatif dan paham strategi visual.' },
  },
];

// ===== chat =====

export const psychologistChatThreads: ChatThread[] = [
  {
    id: 'pc-devi',
    name: 'Devi Anggraini',
    role: 'Orang Tua',
    verified: true,
    online: true,
    owner: 'psychologist',
    child: 'Elisa',
    preview: 'Selamat pagi Bu Devi. Terima kasih, sudah saya baca. Nanti kita bahas latihan fokus...',
    time: '08:15',
    unread: 0,
    messages: [
      {
        id: 'pd1',
        from: 'them',
        type: 'text',
        text: 'Selamat pagi Bu Amanda. Untuk konsultasi jam 10 nanti, saya lampirkan laporan sesi terakhir dari Kak Ayas ya.',
        time: '08:10',
      },
      {
        id: 'pd2',
        from: 'me',
        type: 'text',
        text: 'Selamat pagi Bu Devi. Terima kasih, sudah saya baca. Nanti kita bahas latihan fokus dan stimulasi bicara yang bisa dilanjutkan di rumah.',
        time: '08:15',
        read: true,
      },
    ],
  },
  {
    id: 'pc-larasati',
    name: 'Larasita Hadi',
    role: 'Orang Tua',
    verified: true,
    online: false,
    owner: 'psychologist',
    child: 'Keenan',
    preview: 'Okk Bu, saya konfirmasi jadwalnya ya...',
    time: 'Kemarin',
    unread: 1,
    messages: [
      { id: 'pl1', from: 'me', type: 'text', text: 'Mami, konsultasi Keenan besok lewat voice call jam 13:30 ya.', time: '19:02', read: true },
      { id: 'pl2', from: 'them', type: 'text', text: 'Okk Bu, saya konfirmasi jadwalnya ya...', time: '19:20' },
    ],
  },
  {
    id: 'pc-ayas',
    name: 'Kak Ayas',
    role: 'Shadow Teacher',
    verified: true,
    online: false,
    owner: 'psychologist',
    child: 'Anya',
    preview: 'Siap, terima kasih ya atas pendampingannya hari ini.',
    time: '08 Feb',
    unread: 0,
    done: true,
    messages: [
      { id: 'pa1', from: 'me', type: 'text', text: 'Kak Ayas, hasil observasi Anya sudah saya kirim ke Bu Lia ya.', time: '16:40', read: true },
      { id: 'pa2', from: 'them', type: 'text', text: 'Siap, terima kasih ya atas pendampingannya hari ini.', time: '16:52' },
    ],
  },
  {
    id: 'pc-alvin',
    name: 'Alvin Pratama',
    role: 'Orang Tua',
    verified: true,
    online: false,
    owner: 'psychologist',
    child: 'Joceline',
    preview: 'Siap Kak, nanti saya diskusikan dulu sama istri. Sekali lagi terima kasih banyak 🙏',
    time: '12 Jan',
    unread: 0,
    done: true,
    messages: [
      { id: 'pv1', from: 'me', type: 'text', text: 'Papi, hasil konsultasi dan rekomendasinya sudah saya kirim ya.', time: '13:10', read: true },
      {
        id: 'pv2',
        from: 'them',
        type: 'text',
        text: 'Siap Kak, nanti saya diskusikan dulu sama istri. Sekali lagi terima kasih banyak 🙏',
        time: '13:25',
      },
    ],
  },
];

// ===== notifikasi & pembayaran =====

export type PsychologistNotification = {
  id: string;
  group: 'today' | 'yesterday' | 'earlier';
  category: 'booking' | 'verifikasi' | 'chat' | 'pembayaran';
  icon: string;
  tone: Tone;
  title: string;
  time: string;
  body: string;
  action?: string;
  href: Href;
};

export const psychologistNotifications: PsychologistNotification[] = [
  {
    id: 'pn1',
    group: 'today',
    category: 'booking',
    icon: 'video-outline',
    tone: 'blue',
    title: 'Konsultasi 10:00 dengan Devi Anggraini',
    time: '09:00',
    body: 'Video call untuk Elisa (8 th, speech delay) dimulai 1 jam lagi.',
    action: 'Lihat Konsultasi',
    href: { pathname: '/psikolog/konsultasi/[id]', params: { id: 'k-elisa' } },
  },
  {
    id: 'pn2',
    group: 'today',
    category: 'verifikasi',
    icon: 'shield-star-outline',
    tone: 'yellow',
    title: '3 shadow teacher menunggu verifikasi',
    time: '08:30',
    body: 'Dimas Saputra, Nadia Putri, dan Rizky Ananda sudah melengkapi dokumen.',
    action: 'Tinjau Sekarang',
    href: '/psikolog/verifikasi',
  },
  {
    id: 'pn3',
    group: 'today',
    category: 'chat',
    icon: 'message-text-outline',
    tone: 'blue',
    title: 'Pesan baru dari Devi Anggraini',
    time: '08:10',
    body: 'Selamat pagi Bu Amanda. Saya lampirkan laporan sesi terakhir dari Kak Ayas ya.',
    href: { pathname: '/chat/[id]', params: { id: 'pc-devi' } },
  },
  {
    id: 'pn4',
    group: 'yesterday',
    category: 'booking',
    icon: 'calendar-check-outline',
    tone: 'green',
    title: 'Booking baru dari Larasita Hadi',
    time: '20:15',
    body: 'Konsultasi online lewat panggilan suara untuk Keenan (7 th) hari ini pukul 13:30.',
    action: 'Lihat Detail',
    href: { pathname: '/psikolog/konsultasi/[id]', params: { id: 'k-keenan' } },
  },
  {
    id: 'pn5',
    group: 'earlier',
    category: 'pembayaran',
    icon: 'wallet-outline',
    tone: 'green',
    title: 'Pembayaran konsultasi diterima',
    time: '28 Sep',
    body: 'Rp160.000 dari konsultasi dengan Alvin Pratama sudah masuk ke saldo.',
    href: '/psikolog/pembayaran',
  },
];

export const psychologistPayment = {
  amount: 160000,
  time: '11:15, Kemarin',
  from: 'Alvin Pratama',
  rate: 160000,
  fee: 0,
};
