// data dummy untuk role shadow teacher, nanti diganti data dari backend
import type { Href } from 'expo-router';

import type { Tone } from '@/components/parent/tones';

import type { ChatThread } from './parent';
import { SKILL_LABELS, type Skill } from './teachers';

export type Gender = 'male' | 'female';

export const teacherProfile = {
  verified: true, // sudah diverifikasi admin (dari server)
  name: 'Pras Karunia, S.Pd',
  shortName: 'Pras',
  title: 'Spesialis ADHD & Speech Delay',
  city: 'Malang',
  rating: 4.9,
  reviewCount: 28,
  sessionsDone: 48,
  joined: 'Jan 2026',
  responseRate: '95%',
  about:
    'Pendamping berpengalaman 4 tahun untuk anak dengan ADHD dan speech delay. Sabar, komunikatif, dan senang belajar hal baru dari setiap anak.',
  specializations: [
    { label: 'Speech Delay', tone: 'green' as Tone },
    { label: 'ADHD & Fokus', tone: 'red' as Tone },
    { label: 'Sensori Integrasi', tone: 'blue' as Tone },
    { label: 'Membaca', tone: 'gray' as Tone },
    { label: 'Interaksi Sosial', tone: 'yellow' as Tone },
  ],
  price: 'Rp150.000/jam',
  availability: 'Senin-Jumat, sore hari',
  skills: { speech: 90, communication: 84, adhd: 92, sensory: 78, social: 70, autism: 62, academic: 75 } as Record<Skill, number>,
  earnings: { total: 'Rp1.2 Jt', growth: '+14% minggu ini' },
  target: { done: 12, total: 16 },
  reviews: [
    { name: 'Larasita Hadi', rating: 5, text: '“Kak Pras sangat sabar dan komunikatif, Keenan jadi lebih percaya diri.”' },
    { name: 'Alvin Pratama', rating: 5, text: '“Pendampingan sangat terstruktur dan laporan hariannya selalu detail.”' },
  ],
};

export type Student = {
  id: string;
  name: string;
  fullName: string;
  grade: string;
  condition: string;
  gender: Gender;
  age: number;
  parent: string;
  chatId: string;
  tags: { label: string; tone: Tone }[];
  nextSession: string;
  done: number;
  total: number;
  phase: string;
};

export const students: Student[] = [
  {
    id: 'elisya',
    name: 'Elisya',
    fullName: 'Elisya Effriani',
    grade: '8th',
    condition: 'ADHD & Regulasi Sensori',
    gender: 'female',
    age: 8,
    parent: 'Sarah Wijaya',
    chatId: 'tc-sarah',
    tags: [
      { label: 'Speech Delay', tone: 'green' },
      { label: 'Sulit Fokus', tone: 'red' },
    ],
    nextSession: 'Jumat, 15:00',
    done: 8,
    total: 12,
    phase: 'Target Smt 1',
  },
  {
    id: 'kenneth',
    name: 'Kenneth',
    fullName: 'Kenneth Pratama',
    grade: '7th',
    condition: 'ADHD & Sensorik',
    gender: 'male',
    age: 7,
    parent: 'Laras Setiawati',
    chatId: 'tc-larasati',
    tags: [
      { label: 'ADHD', tone: 'red' },
      { label: 'Sensorik', tone: 'blue' },
    ],
    nextSession: 'Sabtu, 10:00',
    done: 3,
    total: 8,
    phase: 'Fase Adaptasi',
  },
  {
    id: 'bella',
    name: 'Bella',
    fullName: 'Bella Anastasya',
    grade: '3rd',
    condition: 'Speech Delay',
    gender: 'female',
    age: 9,
    parent: 'Rini Hartati',
    chatId: 'tc-rini',
    tags: [{ label: 'Speech Delay', tone: 'green' }],
    nextSession: 'Senin, 14:00',
    done: 10,
    total: 12,
    phase: 'Hampir Selesai',
  },
];

export const todaySchedule = { time: '14:00', child: 'Elisya' };

export type ApplicationStatus = 'accepted' | 'pending' | 'rejected';

