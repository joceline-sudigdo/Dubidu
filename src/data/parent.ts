// data dummy untuk halaman parent, nanti diganti data dari backend
import type { Tone } from '@/components/parent/tones';

import type { Skill } from './teachers';

export const parentProfile = {
  name: 'Devi',
  fullName: 'Devi Anggraini',
  email: 'devi.anggraini@email.com',
  phone: '0812-3456-7890',
  domicile: 'Malang, Jawa Timur',
  joined: 'Jan 2026',
  sessionsDone: 48,
};

export type Child = {
  id: string;
  name: string;
  fullName: string;
  grade: string;
  condition: string;
  needs: Skill[];
  city: string;
};

export const children: Child[] = [
  {
    id: 'elisya',
    name: 'Elisya',
    fullName: 'Elisya Effriani',
    grade: '8th',
    condition: 'ADHD & Regulasi Sensori',
    needs: ['adhd', 'sensory'],
    city: 'Malang',
  },
  {
    id: 'cheryl',
    name: 'Cheryl',
    fullName: 'Cheryl Anindita',
    grade: '3rd',
    condition: 'Speech Delay',
    needs: ['speech', 'communication'],
    city: 'Malang',
  },
  {
    id: 'kiyoko',
    name: 'Kiyoko',
    fullName: 'Kiyoko Hana',
    grade: 'TK B',
    condition: 'Autism Spectrum',
    needs: ['autism', 'social'],
    city: 'Surabaya',
  },
];

export const activeTeachers = [
  { id: 'larasati', name: 'Larasati', next: 'Jumat, 15:00' },
  { id: 'sarah', name: 'Sarah', next: 'Jumat, 15:00' },
  { id: 'nielsen', name: 'Nielsen', next: 'Sabtu, 08:00' },
];

export type NotificationItem = {
  id: string;
  group: 'today' | 'yesterday' | 'week';
  category: 'chat' | 'booking' | 'laporan' | 'lainnya';
  icon: string;
  tone: Tone;
  title: string;
  time: string;
  body: string;
  quote?: boolean;
  unread: boolean;
  tag: string;
  tagTone: Tone;
  action?: string;
  actionPrimary?: boolean;
  // layar tujuan saat notifikasi dibuka (dari server)
  link?: string;
};