export const activeApplications: { id: string; initials: string; gender: Gender; info: string; status: ApplicationStatus }[] = [
  { id: 'aa1', initials: 'NPS', gender: 'female', info: '12th - ADHD', status: 'pending' },
  { id: 'aa2', initials: 'Kenneth', gender: 'male', info: '7th - SPEECH', status: 'accepted' },
  { id: 'aa3', initials: 'AR', gender: 'male', info: '11th - SENSORI', status: 'rejected' },
];

export const teacherApplications: {
  id: string;
  initials: string;
  age: number;
  gender: Gender;
  date: string;
  status: ApplicationStatus;
}[] = [
  { id: 'h1', initials: 'Elisya', age: 8, gender: 'female', date: '10 Agu 2026', status: 'accepted' },
  { id: 'h2', initials: 'NPS', age: 12, gender: 'female', date: '12 Sep 2026', status: 'pending' },
  { id: 'h3', initials: 'KAS', age: 7, gender: 'female', date: '18 Jun 2026', status: 'rejected' },
  { id: 'h4', initials: 'CCS', age: 7, gender: 'male', date: '21 Jul 2026', status: 'rejected' },
  { id: 'h5', initials: 'JS', age: 14, gender: 'male', date: '21 Jul 2026', status: 'rejected' },
  { id: 'h6', initials: 'Rayhan', age: 10, gender: 'male', date: '15 Jan 2026', status: 'accepted' },
];

export const teacherChatThreads: ChatThread[] = [
  {
    id: 'tc-sarah',
    name: 'Sarah Wijaya',
    role: 'Orang Tua',
    verified: true,
    online: true,
    owner: 'teacher',
    child: 'Elisya',
    preview: 'Terima kasih Kak Pras, besok Elisya bawa headphone ya.',
    time: '10:12',
    unread: 1,
    messages: [
      { id: 'ts1', from: 'me', type: 'text', text: 'Selamat pagi Bunda! Hari ini Elisya fokus 25 menit penuh saat menyusun puzzle kata 🎉', time: '09:58', read: true },
      { id: 'ts2', from: 'them', type: 'text', text: 'Wah senang sekali dengarnya Kak! Terima kasih Kak Pras, besok Elisya bawa headphone ya.', time: '10:12' },
    ],
  },
  {
    id: 'tc-larasati',
    name: 'Laras Setiawati',
    role: 'Orang Tua',
    verified: true,
    online: false,
    owner: 'teacher',
    child: 'Kenneth',
    preview: 'Baik Kak, jadwal Sabtu jam 10 aman.',
    time: 'Kemarin',
    unread: 0,
    messages: [
      { id: 'tl1', from: 'me', type: 'text', text: 'Bunda, untuk sesi Sabtu apakah tetap jam 10:00?', time: '18:20', read: true },
      { id: 'tl2', from: 'them', type: 'text', text: 'Baik Kak, jadwal Sabtu jam 10 aman.', time: '18:41' },
    ],
  },
];

teacherChatThreads.push({
  id: 'tc-rini',
  name: 'Rini Hartati',
  role: 'Orang Tua',
  verified: true,
  online: false,
  owner: 'teacher',
  child: 'Bella',
  preview: 'Siap Kak, Bella sudah semangat latihan membaca.',
  time: 'Senin',
  unread: 0,
  messages: [
    { id: 'tr1', from: 'me', type: 'text', text: 'Mama, minggu ini Bella lancar membaca 3 kalimat pendek 👏', time: '16:05', read: true },
    { id: 'tr2', from: 'them', type: 'text', text: 'Siap Kak, Bella sudah semangat latihan membaca.', time: '16:20' },
  ],
});

export type TeacherNotification = {
  id: string;
  group: 'today' | 'yesterday';
  category: 'match' | 'chat' | 'booking' | 'laporan' | 'lainnya';
  icon: string;
  tone: Tone;
  title: string;
  time: string;
  body: string;
  quote?: boolean;
  action?: string;
  href: Href;
};

export const teacherNotifications: TeacherNotification[] = [
  {
    id: 'tn1',
    group: 'today',
    category: 'laporan',
    icon: 'clipboard-alert-outline',
    tone: 'red',
    title: 'Tenggat Laporan Sesi 8 Elisya',
    time: '15 mnt lalu',
    body: 'Laporan mingguan pendampingan sensori Elisya hampir jatuh tempo hari ini pukul 23:59.',
    action: 'Tulis Laporan',
    href: '/teacher/laporan-harian',
  },
  {
    id: 'tn2',
    group: 'today',
    category: 'match',
    icon: 'check',
    tone: 'green',
    title: 'Permintaan Match',
    time: '45 mnt lalu',
    body: 'Mencari shadow teacher untuk Arka (7 thn, ADHD & Sensori). Area Sukun, Kota Malang.',
    action: 'Terima Tawaran',
    href: { pathname: '/teacher/permintaan/[id]', params: { id: 'c-arka' } },
  },
  {
    id: 'tn3',
    group: 'yesterday',
    category: 'lainnya',
    icon: 'star-outline',
    tone: 'yellow',
    title: 'Ulasan Baru!',
    time: '16:30',
    body: '“Kak thankyou banget udah sabar ngedampingi Elisya untuk motoriknya, sekarang udah lebih pede pegang pensil sendiri.”',
    quote: true,
    action: 'Balas Ulasan',
    href: '/teacher/ulasan',
  },
  {
    id: 'tn4',
    group: 'yesterday',
    category: 'booking',
    icon: 'credit-card-outline',
    tone: 'green',
    title: 'Pembayaran Jasa',
    time: '11:15',
    body: 'Pembayaran sebesar Rp450.000,00 sudah masuk ke rekening mu.',
    href: '/teacher/pembayaran',
  },
];

export const paymentDetail = {
  amount: 450000,
  time: '11:15, Kemarin',
  forLabel: 'Elisya · Sesi ke-5',
  rateLabel: 'Tarif per 5 sesi',
  rate: 500000,
  fee: 50000,
};

export const reviewDetail = {
  name: 'Saras Elizabeth',
  time: '16:30, hari ini',
  rating: 5,
  text: '“Kak thankyou banget udah sabar ngedampingi Elisya untuk motoriknya, sekarang udah lebih pede pegang pensil sendiri.”',
  tag: 'Sensorik & Motorik',
};

export type TeacherSession = {
  id?: string; // id sesi di server (untuk mengirim laporan)
  reportId?: string | null; // report card yang sudah dikirim
  date: string;
  student: string;
  number: number;
  time: string;
  reportDone: boolean;
  attention?: boolean;
};

export const teacherSessions: TeacherSession[] = [
  { date: '2026-09-02', student: 'elisya', number: 1, time: '09:00 - 12:30', reportDone: true },
  { date: '2026-09-05', student: 'elisya', number: 2, time: '09:00 - 12:30', reportDone: true },
  { date: '2026-09-08', student: 'elisya', number: 3, time: '09:00 - 12:30', reportDone: true, attention: true },
  { date: '2026-09-10', student: 'elisya', number: 4, time: '09:00 - 12:30', reportDone: true },
  { date: '2026-09-12', student: 'elisya', number: 5, time: '08:00 - 11:30', reportDone: true },
  { date: '2026-09-15', student: 'elisya', number: 8, time: '09:00 - 12:30', reportDone: true },
  { date: '2026-09-19', student: 'elisya', number: 9, time: '08:00 - 11:30', reportDone: false },
  { date: '2026-09-22', student: 'elisya', number: 10, time: '09:00 - 12:30', reportDone: false },
  { date: '2026-09-24', student: 'elisya', number: 11, time: '09:00 - 12:30', reportDone: false },
  { date: '2026-09-26', student: 'elisya', number: 12, time: '08:00 - 11:30', reportDone: false },
  { date: '2026-09-11', student: 'kenneth', number: 1, time: '10:00 - 12:00', reportDone: true },
  { date: '2026-09-18', student: 'kenneth', number: 2, time: '10:00 - 12:00', reportDone: true, attention: true },
  { date: '2026-09-25', student: 'kenneth', number: 3, time: '10:00 - 12:00', reportDone: false },
  { date: '2026-09-07', student: 'bella', number: 9, time: '14:00 - 16:00', reportDone: true },
  { date: '2026-09-14', student: 'bella', number: 10, time: '14:00 - 16:00', reportDone: false },
];