export const notifications: NotificationItem[] = [
  {
    id: 'n-obs',
    group: 'today',
    category: 'laporan',
    icon: 'stethoscope',
    tone: 'red',
    title: 'Laporan Observasi Psikolog',
    time: 'Baru saja',
    body: 'Amanda Putri, M.Psi. telah mengirim hasil observasi Elisya beserta 4 rekomendasi untuk di rumah dan sekolah.',
    unread: true,
    tag: 'Konsultasi 26 Okt',
    tagTone: 'red',
    action: 'Baca Laporan',
    actionPrimary: true,
  },
  {
    id: 'n1',
    group: 'today',
    category: 'booking',
    icon: 'timer-sand',
    tone: 'red',
    title: 'Selesaikan Pembayaran Sesi',
    time: '5 mnt lalu',
    body: 'Slot booking konsultasi Dr. Amanda Sp.A besok pukul 10:00 akan dilepas jika belum dibayar.',
    unread: true,
    tag: 'Batas Waktu Sesi',
    tagTone: 'red',
    action: 'Bayar Sekarang',
    actionPrimary: true,
  },
  {
    id: 'n2',
    group: 'today',
    category: 'chat',
    icon: 'message-text',
    tone: 'blue',
    title: 'Kak Larasati, S.Psi membalas',
    time: '28 mnt lalu',
    body: '"Baik Bunda Leo, untuk sesi pendampingan sensori besok kami siapkan headphone peredam ya."',
    quote: true,
    unread: true,
    tag: 'Pesan Terapis',
    tagTone: 'blue',
    action: 'Balas Pesan',
  },
  {
    id: 'n3',
    group: 'today',
    category: 'laporan',
    icon: 'clipboard-check',
    tone: 'green',
    title: 'Laporan Perkembangan Baru',
    time: '2 jam lalu',
    body: 'Kak Larasati telah mengirimkan Report Card Sesi ke-8 untuk Leo Alexander. Lonjakan fokus meningkat 25 menit!',
    unread: true,
    tag: 'Sesi #8 Terapi',
    tagTone: 'blue',
    action: 'Buka Laporan',
    actionPrimary: true,
  },
  {
    id: 'n4',
    group: 'today',
    category: 'lainnya',
    icon: 'star-four-points',
    tone: 'yellow',
    title: 'Rekomendasi Shadow Teacher',
    time: '4 jam lalu',
    body: 'Kami menemukan 2 Shadow Teacher tersertifikasi ADHD & Speech Delay di area Malang sesuai preferensi Leo.',
    unread: true,
    tag: 'Kecocokan 98%',
    tagTone: 'gray',
    action: 'Lihat Profil',
  },
  {
    id: 'n5',
    group: 'yesterday',
    category: 'booking',
    icon: 'calendar-month',
    tone: 'blue',
    title: 'Pengingat Sesi Terapi Sekolah',
    time: 'Kemarin, 16:20',
    body: 'Sesi tatap muka dengan Shadow Teacher Kak Dimas terjadwal pukul 08:30 WIB di SDN Klojen 01 Malang.',
    unread: false,
    tag: 'Jadwal Sesi',
    tagTone: 'gray',
    action: 'Terkonfirmasi',
  },
  {
    id: 'n6',
    group: 'yesterday',
    category: 'booking',
    icon: 'receipt',
    tone: 'green',
    title: 'Pembayaran Konsultasi Berhasil',
    time: 'Kemarin, 11:05',
    body: 'Kuitansi resmi sesi video call (Rp128.000) telah terbit dan tersimpan rapi di riwayat transaksi Anda.',
    unread: false,
    tag: 'Invoice #DUB-9214',
    tagTone: 'gray',
    action: 'Unduh Bukti',
  },
  {
    id: 'n7',
    group: 'week',
    category: 'lainnya',
    icon: 'heart',
    tone: 'red',
    title: 'Dukungan Hangat di Komunitas',
    time: '3 hari lalu',
    body: 'Rahma Aulia dan 4 orang tua pejuang lainnya memberikan pelukan hangat & saran pada cerita sensori Leo.',
    unread: false,
    tag: 'Komunitas Sensori Malang',
    tagTone: 'gray',
    action: 'Buka Thread',
  },
];

export type SessionReport = {
  id: string;
  date: string; // YYYY-MM-DD
  number: number;
  teacher: string;
  time: string;
  scores: { label: string; value: number; status: string; tone: Tone }[];
  dailyNote: string;
  achievement: string;
  sensoryNote: string;
  needsAttention?: boolean;
};

export const sessionReports: SessionReport[] = [
  {
    id: 's1',
    date: '2026-09-19',
    number: 1,
    teacher: 'Nielsen Dave, S.Pd',
    time: '08:00 - 11:30',
    scores: [
      { label: 'Fokus', value: 4.0, status: 'Tinggi', tone: 'blue' },
      { label: 'Sosial', value: 5.0, status: 'Optimal', tone: 'green' },
      { label: 'Sensori', value: 3.0, status: 'Sensitif', tone: 'red' },
    ],
    dailyNote: '“Hari ini Elisya menunjukkan lonjakan fokus belajar yang luar biasa!...”',
    achievement: 'Mampu menuntaskan 12 kartu konsep tanpa interupsi.',
    sensoryNote: 'Butuh headphone peredam bising saat jadwal bel sekolah.',
  },
  {
    id: 's0',
    date: '2026-09-12',
    number: 0,
    teacher: 'Nielsen Dave, S.Pd',
    time: '08:00 - 11:00',
    scores: [
      { label: 'Fokus', value: 3.0, status: 'Cukup', tone: 'yellow' },
      { label: 'Sosial', value: 4.0, status: 'Baik', tone: 'green' },
      { label: 'Sensori', value: 2.5, status: 'Sensitif', tone: 'red' },
    ],
    dailyNote: '“Elisya masih beradaptasi dengan suasana kelas yang ramai.”',
    achievement: 'Mau duduk tenang selama 15 menit pertama.',
    sensoryNote: 'Terkejut saat bunyi bel, perlu waktu tenang 5 menit.',
    needsAttention: true,
  },
];