/** Tandai sesi sudah punya laporan (setelah laporan harian terkirim) */
export function markSessionReported(sessionId: string, reportId: string) {
  const i = teacherSessions.findIndex((s) => s.id === sessionId);
  if (i >= 0) teacherSessions[i] = { ...teacherSessions[i], reportDone: true, reportId };
}

// ===== anak yang sedang mencari shadow teacher =====

export type SeekingChild = {
  id: string;
  initials: string;
  age: number;
  gender: Gender;
  city: string;
  area: string;
  needs: Skill[];
  frequency: string;
  timeOfDay: string;
  days: string;
  hours: string;
  system: string;
  goal: string;
  note: string;
  parent: string;
  parentRating: number;
  parentReviews: number;
  budget: number;
  distanceKm: number;
  // id pengajuan dari orang tua (halaman Permintaan), kalau anak ini datang dari permintaan
  requestId?: string | null;
};

export const seekingChildren: SeekingChild[] = [
  { id: 'c-arka', initials: 'Arka', age: 7, gender: 'male', city: 'Malang', area: 'Sukun, Kota Malang', needs: ['adhd', 'sensory'], frequency: '2x Seminggu', timeOfDay: 'Sore hari', days: 'Senin & Kamis', hours: '15:30 – 17:00 WIB (90 menit)', system: 'Kunjungan langsung ke rumah (Home visit)', goal: 'Lebih tenang dan fokus saat transisi aktivitas belajar di rumah', note: 'Orang tua Arka mencari shadow teacher yang sabar dalam melatih fokus sensorik dan membangun rutinitas transisi harian dengan pendekatan menyenangkan.', parent: 'Ratna Sari', parentRating: 4.9, parentReviews: 5, budget: 150000, distanceKm: 3 },
  { id: 'c-kas', initials: 'KAS', age: 7, gender: 'female', city: 'Kediri', area: 'Mojoroto, Kediri', needs: ['adhd'], frequency: '2x Seminggu', timeOfDay: 'Pagi hari', days: 'Selasa & Jumat', hours: '08:00 – 11:00 WIB (180 menit)', system: 'Pendampingan di sekolah', goal: 'Bisa mengikuti pelajaran kelas 1 tanpa sering keluar kelas', note: 'KAS aktif dan ceria, butuh pendamping yang tegas namun hangat.', parent: 'Sinta Maharani', parentRating: 4.9, parentReviews: 2, budget: 140000, distanceKm: 95 },
  { id: 'c-nps', initials: 'NPS', age: 12, gender: 'female', city: 'Malang', area: 'Lowokwaru, Kota Malang', needs: ['adhd', 'academic'], frequency: '3x Seminggu', timeOfDay: 'Sore hari', days: 'Senin, Rabu, Jumat', hours: '15:00 – 16:30 WIB (90 menit)', system: 'Kunjungan langsung ke rumah (Home visit)', goal: 'Mengerjakan PR mandiri dan fokus belajar menjelang ujian', note: 'NPS cerdas tapi mudah terdistraksi gawai.', parent: 'Putri Ayuningtyas', parentRating: 4.7, parentReviews: 3, budget: 160000, distanceKm: 5 },
  { id: 'c-dafa', initials: 'DFA', age: 5, gender: 'male', city: 'Malang', area: 'Blimbing, Kota Malang', needs: ['speech', 'communication'], frequency: '2x Seminggu', timeOfDay: 'Pagi hari', days: 'Selasa & Kamis', hours: '09:00 – 10:30 WIB (90 menit)', system: 'Pendampingan di TK', goal: 'Menambah kosakata dan berani meminta tolong di kelas', note: 'Dafa sudah bisa 30 kata, orang tua ingin melatih kalimat sederhana.', parent: 'Fitri Handayani', parentRating: 5.0, parentReviews: 4, budget: 130000, distanceKm: 6 },
  { id: 'c-ccs', initials: 'CCS', age: 7, gender: 'male', city: 'Batu', area: 'Junrejo, Batu', needs: ['sensory', 'social'], frequency: '2x Seminggu', timeOfDay: 'Sore hari', days: 'Rabu & Sabtu', hours: '14:00 – 15:30 WIB (90 menit)', system: 'Kunjungan langsung ke rumah (Home visit)', goal: 'Lebih nyaman bermain bersama teman sebaya', note: 'CCS sensitif terhadap suara keras dan keramaian.', parent: 'Lia Kartika', parentRating: 4.8, parentReviews: 6, budget: 150000, distanceKm: 18 },
  { id: 'c-rara', initials: 'RRA', age: 6, gender: 'female', city: 'Malang', area: 'Klojen, Kota Malang', needs: ['speech', 'social'], frequency: '2x Seminggu', timeOfDay: 'Pagi hari', days: 'Senin & Rabu', hours: '08:00 – 10:00 WIB (120 menit)', system: 'Pendampingan di sekolah', goal: 'Berani bicara di depan kelas dan menjawab pertanyaan guru', note: 'Rara pemalu tapi suka menggambar.', parent: 'Dewi Safitri', parentRating: 4.9, parentReviews: 8, budget: 145000, distanceKm: 2 },
  { id: 'c-js', initials: 'JS', age: 14, gender: 'male', city: 'Surabaya', area: 'Rungkut, Surabaya', needs: ['autism', 'social'], frequency: '3x Seminggu', timeOfDay: 'Sore hari', days: 'Senin, Rabu, Jumat', hours: '15:00 – 17:00 WIB (120 menit)', system: 'Kunjungan langsung ke rumah (Home visit)', goal: 'Membangun kemandirian dan keterampilan sosial remaja', note: 'JS suka komputer, butuh pendekatan visual.', parent: 'Hendra Wijaya', parentRating: 4.6, parentReviews: 2, budget: 170000, distanceKm: 90 },
  { id: 'c-alif', initials: 'ALF', age: 8, gender: 'male', city: 'Malang', area: 'Kedungkandang, Kota Malang', needs: ['adhd', 'communication'], frequency: '2x Seminggu', timeOfDay: 'Sore hari', days: 'Selasa & Kamis', hours: '15:30 – 17:00 WIB (90 menit)', system: 'Kunjungan langsung ke rumah (Home visit)', goal: 'Mengelola emosi saat kalah bermain dan menyampaikan perasaan', note: 'Alif mudah frustrasi, butuh pendamping yang sabar.', parent: 'Nisa Rahmawati', parentRating: 4.8, parentReviews: 3, budget: 140000, distanceKm: 7 },
  { id: 'c-sasa', initials: 'SSA', age: 9, gender: 'female', city: 'Malang', area: 'Lowokwaru, Kota Malang', needs: ['academic', 'adhd'], frequency: '2x Seminggu', timeOfDay: 'Sore hari', days: 'Rabu & Jumat', hours: '15:00 – 16:30 WIB (90 menit)', system: 'Kunjungan langsung ke rumah (Home visit)', goal: 'Mengejar ketertinggalan membaca dan berhitung', note: 'Sasa semangat belajar tapi cepat lelah.', parent: 'Ayu Lestari', parentRating: 4.7, parentReviews: 5, budget: 135000, distanceKm: 4 },
  { id: 'c-gilang', initials: 'GLG', age: 6, gender: 'male', city: 'Batu', area: 'Bumiaji, Batu', needs: ['speech', 'sensory'], frequency: '2x Seminggu', timeOfDay: 'Pagi hari', days: 'Senin & Kamis', hours: '09:00 – 10:30 WIB (90 menit)', system: 'Pendampingan di TK', goal: 'Bisa mengikuti instruksi sederhana di kelas', note: 'Gilang suka musik, bisa jadi media belajar.', parent: 'Rina Oktaviani', parentRating: 4.9, parentReviews: 4, budget: 130000, distanceKm: 20 },
];

export const CHILD_MATCH_COUNT = 5;
export const CHILD_MAX_SKIPS = 5;

// skor kecocokan dari server: serverChildMatch[childId] = 0–99
export const serverChildMatch: Record<string, number> = {};

export function childMatchScore(child: SeekingChild) {
  if (serverChildMatch[child.id] !== undefined) return serverChildMatch[child.id];
  const skill = child.needs.reduce((sum, k) => sum + teacherProfile.skills[k], 0) / child.needs.length;
  const location = child.city === teacherProfile.city ? 100 : child.distanceKm < 30 ? 75 : 45;
  const rating = (child.parentRating / 5) * 100;
  return Math.min(99, Math.round(skill * 0.7 + location * 0.2 + rating * 0.1));
}

export function initialChildMatches() {
  return [...seekingChildren].sort((a, b) => childMatchScore(b) - childMatchScore(a)).slice(0, CHILD_MATCH_COUNT);
}

// pengganti anak yang di-skip: kebutuhan paling mirip tapi tetap cocok dengan keahlian teacher
export function findChildReplacement(skipped: SeekingChild, excludeIds: string[]) {
  const overlap = (c: SeekingChild) => c.needs.filter((n) => skipped.needs.includes(n)).length * 15;
  const candidates = seekingChildren.filter((c) => !excludeIds.includes(c.id));
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => childMatchScore(b) + overlap(b) - (childMatchScore(a) + overlap(a)))[0];
}