export const reportDetail = {
  verifiedAt: '19 Sep 2026 • 18.30 WIB',
  weeklyProgress: 'Sangat Baik',
  weeklyNote: 'Konsentrasi & kemandirian melonjak signifikan',
  teacherNote: [
    'Hari ini Elisya menunjukkan lonjakan fokus belajar yang luar biasa! Elisya berhasil berkonsentrasi penuh selama **25 menit berturut-turut** saat menyelesaikan puzzle kata tematik tanpa terdistraksi suasana kelas sekitar. Inisiatif Elisya mengambil potongan huruf dan mencocokkannya mandiri adalah lompatan besar dari sesi-sesi sebelumnya.',
    'Ketika lonceng istirahat berbunyi pukul 09.30, Elisya sempat menutup kedua telinga sejenak. Namun dengan teknik kompresi lembut (deep pressure) dan afirmasi nafas selama 40 detik, Elisya dapat merespons transisi ini dengan sangat tenang tanpa tantrum.',
    'Yang paling mengharukan, Elisya secara spontan tersenyum hangat dan melakukan kontak mata langsung 3-4 detik saat diajak berbagi krayon bersama teman sebangkunya. Senang sekali melihat Elisya semakin nyaman di ruang kelas!',
  ],
  improved: ['Fokus Belajar', 'Kontak Mata Spontan', 'Kemandirian'],
  improvedNote: 'Kemajuan pesat dalam inisiatif tugas kelas tanpa pengingat berulang.',
  attention: ['Regulasi Emosi (Suara Bel)'],
  homeTip: 'Afirmasi 5 mnt sebelum bel istirahat atau suara mendadak.',
  aspects: [
    { label: 'Fokus & Konsentrasi', icon: 'head-lightbulb-outline', value: 4, trend: 'Meningkat', delta: '+1.5%', tone: 'green' as Tone },
    { label: 'Komunikasi Verbal & Isyarat', icon: 'account-voice', value: 4, trend: 'Meningkat', delta: '+0.3%', tone: 'green' as Tone },
    { label: 'Interaksi Sosial', icon: 'account-group-outline', value: 3, trend: 'Stabil', delta: '', tone: 'blue' as Tone },
    { label: 'Kemandirian & Rutinitas', icon: 'human-child', value: 4, trend: 'Meningkat', delta: '+2%', tone: 'green' as Tone },
    { label: 'Regulasi Emosi', icon: 'emoticon-confused-outline', value: 3, trend: 'Perlu Perhatian', delta: '-0.7%', tone: 'red' as Tone },
    { label: 'Kemampuan Akademik', icon: 'book-open-page-variant-outline', value: 4, trend: 'Stabil', delta: '', tone: 'blue' as Tone },
  ],
  growthScore: 3.7,
  growthDelta: '+5%',
  photos: ['Elisya menyusun balok kata (25 mnt)', 'Inisiatif mencocokkan huruf'],
};

export type ChatMessage =
  | { id: string; from: 'me' | 'them'; type: 'text'; text: string; time: string; read?: boolean }
  | { id: string; from: 'me' | 'them'; type: 'image'; uri: string; time: string; read?: boolean }
  | {
      id: string;
      from: 'me' | 'them';
      type: 'schedule';
      time: string;
      title: string;
      date: string;
      hours: string;
      place: string;
    };

export type ChatThread = {
  id: string;
  name: string;
  role: string;
  verified: boolean;
  online: boolean;
  child: string;
  preview: string;
  time: string;
  unread: number;
  owner: 'parent' | 'teacher' | 'psychologist';
  // percakapan yang pendampingan/konsultasinya sudah selesai
  done?: boolean;
  messages: ChatMessage[];
};