export function needLabels(needs: Skill[]) {
  return needs.map((n) => SKILL_LABELS[n]);
}

// ===== draft laporan =====

export const weeklyReportDraft = {
  observation:
    'Elisya memulai sesi dengan antusias saat diajak menyusun balok warna. Mampu menyelesaikan instruksi bertahap tanpa resistensi dan menunjukkan kontak visual yang hangat.',
  improved: ['Fokus Belajar', 'Kontak Mata Spontan'],
  improvedSummary: 'Mampu mempertahankan fokus hingga 20 menit',
  attention: ['Regulasi Emosi (Suara Bel)', 'Sensitivitas Suara Keras'],
  homeTip: 'Gunakan headphone peredam bising saat transisi',
  aspects: [
    { label: 'Fokus & Konsentrasi', icon: 'target', value: 4 },
    { label: 'Komunikasi Verbal & Isyarat', icon: 'message-square', value: 4 },
    { label: 'Interaksi Sosial', icon: 'users', value: 3 },
    { label: 'Kemandirian & Rutinitas', icon: 'list', value: 4 },
    { label: 'Regulasi Emosi', icon: 'heart', value: 3 },
    { label: 'Kemampuan Akademik', icon: 'book-open', value: 5 },
  ],
};

export const finalReportDraft = {
  highlight: 'Peningkatan signifikan pada Fokus dan Kemandirian',
  summary:
    'Elisya menunjukkan kemajuan pesat dalam transisi kegiatan sekolah dan mampu mengikuti instruksi mandiri tanpa pendampingan intensif.',
  comparisons: [
    { label: 'Fokus & Konsentrasi', icon: 'target', first: 2, last: 4, change: '+40%' },
    { label: 'Komunikasi & Isyarat', icon: 'message-square', first: 3, last: 4, change: '+20%' },
    { label: 'Interaksi Sosial', icon: 'users', first: 3, last: 3, change: '+30%' },
    { label: 'Kemandirian', icon: 'user-check', first: 2, last: 3, change: '+60%' },
  ],
  closing:
    'Refleksi menyeluruh tentang perjalanan pendampingan selama program ini... Elisya adalah anak yang sangat kreatif dan responsif terhadap stimulasi visual. Kami bangga melihat bagaimana ia mulai berani berinisiatif saat belajar kelompok.',
  recommendations: ['Lanjutkan Sesi Rutin', 'Rujuk ke Psikolog', 'Kurangi Frekuensi', 'Program Selesai'],
  recommendationNote: 'Disarankan untuk sesi evaluasi berkala 1x per bulan bersama psikolog tumbuh kembang.',
};

export const dailyActivities = ['Membaca', 'Interaksi Sosial', 'Fokus Belajar', 'Motorik Halus', 'Menghitung', 'Menulis'];