export const chatThreads: ChatThread[] = [
  {
    id: 'nielsen',
    name: 'Nielsen Dave, S.Pd',
    role: 'Shadow Teacher',
    verified: true,
    online: true,
    owner: 'parent',
    child: 'Elisya',
    preview: 'Ada Kak! Sebentar saya carikan PDF laporan...',
    time: '09:42',
    unread: 0,
    messages: [
      { id: 'm1', from: 'me', type: 'text', text: 'Halo Kak Nielsen! Saya sangat tertarik dengan pengalaman Kakak menangani anak speech delay di sekolah inklusi. Boleh diskusi untuk pendampingan Elisya?', time: '09:30', read: true },
      { id: 'm2', from: 'them', type: 'text', text: 'Halo Ibu Saras! Senang sekali bisa terhubung. Tentu sangat bisa Bu, saya berpengalaman dengan metode PECS dan stimulasi wicara aktif di kelas.', time: '09:34' },
      { id: 'm3', from: 'them', type: 'schedule', time: '09:38', title: 'Sesi Observasi Pertama', date: 'Sabtu, 19 September 2026', hours: '08:00 - 11:30 WIB (Sekolah)', place: 'SDN Klojen 01, Kota Malang' },
      { id: 'm4', from: 'them', type: 'text', text: 'Apakah Ibu ada rekam asesmen awal atau daftar kata yang sering memicu tantrum saat di kelas?', time: '09:40' },
      { id: 'm5', from: 'me', type: 'text', text: 'Ada Kak! Sebentar saya carikan PDF laporan dari psikolog anak bulan lalu ya.', time: '09:42', read: true },
    ],
  },
  {
    id: 'larasati',
    name: 'Larasati Sudigdo, S.Psi',
    role: 'Shadow Teacher',
    verified: true,
    online: false,
    owner: 'parent',
    child: 'Cheryl',
    preview: 'Mam, bolehkan Cheryl makan es krim untuk siang ini?',
    time: '08:15',
    unread: 2,
    messages: [
      { id: 'l1', from: 'them', type: 'text', text: 'Selamat pagi Mam! Cheryl sudah sampai di kelas dengan ceria.', time: '07:10' },
      { id: 'l2', from: 'them', type: 'text', text: 'Mam, bolehkan Cheryl makan es krim untuk siang ini?', time: '08:15' },
    ],
  },
  {
    id: 'amanda',
    name: 'Amanda Putri, M.Psi.',
    role: 'Psikolog Anak',
    verified: true,
    online: false,
    owner: 'parent',
    child: 'Elisya',
    preview: 'Sampai jumpa di sesi konsultasi Selasa ya Bunda.',
    time: 'Kemarin',
    unread: 0,
    messages: [
      { id: 'a1', from: 'them', type: 'text', text: 'Sampai jumpa di sesi konsultasi Selasa ya Bunda.', time: '16:02' },
    ],
  },
];

export const quickQuestion = {
  id: '', // id pertanyaan di server
  from: 'Larasati Sudigdo',
  text: 'Mam, bolehkan cheryl makan es krim untuk siang ini?',
};

export type CommunityPost = {
  id: string;
  author: string;
  role: 'Orang Tua' | 'Shadow Teacher' | 'Psikolog';
  time: string;
  text: string;
  photos: number;
  likes: number;
  comments: number; // jumlah komentar contoh yang dibuat untuk postingan ini
  topic: 'ADHD' | 'Autism' | 'Speech Delay';
};

export const communityPosts: CommunityPost[] = [
  {
    id: 'p0',
    author: 'Amanda Putri, M.Psi.',
    role: 'Psikolog',
    time: 'Diposting 1 jam lalu',
    text: 'Tips transisi untuk anak sensitif suara: beri aba-aba visual 5 menit sebelum bel berbunyi dan siapkan "pojok tenang" di kelas. Konsisten 2 minggu biasanya mulai terlihat hasilnya 💙',
    photos: 0,
    likes: 1100,
    comments: 7,
    topic: 'Autism',
  },
  {
    id: 'p-teacher',
    author: 'Pras Karunia, S.Pd',
    role: 'Shadow Teacher',
    time: 'Diposting 4 jam lalu',
    text: 'Hari ini Elisya berhasil fokus 25 menit tanpa terdistraksi! Token board sederhana ternyata sangat membantu. Semangat untuk semua pendamping hebat di luar sana 🙌',
    photos: 1,
    likes: 642,
    comments: 4,
    topic: 'ADHD',
  },
  {
    id: 'p1',
    author: 'Rahma Aulia',
    role: 'Orang Tua',
    time: 'Diposting 3 menit lalu',
    text: 'Hari pertama Arka mau pakai ear-muff di tempat ramai tanpa rewel! Ternyata sounding visual 3 hari sebelumnya sangat membantu. Untuk Ayah/Bunda yang sedang berjuang, pelan-pelan ya, setiap langkah kecil adalah kemenangan besar..',
    photos: 0,
    likes: 3200,
    comments: 9,
    topic: 'Autism',
  },
  {
    id: 'p2',
    author: 'Wulan Anggita',
    role: 'Orang Tua',
    time: 'Diposting 2 jam lalu',
    text: 'Masyallah, hari ini Dimas menyusun balok huruf sambil mengucapkannya dengan jelas... Air mata haru gak bisa ditahan 🥹',
    photos: 3,
    likes: 2500,
    comments: 5,
    topic: 'Speech Delay',
  },
  {
    id: 'p3',
    author: 'Ratna Sari',
    role: 'Orang Tua',
    time: 'Diposting 5 jam lalu',
    text: 'Ada yang punya tips supaya anak ADHD bisa fokus mengerjakan PR lebih dari 10 menit? Kirana masih sering beralih ke mainan lain.',
    photos: 1,
    likes: 13,
    comments: 3,
    topic: 'ADHD',
  },
];

export type Psychologist = {
  id: string;
  name: string;
  title: string;
  badge: string;
  badgeTone: Tone;
  badgeIcon?: 'star' | 'circle';
  rating: number;
  reviews: number;
  experience: string;
  place: string;
  tags: string[];
  categories: ('ADHD' | 'Autisme' | 'Speech Delay')[];
  priceLabel?: string;
  basePrice: number;
  discountPercent: number;
  duration: number;
};

export const psychologists: Psychologist[] = [
  {
    id: 'amanda',
    name: 'Amanda Putri, M.Psi., Psikolog',
    title: 'Psikolog Anak & Sensori',
    badge: 'Top Rated',
    badgeTone: 'yellow',
    badgeIcon: 'star',
    rating: 4.9,
    reviews: 34,
    experience: '3 tahun pengalaman',
    place: 'RSIA Bunda Jakarta',
    tags: ['Anak & Remaja', 'ADHD & Sensori'],
    categories: ['ADHD'],
    basePrice: 160000,
    discountPercent: 20,
    duration: 45,
  },
  {
    id: 'dimas',
    name: 'Dimas Wicaksono, S.Psi.',
    title: 'Psikolog Wicara & Komunikasi',
    badge: 'Online Sekarang',
    badgeTone: 'green',
    badgeIcon: 'circle',
    rating: 4.8,
    reviews: 20,
    experience: '2 tahun pengalaman',
    place: 'Pusat Terapi Anak',
    tags: ['Speech Delay', 'Komunikasi PECS', 'GDD (Global Delay)'],
    categories: ['Speech Delay'],
    priceLabel: 'Biaya Terjadwal',
    basePrice: 80000,
    discountPercent: 0,
    duration: 45,
  },
  {
    id: 'reni',
    name: 'dr. Reni Anggraini, Sp.A',
    title: 'Dokter Spesialis Anak',
    badge: 'Dubidu Expert',
    badgeTone: 'blue',
    rating: 5.0,
    reviews: 215,
    experience: '14 tahun pengalaman',
    place: 'Senior Klinis',
    tags: ['Autisme (ASD)', 'Konseling Ortu', 'Sensori & Motorik'],
    categories: ['Autisme'],
    priceLabel: 'Konsultasi Khusus',
    basePrice: 200000,
    discountPercent: 0,
    duration: 60,
  },
  {
    id: 'farhan',
    name: 'dr. Farhan Alatas, Sp.KFR',
    title: 'Dokter & Terapis Tumbuh Kembang',
    badge: 'Dokter & Terapis',
    badgeTone: 'green',
    rating: 4.8,
    reviews: 76,
    experience: '5 tahun pengalaman',
    place: 'Poliklinik Tumbuh Kembang',
    tags: ['Sensory Processing', 'Tumbuh Kembang', 'Regulasi Diri'],
    categories: ['ADHD', 'Autisme'],
    priceLabel: 'Biaya Konsultasi',
    basePrice: 150000,
    discountPercent: 0,
    duration: 45,
  },
];

export function finalPrice(p: Psychologist) {
  return p.basePrice - (p.basePrice * p.discountPercent) / 100;
}

export const consultationTypes = [
  { id: 'video', label: 'Video Call', hint: 'Paling Populer', icon: 'video' as const },
  { id: 'call', label: 'Panggilan', hint: 'Suara Jernih', icon: 'phone' as const },
  { id: 'chat', label: 'Chat', hint: 'Fleksibel', icon: 'message-square' as const },
];

export const consultationDates = [
  { id: '22', day: 'Sen', date: 22, status: 'few' as const },
  { id: '23', day: 'Sel', date: 23, status: 'open' as const },
  { id: '24', day: 'Rab', date: 24, status: 'few' as const },
  { id: '25', day: 'Kam', date: 25, status: 'full' as const },
  { id: '26', day: 'Jum', date: 26, status: 'open' as const },
];

export const consultationTimes = [
  { time: '09:00', status: 'open' as const },
  { time: '10:30', status: 'open' as const },
  { time: '13:00', status: 'last' as const },
  { time: '14:30', status: 'full' as const },
  { time: '16:00', status: 'open' as const },
  { time: '19:00', status: 'open' as const },
];

export const PROMO_CODE = 'DUBIDUSAYANG';

export function formatRupiah(value: number) {
  return `Rp${value.toLocaleString('id-ID').replace(/,/g, '.')}`;
}

export const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatLongDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAYS[date.getDay()]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

export type ActiveMatch = {
  id: string;
  teacher: string;
  chatId: string;
  online: boolean;
  child: string;
  tags: { label: string; tone: Tone }[];
  nextSession: string;
  done: number;
  total: number;
  phase: string;
};

export const activeMatches: ActiveMatch[] = [
  {
    id: 'm-nielsen',
    teacher: 'Nielsen Dave, S.Pd',
    chatId: 'nielsen',
    online: true,
    child: 'Elisya',
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
    id: 'm-larasati',
    teacher: 'Larasati Sudigdo, S.Psi',
    chatId: 'larasati',
    online: false,
    child: 'Cheryl',
    tags: [
      { label: 'ADHD', tone: 'red' },
      { label: 'Sensorik', tone: 'blue' },
    ],
    nextSession: 'Sabtu, 10:00',
    done: 3,
    total: 8,
    phase: 'Fase Adaptasi',
  },
];

export type Application = {
  id: string;
  teacher: string;
  specialty: string;
  child: string;
  date: string;
  status: 'accepted' | 'pending' | 'rejected';
};

export const applications: Application[] = [
  { id: 'a1', teacher: 'Nielsen Dave, S.Pd', specialty: 'Speech Delay', child: 'Elisya', date: '10 Agu 2026', status: 'accepted' },
  { id: 'a2', teacher: 'Sarah Putri, S.Pd', specialty: 'Autism Spectrum', child: 'Kiyoko', date: '12 Sep 2026', status: 'pending' },
  { id: 'a3', teacher: 'Kevin Aditya, S.Psi', specialty: 'ADHD & Fokus', child: 'Elisya', date: '18 Jun 2026', status: 'rejected' },
  { id: 'a4', teacher: 'Citra Sari, S.Pd', specialty: 'Sensori Integrasi', child: 'Cheryl', date: '21 Jul 2026', status: 'rejected' },
  { id: 'a5', teacher: 'Larasati Sudigdo, S.Psi', specialty: 'ADHD & Sensorik', child: 'Cheryl', date: '15 Jan 2026', status: 'accepted' },
];
